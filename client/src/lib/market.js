export const getBitcoinPrices = marketChart =>
  (Array.isArray(marketChart?.prices) ? marketChart.prices : [])
    .map(price => Array.isArray(price) ? price[1] : null)
    .filter(Number.isFinite)

export const getLatestBitcoinPrice = marketChart => {
  const prices = getBitcoinPrices(marketChart)
  return prices.length ? prices[prices.length - 1] : null
}
