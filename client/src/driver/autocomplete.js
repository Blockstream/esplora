import request from 'superagent'
import { tryUnconfidentialAddress } from '../util'
import { autocompleteCategoryOrder } from '../const'
import {
  autocompleteResultLimit,
  getAutocompletePlan,
  lower,
  mergeAssetResults,
} from '../lib/search-autocomplete'
import { Observable as O } from '../rxjs'

const autocompleteCacheMs = 60000
    , categoryRank = category => autocompleteCategoryOrder.indexOf(category)

const settled = promise => promise
  .then(value => ({ value, cacheable: true }))
  .catch(error => ({
    value: null,
    cacheable: !!(error && error.status >= 400 && error.status < 500 && error.status != 429),
  }))

const lookupHash = (apiBase, { query }, requester) => Promise.all([
  settled(requester(`${apiBase}/tx/${query}/status`).then(_ => ({
    category: 'transactions',
    id: `transaction:${query}`,
    pathname: `/tx/${query}`,
    txid: query,
  }))),
  settled(requester(`${apiBase}/block/${query}`).then(response => ({
    category: 'blocks',
    id: `block:${query}`,
    pathname: `/block/${query}`,
    hash: query,
    block: response.body,
  }))),
  settled(requester(`${apiBase}/asset/${query}`).then(response => ({
    category: 'assets',
    id: `asset:${query}`,
    pathname: `/asset/${query}`,
    asset: { ...(response.body || {}), asset_id: (response.body && response.body.asset_id) || query },
  }))),
]).then(responses => ({
  cacheable: responses.every(response => response.cacheable),
  results: responses.map(response => response.value)
    .filter(Boolean)
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category)),
}))

const lookupAddress = (apiBase, { query }, requester) =>
  settled(requester(`${apiBase}/address/${tryUnconfidentialAddress(query)}`).then(_ => ({
    category: 'addresses',
    id: `address:${query}`,
    pathname: `/address/${query}`,
    address: query,
  }))).then(response => ({
    cacheable: response.cacheable,
    results: response.value ? [ response.value ] : [],
  }))

const lookupAssets = (apiBase, { query, filters }, requester) => Promise.all(filters.map(field =>
  settled(requester(`${apiBase}/assets/registry`)
    .query({ [field]: query, limit: autocompleteResultLimit, sort_field: field, sort_dir: 'asc' })
    .then(response => ({ field, assets: Array.isArray(response.body) ? response.body : [] })))
)).then(responses => ({
  cacheable: responses.every(response => response.cacheable),
  results: mergeAssetResults(responses.map((response, index) => response.value || {
    field: filters[index],
    assets: [],
  }), query),
}))

const pruneExpired = (cache, now) => cache.forEach((entry, key) => {
  if (entry.expiresAt <= now) cache.delete(key)
})

const executePlan = (apiBase, plan, requester) =>
  plan.kind == 'hash' ? lookupHash(apiBase, plan, requester)
  : plan.kind == 'address' ? lookupAddress(apiBase, plan, requester)
  : plan.kind == 'assets' ? lookupAssets(apiBase, plan, requester)
  : Promise.resolve({ cacheable: true, results: [] })

export default (apiBase, requester=request) => {
  const cache = new Map()

  return query$ => O.from(query$)
    .switchMap(rawQuery => {
      const plan = getAutocompletePlan(rawQuery)
          , query = plan.query

      if (plan.kind == 'none') {
        return O.of({ query, loading: false, results: [] })
      }

      const cacheKey = plan.kind == 'address' ? `${plan.kind}:${query}` : `${plan.kind}:${lower(query)}`

      pruneExpired(cache, Date.now())

      const cached = cache.get(cacheKey)
      if (cached) {
        return O.of({ query, loading: false, results: cached.results })
      }

      // Cache from the promise so lookups that settle after cancellation are still reused
      const lookup = executePlan(apiBase, plan, requester).then(response => {
        if (response.cacheable) cache.set(cacheKey, { results: response.results, expiresAt: Date.now() + autocompleteCacheMs })
        return response
      })

      return O.from(lookup)
        .map(({ cacheable, results }) => ({ query, loading: false, results, ...(cacheable ? {} : { failed: true }) }))
        .catch(_ => O.of({ query, loading: false, results: [], failed: true }))
        .startWith({ query, loading: true, results: [] })
    })
    .share()
}
