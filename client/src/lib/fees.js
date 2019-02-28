const MAX_BLOCK_VSIZE = 1000000
const SQUASH_RATES = [ 70, 40, 35, 30, 25, 20, 10, 8, 6, 4, 3, 2, 1.5, 1.1, 1, 0 ]

// Get the total vsize of mempool transactions paying more than `feerate`
export function getMempoolDepth(fee_histogram, feerate) {
  let depth = 0
  for (let i=0; i < fee_histogram.length && fee_histogram[i][0] > feerate; depth += fee_histogram[i++][1]);
  return depth
}

// Get the estimated confirmation time (in blocks) for a transaction paying `feerate`
export function getConfEstimate(fee_estimates, feerate) {
  const target_est = Object.entries(fee_estimates)
    .find(([ target, target_feerate ]) => target_feerate <= feerate)
  return target_est ? target_est[0] : null
}

// Squash the fee histogram into fixed feerate ranges
export function squashFeeHistogram(histogram) {
  let i = 0
  return SQUASH_RATES.map(feerate => {
    let binSize = 0
    for (; i < histogram.length && histogram[i][0] >= feerate; binSize += histogram[i++][1]);
    return [ feerate, binSize ]
  })
}

// Get the lowest fee-rate to get confirmed if a block is found *now*
export function feerateCutoff(histogram) {

  let lastRate, totalSize=0
  for (const [ feerate, vsize ] of histogram) {
    totalSize += vsize

    if (totalSize >= MAX_BLOCK_VSIZE) {
      // if the first entry is larger than MAX_BLOCK_VSIZE, we cannot estimate the cut-off and return null instead
      return lastRate !== undefined ? lastRate : null
    }

    lastRate = feerate
  }
  // everything in the mempool should get confirmed in the next block
  return 0
}
