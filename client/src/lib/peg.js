const isNonNegativeNumber = value => Number.isFinite(value) && value >= 0

export const getPegAccounting = (chainStats = {}) => {
  const pegInAmount = chainStats.peg_in_amount
      , pegOutAmount = chainStats.peg_out_amount
      , burnedAmount = chainStats.burned_amount
      , federationAssets = isNonNegativeNumber(pegInAmount) &&
          isNonNegativeNumber(pegOutAmount) && pegInAmount >= pegOutAmount
          ? pegInAmount - pegOutAmount
          : null
      , circulatingLiabilities = isNonNegativeNumber(federationAssets) &&
          isNonNegativeNumber(burnedAmount) && federationAssets >= burnedAmount
          ? federationAssets - burnedAmount
          : null
      , assetsVsLiabilitiesRatio = isNonNegativeNumber(federationAssets) && circulatingLiabilities > 0
          ? federationAssets / circulatingLiabilities * 100
          : null

  return {
    pegInAmount
  , pegOutAmount
  , burnedAmount
  , federationAssets
  , circulatingLiabilities
  , assetsVsLiabilitiesRatio
  }
}
