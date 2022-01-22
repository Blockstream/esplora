const fs = require('fs')
    , urlp = require('url')
    , assert = require('assert')
    , BitcoinClient = require('bitcoin-core')

module.exports = (on, config) => {
  config.baseUrl = config.baseUrl || process.env.BASE_URL
  config.bitcoindUrl = config.bitcoindUrl || process.env.BITCOIND_URL

  // TODO: auto spawn dev-server for testing

  assert(config.baseUrl && config.bitcoindUrl, 'BASE_URL and BITCOIND_URL are required')

  const bitcoind = new BitcoinClient(bitcoind_opt(config.bitcoindUrl))

  on('task', {
    bitcoind: async ([ method, ...params ]) =>
      bitcoind.command(method, ...params)

  , "bitcoind:mine": async () => {
      const addr = await bitcoind.getNewAddress()
      return (await bitcoind.generateToAddress(1, addr))[0]
    }

  , "bitcoind:make_tx": async ({ confirmed }) => {
      const addr = await bitcoind.getNewAddress()
          , amount = randAmount()
          , txid = await bitcoind.sendToAddress(addr, amount)
          , block_hash = confirmed ? await bitcoind.generateToAddress(1, await bitcoind.getNewAddress()) : null
      return { txid, addr, amount, block_hash }
    }

  , "bitcoind:make_tx_bulk": async ({ num_txs }) => {
      const addr = await bitcoind.getNewAddress()
          , txids = []
      for (let i=0; i<num_txs; i++) {
         txids.push(await bitcoind.sendToAddress(addr, randAmount()))
      }
      return { txids, addr }
    }
  })

  return config
}

function bitcoind_opt(url) {
  const parsed = urlp.parse(url, true)
      , auth_str = parsed.auth || (parsed.query.cookie && fs.readFileSync(parsed.query.cookie).toString())
      , auth = auth_str && auth_str.split(':', 2).map(decodeURIComponent)

  return {
    host: parsed.hostname || 'localhost'
  , port: parsed.port
  , ssl: (parsed.protocol == 'https:')
  , username: auth ? auth[0] : null
  , password: auth ? auth[1] : null
  , network:'regtest'
  , wallet: parsed.query.wallet
  }
}

const randAmount = () =>
  `0.01${Math.random()*10000|0}`.replace(/0+$/, '')