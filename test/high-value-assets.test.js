const test = require('node:test')
const assert = require('node:assert/strict')
const render = require('snabbdom-to-html')

const {
  calculateCirculatingDollarAmount,
  formatDollarAmount,
  getPriceFeedApiBase
} = require('../client/src/lib/high-value-assets')
const { highValueAssetDefinitions } = require('../client/src/const')
const { highValueAssets } = require('../client/src/components/high-value-assets')

test('builds a price feed base from absolute and relative API URLs', () => {
  assert.equal(
    getPriceFeedApiBase('https://blockstream.info/liquid/api'),
    'https://blockstream.info/price'
  )
  assert.equal(
    getPriceFeedApiBase('/liquid/api', 'https://blockstream.info'),
    'https://blockstream.info/price'
  )
})

test('calculates circulating USD value from confirmed and mempool issuance and burns', () => {
  const asset = {
    precision: 8,
    chain_stats: { issued_amount: 150000000, burned_amount: 10000000 },
    mempool_stats: { issued_amount: 50000000, burned_amount: 20000000 }
  }

  assert.equal(calculateCirculatingDollarAmount(asset, { price_usd: 3 }), 5.1)
  assert.equal(formatDollarAmount(2180000000), '$2.2B')
})

test('handles zero burns, zero circulating supply, and unavailable prices', () => {
  const asset = {
    precision: 2,
    chain_stats: { issued_amount: 500, burned_amount: 0 },
    mempool_stats: { issued_amount: 0, burned_amount: 0 }
  }

  assert.equal(calculateCirculatingDollarAmount(asset, { price_usd: 5 }), 25)
  assert.equal(calculateCirculatingDollarAmount({
    ...asset,
    chain_stats: { issued_amount: 500, burned_amount: 500 }
  }, { price_usd: 5 }), 0)
  assert.equal(calculateCirculatingDollarAmount(asset, null), null)
  assert.equal(calculateCirculatingDollarAmount(asset, { price_usd: null }), null)
  assert.equal(formatDollarAmount(null), 'N/A')
})

test('does not calculate circulating value for blinded issuances', () => {
  const asset = {
    precision: 2,
    chain_stats: {
      issued_amount: 500,
      burned_amount: 100,
      has_blinded_issuances: true
    },
    mempool_stats: { issued_amount: 100, burned_amount: 50 }
  }

  assert.equal(calculateCirculatingDollarAmount(asset, { price_usd: 5 }), null)
})

test('renders custom and fallback icons with circulating USD amounts', () => {
  const bmn2 = highValueAssetDefinitions.find(asset => asset.name == 'BMN2')
      , html = render(highValueAssets(strings => strings[0], {
          [bmn2.asset_id]: {
            asset: {
              precision: 2,
              chain_stats: { issued_amount: 100000000000, burned_amount: 20000000000 },
              mempool_stats: { issued_amount: 900000000, burned_amount: 900000000 }
            },
            price: { price_usd: 2 }
          }
        }))

  assert.match(html, /img\/icons\/hva-bmn2\.svg/)
  assert.match(html, /img\/icons\/hva-usdt\.svg/)
  assert.match(html, /img\/icons\/hva-default\.svg/)
  assert.match(html, /img\/icons\/tooltip\.svg/)
  assert.match(html, /circulating value of high-value assets on Liquid/)
  assert.match(html, new RegExp(`href="asset/${bmn2.asset_id}"`))
  assert.match(html, /\$1\.6B/)
})

test('sorts assets by circulating USD amount with unavailable amounts last', () => {
  const circulatingAmounts = {
    BMN2: 100,
    CMSTR: 300,
    MEXAS: 200
  }
      , assetData = highValueAssetDefinitions.reduce((data, asset) => ({
          ...data,
          ...(circulatingAmounts[asset.name] == null ? {} : {
            [asset.asset_id]: {
              asset: {
                precision: 0,
                chain_stats: { issued_amount: circulatingAmounts[asset.name] }
              },
              price: { price_usd: 1 }
            }
          })
        }), {})
      , html = render(highValueAssets(strings => strings[0], assetData))
      , positions = [ 'CMSTR', 'MEXAS', 'BMN2', 'USDT' ].map(name => {
          const asset = highValueAssetDefinitions.find(asset => asset.name == name)
          return html.indexOf(`href="asset/${asset.asset_id}"`)
        })

  assert.ok(positions.every(position => position >= 0))
  assert.deepEqual(positions, [ ...positions ].sort((a, b) => a - b))
})
