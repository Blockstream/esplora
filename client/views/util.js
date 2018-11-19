import Snabbdom from 'snabbdom-pragma'
import { sat2btc } from 'fmtbtc'
import { outAssetLabel } from '../util'

const qruri = !process.env.NO_QR && require('qruri')

export const formatTime = (unix, t) => new Date(unix*1000).toLocaleString(t.lang_id, { timeZoneName: 'short' })

// @XXX we currently format all amounts as having 8 decimal places (like BTC), disregarding the asset type
export const formatAmount = vout =>
  vout.value == null ? 'Confidential' : `${ sat2btc(vout.value, true) } ${ vout.asset !== '' ? outAssetLabel(vout) : '' }`

export const formatHex = num => {
  const str = num.toString(16)
  return '0x' + (str.length%2 ? '0' : '') + str
}

const parentChainExplorerTx = process.env.PARENT_CHAIN_EXPLORER_TX || '/tx/{txid}'
const parentChainExplorerAddr = process.env.PARENT_CHAIN_EXPLORER_ADDR || '/address/{addr}'

export const linkToParentOut = ({ txid, vout }, label=`${txid}:${vout}`) =>
  <a href={parentChainExplorerTx.replace('{txid}', txid).replace('{vout}', vout)} target="_blank" rel="external">{label}</a>

export const linkToParentAddr = (addr, label=addr) =>
  <a href={parentChainExplorerAddr.replace('{addr}', addr)} target="_blank" rel="external">{label}</a>

export const linkToAddr = addr => <a href={`address/${addr}`}>{addr}</a>

export const addressQR = addr => qruri(`bitcoin:${addr}`, { margin: 2 })
