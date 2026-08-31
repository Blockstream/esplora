const value = n => n == null ? 0 : Number(n)
    , passthrough = strings => strings[0]

export const getPriceFeedApiBase = (apiBase, fallbackOrigin) => {
  let url

  try {
    url = new URL(apiBase, fallbackOrigin)
  } catch (_) {
    return null
  }

  return `${url.origin}/price`
}

export const calculateCirculatingDollarAmount = (asset, price) => {
  if (!asset || !price || price.price_usd == null || !Number.isFinite(Number(price.price_usd))) return null

  const { chain_stats = {}, mempool_stats = {} } = asset
      , precision = asset.precision == null ? 0 : Number(asset.precision)
      , issuedAmount = value(chain_stats.issued_amount) + value(mempool_stats.issued_amount)
      , burnedAmount = value(chain_stats.burned_amount) + value(mempool_stats.burned_amount)
      , hasBlindedIssuances = chain_stats.has_blinded_issuances || mempool_stats.has_blinded_issuances
      , circulatingAmount = issuedAmount - burnedAmount

  if (
    hasBlindedIssuances ||
    !Number.isFinite(circulatingAmount) ||
    circulatingAmount < 0 ||
    !Number.isInteger(precision) ||
    precision < 0
  ) return null

  const dollarAmount = circulatingAmount / Math.pow(10, precision) * Number(price.price_usd)
  return Number.isFinite(dollarAmount) ? dollarAmount : null
}

export const formatDollarAmount = (amount, t=passthrough) => {
  if (!Number.isFinite(amount)) return t`N/A`

  const units = [
    [ 1e12, 'T' ],
    [ 1e9, 'B' ],
    [ 1e6, 'M' ],
    [ 1e3, 'K' ]
  ]
  const unit = units.find(([ divisor ]) => Math.abs(amount) >= divisor)

  return unit
    ? `$${(amount / unit[0]).toFixed(1)}${unit[1]}`
    : `$${amount.toFixed(1)}`
}
