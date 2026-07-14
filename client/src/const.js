export const blockTxsPerPage = 25
export const addrTxsPerPage = 25
export const blocksPerPage = 10
export const difficultyPeriod = 2016
export const maxMempoolTxs = 50
export const satoshisPerBitcoin = 100000000
export const averageNativeSegwitTransactionSize = 140
export const maxBlockWeight = 4000000

const configuredTargetBlockIntervalSeconds = Number(process.env.TARGET_BLOCK_INTERVAL_SECONDS)
export const targetBlockIntervalSeconds = configuredTargetBlockIntervalSeconds > 0
  ? configuredTargetBlockIntervalSeconds
  : process.env.IS_ELEMENTS ? 60 : 600

export const nativeAssetId    = process.env.NATIVE_ASSET_ID    || '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d'
export const nativeAssetLabel = process.env.NATIVE_ASSET_LABEL || 'BTC'
export const nativeAssetName  = process.env.NATIVE_ASSET_NAME  || 'Bitcoin'
export const showPegData      = !!process.env.IS_ELEMENTS && process.env.SHOW_PEG_DATA == '1'

// Elements only
export const assetTxsPerPage = 25
export const pegTxsPerPage = 25
