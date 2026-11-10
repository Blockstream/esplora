import request from 'superagent'
import { tryUnconfidentialAddress, isHash256 } from '../util'
import {
  normalizeSearchQuery,
  isNumberSearch,
  isAddressSearch,
  matchShortTxOut,
} from '../lib/search-query'
import { Observable as O } from '../rxjs'

export default apiBase => {
  const tryResource = path =>
    request(apiBase + path)
      .then(r => r.ok ? path : Promise.reject('invalid status'))

  let matches

  // Accepts a stream of query strings, returns a stream of found resource paths
  return query$ =>
    O.from(query$).map(normalizeSearchQuery).flatMap(async query =>

    // if its a number, assume its a block height without checking
      isNumberSearch(query)
    ? `/block-height/${query}`

    // if its a 256 bit hash, look it up as a txid or block hash
    : isHash256(query)
    ? tryResource(`/tx/${query}`)
        .catch(_ => tryResource(`/block/${query}`))
        .catch(_ => process.env.IS_ELEMENTS ? tryResource(`/asset/${query}`) : null)
        .catch(_ => null)

    // lookup as lightning-style short txout identifier
    : (matches = matchShortTxOut(query))
    ? request(`${apiBase}/block-height/${matches[1]}`)
        .then(r => r.ok ? r.text : Promise.reject('invalid reply for block height'))
        .then(blockhash => request(`${apiBase}/block/${blockhash}/txid/${matches[3]}`))
        .then(r => r.ok ? r.text : Promise.reject('invalid reply for block txid'))
        .then(txid => ({ pathname: `/tx/${txid}`, search: `?output:${matches[4]}` }))
        .catch(_ => null)

    // lookup as address if it resembles one
    : isAddressSearch(query)
    ? tryResource(`/address/${tryUnconfidentialAddress(query)}`)
        // use the user-provided address and not the (potentially) unconfidential one
        .then(_ => `/address/${query}`)
        .catch(_ => null)

    // @XXX the tx/block/addr resource will be fetched again later for display,
    // which is somewhat wasteful but not terribly so due to browser caching.

    : null
    )
    .map(result => typeof result == 'string' ? { pathname: result } : result)
    .share()
}
