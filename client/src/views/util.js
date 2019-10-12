import Snabbdom from 'snabbdom-pragma'
import moveDec from 'move-decimal-point'
import { sat2btc } from 'fmtbtc'
import { nativeAssetLabel, isNativeOut } from '../util'

const DEFAULT_PRECISION = 0

export const formatTime = (unix, t) => new Date(unix*1000).toLocaleString(t.lang_id, { timeZoneName: 'short' })

export const formatSat = (sats, label=nativeAssetLabel) => `${formatNumber(sat2btc(sats))} ${label}`

export const formatAssetAmount = (value, precision=0, t) =>
  <span title={t`${formatNumber(value)} base units with ${precision} decimal digits`}>
    {formatNumber(precision > 0 ? moveDec(value, -precision) : value, precision)}
  </span>

export const formatOutAmount = (vout, { t, assetMap }, shortDisplay=false) => {
  if (vout.value == null) return t`Confidential`

  if (isNativeOut(vout)) {
    return <span>
      {formatNumber(sat2btc(vout.value))}
      { ' ' }
      {!vout.asset ? nativeAssetLabel : <a href={`asset/${vout.asset}`}>{nativeAssetLabel}</a>}
    </span>
  }

  const [ domain, ticker, name, _precision ] = vout.asset && assetMap && assetMap[vout.asset] || []
      , precision = _precision != null ? _precision : DEFAULT_PRECISION
      , short_id = vout.asset && vout.asset.substr(0, 10)
      , asset_url = vout.asset && `asset/${vout.asset}`

  const amount_el = formatAssetAmount(vout.value, precision, t)
      , asset_link = vout.asset && <a href={asset_url}>{short_id}</a>

  return domain ? <span>{amount_el} {ticker && <span title={name}>{ticker}</span>} {shortDisplay||<br />} {domain}{shortDisplay || [<br/>,<em title={vout.asset}>{asset_link}</em>]}</span>
       : vout.asset ? <span>{amount_el} <em title={vout.asset}>{asset_link}</em></span>
       : <span>{amount_el} {t`Unknown`}</span> // should never happen
}

export const formatHex = num => {
  const str = num.toString(16)
  return '0x' + (str.length%2 ? '0' : '') + str
}

// Formats a number for display. Treats the number as a string to avoid rounding errors.
export const formatNumber = (s, precision=null) => {
  let [ whole, dec ] = s.toString().split('.')

  // divide numbers into groups of three separated with a thin space (U+202F, "NARROW NO-BREAK SPACE"),
  // but only when there are more than a total of 5 non-decimal digits.
  if (whole.length >= 5) {
    whole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, "\u202F")
  }

  if (precision != null && precision > 0) {
    if (dec == null) dec = '0'.repeat(precision)
    else if (dec.length < precision) dec += '0'.repeat(precision - dec.length)
  }

  return whole + (dec != null ? '.'+dec : '')
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

export const formatVMB = bytes =>
  bytes >= 10000 || bytes == 0 ? `${(bytes / 1000000).toFixed(2)} vMB`
: '< 0.01 vMB'
