export const blockTxsPerPage = 25
export const addrTxsPerPage = 25
export const blocksPerPage = 10
export const difficultyPeriod = 2016
export const maxMempoolTxs = 50
export const satoshisPerBitcoin = 100000000
export const typicalNativeSegwitTransactionVsize = 140
// One native-SegWit input, two confidential outputs, and an explicit fee
// output. After ELIP-200 normalizes confidential values, nonces, and proofs,
// its discount weight is 228 base-equivalent bytes * 4 plus 117 witness bytes
// (using a 108-byte P2WPKH witness), rounded up from 1029 WU.
export const typicalDiscountedConfidentialTransactionVsize = 258
export const maxBlockWeight = 4000000
export const blockGridLoadingDelayMs = 100
export const blockGridTransactionSelectEvent = 'block-grid-transaction-select'
export const feeEstimateTargets = {
  low: 12,
  average: 3,
  high: 1,
}
export const staticRoot = process.env.STATIC_ROOT || ''

const configuredTargetBlockIntervalSeconds = Number(process.env.TARGET_BLOCK_INTERVAL_SECONDS)
export const targetBlockIntervalSeconds = configuredTargetBlockIntervalSeconds > 0
  ? configuredTargetBlockIntervalSeconds
  : process.env.IS_ELEMENTS ? 60 : 600

const liquidNativeAssetId = '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d'

export const nativeAssetId    = process.env.NATIVE_ASSET_ID    || liquidNativeAssetId
export const nativeAssetLabel = process.env.NATIVE_ASSET_LABEL || 'BTC'
export const nativeAssetName  = process.env.NATIVE_ASSET_NAME  || 'Bitcoin'
export const showPegData      = !!process.env.IS_ELEMENTS && process.env.SHOW_PEG_DATA == '1'

export const highValueAssetDefinitions = [
  {
    asset_id: 'aa909f1b77451e409fe95fe1d3638ad017ab3325c6d4f00301af6d582d0f2034',
    name: 'BMN2',
    icon: 'hva-bmn2.svg'
  },
  {
    asset_id: 'ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2',
    name: 'USDT',
    icon: 'hva-usdt.svg'
  },
  {
    asset_id: 'e8305bb5c1794b256a858a01e5d8af7a5817d257fbfbc2c9d49620f13ff401a9',
    name: 'CMSTR'
  },
  {
    asset_id: '26ac924263ba547b706251635550a8649545ee5c074fe5db8d7140557baaf32e',
    name: 'MEXAS'
  }
]

export const showHighValueAssets = !!process.env.IS_ELEMENTS
  && process.env.SHOW_HIGH_VALUE_ASSETS == '1'
  && nativeAssetId == liquidNativeAssetId

// Elements only
export const assetTxsPerPage = 25
export const pegTxsPerPage = 25
