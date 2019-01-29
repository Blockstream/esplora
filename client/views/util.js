import qs from 'querystring'
import Snabbdom from 'snabbdom-pragma'
import { sat2btc } from 'fmtbtc'
import { outAssetLabel, add, remove } from '../util'

const qruri = !process.env.NO_QR && require('qruri')

export const perPage = 25

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

export const updateQuery = (query, opts, as_obj) => {
  const new_query = Object.entries(opts).reduce((acc, [ key, val ]) => {
    if (val === true) { acc[key] = '' }
    else if (val === false) { delete acc[key] }
    else acc[key]=val
    return acc
  }, Object.assign({}, query))

  if (as_obj) return new_query;

  const new_qs = qs.stringify(new_query)
    .replace(/=(true)?(&|$)/g, '$2') // strip "=" off of value-less args

  console.log({ query, opts, new_query, new_qs })

  return `${new_qs.length ? '?' : ''}${new_qs}`
}
