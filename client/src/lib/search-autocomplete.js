import { isHash256 } from '../util'
import {
  normalizeSearchQuery,
  isNumberSearch,
  isAddressSearch,
  matchShortTxOut,
} from './search-query'
import { assetIconSrc } from '../components/asset-icon'
import { Observable as O } from '../rxjs'

export const autocompleteDelayMs = 350
export const autocompleteResultLimit = 5

const minimumAssetSearchLength = 2
    , reDomain = /^(?=.{3,255}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z](?:[a-z0-9-]{0,61}[a-z0-9])?$/i
    , reLongHex = /^[a-f0-9]{25,}$/i

export const lower = value => typeof value == 'string' ? value.toLowerCase() : ''
export const assetDomain = asset => asset && asset.entity && asset.entity.domain
export const assetIconHref = asset => asset && asset.registry && asset.registry.icon && asset.registry.icon.href

export const debounceAutocompleteQueries = (query$, scheduler) =>
  O.from(query$)
    .map(normalizeSearchQuery)
    .distinctUntilChanged()
    // A hash only matches once complete, so it can be looked up without waiting
    .switchMap(query => query && !isHash256(query)
      ? O.timer(autocompleteDelayMs, scheduler).mapTo(query)
      : O.of(query))
    .share()

export const getAutocompletePlan = (rawQuery, isElements=!!process.env.IS_ELEMENTS) => {
  const query = normalizeSearchQuery(rawQuery)

  if (!isElements || !query || isNumberSearch(query) || matchShortTxOut(query)) {
    return { kind: 'none', query }
  }

  if (isHash256(query)) {
    return { kind: 'hash', query }
  }

  // Once a hexadecimal query is longer than the largest ticker, treat it as
  // an incomplete identifier and wait for the complete 64-character value.
  if (reLongHex.test(query)) {
    return { kind: 'none', query }
  }

  if (isAddressSearch(query)) {
    return { kind: 'address', query }
  }

  if (query.length < minimumAssetSearchLength || query.length > 255) {
    return { kind: 'none', query }
  }

  return {
    kind: 'assets',
    query,
    filters: [
      'name',
      ...(query.length <= 24 ? [ 'ticker' ] : []),
      ...(reDomain.test(query) ? [ 'domain' ] : []),
    ],
  }
}

const assetMatchRank = (asset, field, query) => {
        const value = field == 'domain' ? assetDomain(asset) : asset && asset[field]
        return [
          lower(value) == lower(query) ? 0 : 1,
          assetIconSrc(assetIconHref(asset)) ? 0 : 1,
          [ 'ticker', 'name', 'domain' ].indexOf(field),
        ]
      }
    , compareRanks = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]

export const mergeAssetResults = (responses, query, limit=autocompleteResultLimit) => {
  const matches = new Map()

  responses.forEach(({ field, assets }) => (assets || []).forEach(asset => {
    if (!asset || !asset.asset_id) return

    const rank = assetMatchRank(asset, field, query)
        , existing = matches.get(asset.asset_id)

    if (!existing || compareRanks(rank, existing.rank) < 0) {
      matches.set(asset.asset_id, { asset, rank })
    }
  }))

  return [ ...matches.values() ]
    .sort((a, b) => compareRanks(a.rank, b.rank)
      || lower(a.asset.ticker || a.asset.name || assetDomain(a.asset) || a.asset.asset_id)
        .localeCompare(lower(b.asset.ticker || b.asset.name || assetDomain(b.asset) || b.asset.asset_id)))
    .slice(0, limit)
    .map(({ asset }) => ({
      category: 'assets',
      id: `asset:${asset.asset_id}`,
      pathname: `/asset/${asset.asset_id}`,
      asset,
    }))
}
