import Snabbdom from 'snabbdom-pragma'
import { sat2btc } from 'fmtbtc'
import { outAssetLabel, add, remove } from '../util'

const qruri = !process.env.NO_QR && require('qruri')

export const formatTime = (unix, t) => new Date(unix*1000).toLocaleString(t.lang_id, { timeZoneName: 'short' })

// @XXX we currently format all amounts as having 8 decimal places (like BTC), disregarding the asset type
export const formatAmount = vout =>
  vout.value == null ? 'Confidential' : `${ sat2btc(vout.value, true) } ${ vout.asset !== '' ? outAssetLabel(vout) : '' }`

export const formatHex = num => {
  const str = num.toString(16)
  return '0x' + (str.length%2 ? '0' : '') + str
}

const parentChainExplorerTxOut = process.env.PARENT_CHAIN_EXPLORER_TXOUT || '/tx/{txid}?output:{vout}'
const parentChainExplorerAddr  = process.env.PARENT_CHAIN_EXPLORER_ADDR || '/address/{addr}'

export const linkToParentOut = ({ txid, vout }, label=`${txid}:${vout}`) =>
  <a href={parentChainExplorerTxOut.replace('{txid}', txid).replace('{vout}', vout)} target="_blank" rel="external">{label}</a>

export const linkToParentAddr = (addr, label=addr) =>
  <a href={parentChainExplorerAddr.replace('{addr}', addr)} target="_blank" rel="external">{label}</a>

export const linkToAddr = addr => <a href={`address/${addr}`}>{addr}</a>

export const addressQR = addr => qruri(`bitcoin:${addr}`, { margin: 2 })

export const getMempoolDepth = (fee_histogram, feerate) => {
  let depth = 0
  for (let i=0; fee_histogram[i][0] > feerate; i++, depth += fee_hisogram[i][1]);
  return depth
}

export const getConfEstimate = (fee_estimates, feerate) => {
  const target_est = Object.entries(fee_estimates)
    .find(([ target, target_feerate ]) => target_feerate <= feerate)
  return target_est ? target_est[0] : null
}
