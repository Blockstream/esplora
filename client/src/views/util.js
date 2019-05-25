import Snabbdom from 'snabbdom-pragma'
import moveDec from 'move-decimal-point'
import { sat2btc } from 'fmtbtc'
import { nativeAssetLabel, isNativeOut } from '../util'

const qruri = !process.env.NO_QR && require('qruri')

const DEFAULT_PRECISION = 0

export const formatTime = (unix, t) => new Date(unix*1000).toLocaleString(t.lang_id, { timeZoneName: 'short' })

export const formatSat = (sats, label=nativeAssetLabel) => `${formatNumber(sat2btc(sats))} ${label}`

export const formatOutAmount = (vout, { t, assetMap }, shortDisplay=false) => {
  if (vout.value == null) return t`Confidential`

  if (isNativeOut(vout)) return formatSat(vout.value)

  const [ domain, ticker, name, _precision ] = vout.asset && assetMap && assetMap[vout.asset] || []
      , precision = _precision != null ? _precision : DEFAULT_PRECISION
      , amount = formatNumber(precision > 0 ? moveDec(vout.value, -precision) : vout.value)
      , short_id = vout.asset && vout.asset.substr(0, 10)

  const amount_el = <span title={t`${formatNumber(vout.value)} base units`}>{amount}</span>

  return domain ? <span>{amount_el} <span title={name}>{`${domain} ${ticker || ''}`}</span>{shortDisplay || [<br/>,<em title={vout.asset}>({short_id})</em>]}</span>
       : vout.asset ? <span>{amount_el} <em title={vout.asset}>{short_id}</em></span>
       : <span>{amount_el} {t`Unknown`}</span> // should never happen
}

export const formatHex = num => {
  const str = num.toString(16)
  return '0x' + (str.length%2 ? '0' : '') + str
}

export const formatNumber = s => {
  // divide numbers into groups of three separated with a thin space (U+202F, "NARROW NO-BREAK SPACE"),
  // but only when there are more than a total of 5 non-decimal digits.
  if (s >= 10000) {
    const [ whole, dec ] = s.toString().split('.')
    return whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F") + (dec != null ? '.'+dec : '')
  }
  return s
}

export const formatJson = obj =>
  JSON.stringify(obj, null, 1)
    //.replace(/^ /mg, '')
    //.replace(/^\{|\}$/g, '')

const parentChainExplorerTxOut = process.env.PARENT_CHAIN_EXPLORER_TXOUT || '/tx/{txid}?output:{vout}'
const parentChainExplorerAddr  = process.env.PARENT_CHAIN_EXPLORER_ADDR || '/address/{addr}'

export const linkToParentOut = ({ txid, vout }, label=`${txid}:${vout}`) =>
  <a href={parentChainExplorerTxOut.replace('{txid}', txid).replace('{vout}', vout)} target="_blank" rel="external">{label}</a>

export const linkToParentAddr = (addr, label=addr) =>
  <a href={parentChainExplorerAddr.replace('{addr}', addr)} target="_blank" rel="external">{label}</a>

export const linkToAddr = addr => <a href={`address/${addr}`}>{addr}</a>

export const addressQR = addr => qruri(`bitcoin:${addr}`, { margin: 2 })

export const formatVMB = bytes =>
  bytes >= 10000 || bytes == 0 ? `${(bytes / 1000000).toFixed(2)} vMB`
: '< 0.01 vMB'
