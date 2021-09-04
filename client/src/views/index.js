export { dashBoard }       from './home'
export { recentBlocks }       from './blocks-all'
export { recentTxs }          from './transactions-all'
export { default as block }   from './block'
export { default as addr }    from './addr'
export { default as tx }      from './tx'
export { default as pushtx }  from './pushtx'
export { default as scan }    from './scan'
export { default as mempool } from './mempool'
export { default as loading } from './loading'
export { error, notFound }    from './error'

// Elements
if (process.env.IS_ELEMENTS) {
  exports.asset = require('./asset').default

  if (process.env.ASSET_MAP_URL) {
    exports.assetList = require('./asset-list').default
  }
}
