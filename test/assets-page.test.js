const test = require('node:test')
const assert = require('node:assert/strict')
const render = require('snabbdom-to-html')

process.env.IS_ELEMENTS = '1'
process.env.SHOW_HIGH_VALUE_ASSETS = '1'

const t = require('../client/src/l10n').default.en
const { default: assets } = require('../client/src/views/assets')
const { default: assetList } = require('../client/src/views/asset-list')

const asset = {
  asset_id: 'a'.repeat(64),
  name: 'Example',
  ticker: 'EXM',
  precision: 0,
  chain_stats: { issued_amount: 10, burned_amount: 0, has_blinded_issuances: false },
  mempool_stats: { issued_amount: 0, burned_amount: 0, has_blinded_issuances: false },
}
const page = { pathname: '/assets', query: {} }

test('renders high-value assets above the recently registered assets', () => {
  const html = render(assets({ t, page, recentAssets: [ asset ], highValueAssets: {} }))

  assert.ok(html.indexOf('High-Value Assets') < html.indexOf('Recently Registered Assets'))
  assert.match(html, /href="asset\/a{64}"/)
  assert.match(html, /href="assets\/all"[^>]*><span>See All Assets<\/span>/)
  assert.doesNotMatch(html, /See More/)
})

test('renders the all-assets table with a link back to the assets page', () => {
  const html = render(assetList({
    t,
    page: { ...page, pathname: '/assets/all' },
    assetList: { assets: [ asset ], total: 1 },
    goAssetList: { start_index: 0, sort_field: 'name', sort_dir: 'asc', limit: 50 },
  }))

  assert.ok(html.indexOf('Back to Assets Page') < html.indexOf('All Assets</h1>'))
  assert.match(html, /<a class="asset-list-back-link[^"]*" href="assets"><svg/)
  assert.match(html, /href="assets\/all\?sort_field=ticker&amp;sort_dir=desc"/)
})
