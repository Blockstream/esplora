import qs from 'querystring'
import qrcode from 'qrcode'
import debug from 'debug'
import assert from 'assert'
import { Observable as O } from './rxjs'
import { nativeAssetId } from './const'

const BLIND_PREFIX = +process.env.BLIND_PREFIX || 0x0c
    , reHash256 = /^[a-f0-9]{64}$/i
    , reBech32 = /^[a-z]{1,83}1[ac-hj-np-z02-9]{6,100}$/
    , qrPrefix = process.env.IS_ELEMENTS ? 'liquidnetwork' : 'bitcoin'

// not null or undefined
export const notNully = x => x != null

export const isHash256 = str => reHash256.test(str)

export const parseHashes = str => (''+str).split(',').filter(isHash256)

// update the `current` list of blocks with `to_add`, which can either contain an updated
// list of the most recent blocks at the tip, or older blocks to be appended at the end
export const updateBlocks = (current, to_add) => {
  if (!to_add.length) return current

  const curr_max = current.length ? current[0].height : null
      , curr_min = current.length ? last(current).height : null
      , add_max = to_add[0].height
      , add_min = last(to_add).height

  // to_add contains blocks at the tip of the chain that should be added to the beginning
  if (curr_max != null && add_max >= curr_max) {
    if (add_min > curr_max) {
      // if there's a gap of missing blocks between to_add and current,
      // drop the current blocks and return just the new ones to maintain consistency
      return to_add
    } else {
      // merge to_add blocks with current older blocks
      const curr_replaced = curr_max - add_min + 1
      return to_add.concat(curr_replaced > 0 ? current.slice(curr_replaced) : current)
    }
  }
  // to_add contains new older blocks to be appended at the end
  else if (curr_min == null || add_max == curr_min - 1) {
    return current.concat(to_add)
  }

  // we should never reach this point, but just return to_add if we somehow do
  return to_add
}

// Transaction helpers

export const isAnyConfidential = tx => tx.vout.some(vout => vout.value == null)

export const isRbf = tx => tx.vin.some(vin => vin.sequence < 0xfffffffe)

export const isAllNative = tx => tx.vout.every(isNativeOut)

export const outTotal = tx => tx.vout.reduce((N, vout) => N + (vout.value || 0), 0)

export const isNativeOut = vout => (!vout.asset && !vout.assetcommitment) || vout.asset === nativeAssetId

// Address helpers

// Try removing blinding key from confidential address and return in standard address encoding
export const tryUnconfidentialAddress =
  !process.env.IS_ELEMENTS
  ? addr => addr
  : (bs58check => addr => {
      try {
        const bytes = bs58check.decode(addr)
        assert(bytes.length == 55 && bytes[0] == BLIND_PREFIX)
        return bs58check.encode(Buffer.concat([bytes.slice(1, 2), bytes.slice(-20)]))
      } catch (e) {
        return addr
      }
    })(require('bs58check')) // conditional load to avoid bundling in non-elements mode


export const processGoAddr =
  !process.env.IS_ELEMENTS
  ? goAddr => ({ ...goAddr, display_addr: goAddr.addr })
  : goAddr => {
      const addr = tryUnconfidentialAddress(goAddr.addr)
          , confidential_addr = addr != goAddr.addr ? goAddr.addr : null
          , display_addr = confidential_addr || addr
      return { ...goAddr, addr, display_addr, confidential_addr }
    }

export const makeAddressQR = addr => {
  let qrstr = `${qrPrefix}:${addr}`
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

// Create a stream that ticks every `ms`, but only when the window is focused.
// Returns an empty stream in the server-side pre-renderer environment.
export const tickWhileFocused = ms =>
  process.browser
    ? O.timer(0, ms).filter(() => document.hasFocus())
    : O.empty()

// Create a stream that ticks every `ms` w, but only when the window is focused
// *and* `view` is the active view
export const tickWhileViewing = (ms, view, view$) =>
  tickWhileFocused(ms).withLatestFrom(view$).filter(([ _, shown_view ]) => shown_view == view)

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
