import qs from 'querystring'
import bs58check from 'bs58check'
import qrcode from 'qrcode'
import debug from 'debug'
import assert from 'assert'
import { Observable as O } from './rxjs'

const BLIND_PREFIX = +process.env.BLIND_PREFIX || 0x0c
    , reHash256 = /^[a-f0-9]{64}$/i
    , reBech32 = /^[a-z]{1,83}1[ac-hj-np-z02-9]{6,100}$/

// not null or undefined
export const notNully = x => x != null

export const isHash256 = str => reHash256.test(str)

export const parseHashes = str => (''+str).split(',').filter(isHash256)

// Transaction helpers

export const nativeAssetId    = process.env.NATIVE_ASSET_ID    || '6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d'
           , nativeAssetLabel = process.env.NATIVE_ASSET_LABEL || 'BTC'

export const isAnyConfidential = tx => tx.vout.some(vout => vout.value == null)

export const isRbf = tx => tx.vin.some(vin => vin.sequence < 0xfffffffe)

export const isAllNative = tx => tx.vout.every(isNativeOut)

export const outTotal = tx => tx.vout.reduce((N, vout) => N + (vout.value || 0), 0)

export const isNativeOut = vout => (!vout.asset && !vout.assetcommitment) || vout.asset === nativeAssetId

// Address helpers

// Try removing blinding key from confidential address and return in standard address encoding
export const tryUnconfidentialAddress = addr => {
  try {
    const bytes = bs58check.decode(addr)
    assert(bytes.length == 55 && bytes[0] == BLIND_PREFIX)
    return bs58check.encode(Buffer.concat([bytes.slice(1, 2), bytes.slice(-20)]))
  } catch (e) {
    return addr
  }
}

export const makeAddressQR = addr => {
  let qrstr = `bitcoin:${addr}`
  return qrcode.toDataURL(
    // upper-case bech32 addresses to enable the compact qr encoding mode
    reBech32.test(addr) ? qrstr.toUpperCase() : qrstr
  , { margin: 2, scale: 5 }
  )
}

// Array helpers

export const last = arr => arr.length ? arr[arr.length-1] : null

// Stream helpers

export const combine = obj => {
  const keys = Object.keys(obj).map(k => k.replace(/\$$/, ''))
  return O.combineLatest(...Object.values(obj).map(x$ => x$.startWith(null))
    , (...xs) => xs.reduce((o, x, i) => (o[keys[i]] = x, o), {}))
}

export const dropErrors = r$$ => r$$.switchMap(r$ => r$.catch(_ => O.empty()))

export const extractErrors = r$$ =>
  r$$.flatMap(r$ => r$.flatMap(_ => O.empty()).catch(err => O.of(err)))
    .map(e => e.response && e.status != 502 ? parseError(e.response) : e)

const parseError = res =>
  (res.body && Object.keys(res.body).length)
  ? res.body.message || res.body
  : res.text

export const dbg = (obj, label='stream', dbg=debug(label)) =>
  Object.keys(obj).forEach(k => obj[k] && obj[k].subscribe(
    x   => dbg(`${k} ->`, x)
  , err => dbg(`${k} \x1b[91mError:\x1b[0m`, err.stack || err)
  , _   => dbg(`${k} completed`)))

// Update query string with opts, return as encoded string or as an object
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
    .replace(/%3A/g, ':') // use literal colon for prettier urls

  return `${new_qs.length ? '?' : ''}${new_qs}`
}
