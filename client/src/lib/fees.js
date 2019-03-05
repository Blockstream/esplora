const MAX_BLOCK_VSIZE = 1000000

// Squash fee buckets into fixed fee-rates ranges, with steps of 50% (1, 1.5, 2.25, ..)
const SQUASH_BUCKETS = Array.from(Array(20)).map((_,i) => 1*Math.pow(1.5, i)).reverse().concat(0)

// Get the total vsize of mempool transactions paying more than `feerate`
export function getMempoolDepth(fee_histogram, feerate) {
  let depth = 0
  for (let i=0; i < fee_histogram.length && fee_histogram[i][0] > feerate; depth += fee_histogram[i++][1]);
  return depth
}

// Get the estimated confirmation time (in blocks) for a transaction paying `feerate`
export function getConfEstimate(fee_estimates, feerate) {
  const target_est = Object.entries(fee_estimates)
    .sort((a, b) => a[0]-b[0])
    .find(([ target, target_feerate ]) => target_feerate <= feerate)
  return target_est ? target_est[0] : -1
}

// Squash the fee histogram into fixed feerate ranges
export function squashFeeHistogram(histogram) {
  let i = 0
  return SQUASH_BUCKETS.map(feerate => {
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

const P2SH_P2WPKH_COST = 21*4 // the WU cost for the non-witness part of P2SH-P2WPKH
    , P2SH_P2WSH_COST  = 35*4 // the WU cost for the non-witness part of P2SH-P2WSH

// Get the realized and potential fee savings of segwit for the given tx
export function calcSegwitFeeGains(tx) {

  if (process.env.MANDATORY_SEGWIT) {
    // None of this is relevant for chains with mandatory segwit (like liquid)
    return { realizedGains: 0, potentialBech32Gains: 0, potentialP2shGains: 0 }
  }

  // calculated in weight units
  let realizedGains = 0
    , potentialBech32Gains = 0
    , potentialP2shGains = 0

  for (const vin of tx.vin) {
    if (!vin.prevout) continue;

    const isP2pkh = vin.prevout.scriptpubkey_type == 'p2pkh'
        , isP2sh  = vin.prevout.scriptpubkey_type == 'p2sh'
        , isP2wsh = vin.prevout.scriptpubkey_type == 'v0_p2wsh'
        , isP2wpkh = vin.prevout.scriptpubkey_type == 'v0_p2wpkh'

        , op = vin.scriptsig ? vin.scriptsig_asm.split(' ')[0] : null
        , isP2sh2Wpkh = isP2sh && !!vin.witness && op == 'OP_PUSHBYTES_22'
        , isP2sh2Wsh = isP2sh && !!vin.witness && op == 'OP_PUSHBYTES_34'

    switch (true) {
      // Native Segwit - P2WPKH/P2WSH (Bech32)
      case isP2wpkh:
      case isP2wsh:
        // maximal gains: the scriptSig is moved entirely to the witness part
        realizedGains += witnessSize(vin)*3
        // XXX P2WSH output creation is more expensive, should we take this into consideration?
        break

      // Backward compatible Segwit - P2SH-P2WPKH
      case isP2sh2Wpkh:
        // the scriptSig is moved to the witness, but we have extra 21 extra non-witness bytes (48 WU)
        realizedGains += witnessSize(vin)*3 - P2SH_P2WPKH_COST
        potentialBech32Gains += P2SH_P2WPKH_COST
        break

      // Backward compatible Segwit - P2SH-P2WSH
      case isP2sh2Wsh:
        // the scriptSig is moved to the witness, but we have extra 35 extra non-witness bytes
        realizedGains += witnessSize(vin)*3 - P2SH_P2WSH_COST
        potentialBech32Gains += P2SH_P2WSH_COST
        break

      // Non-segwit P2PKH/P2SH
      case isP2pkh:
      case isP2sh:
        const fullGains = scriptSigSize(vin)*3
        potentialBech32Gains += fullGains
        potentialP2shGains += fullGains - (isP2pkh ? P2SH_P2WPKH_COST : P2SH_P2WSH_COST)
        break

    // TODO: should we also consider P2PK and pay-to-bare-script (non-p2sh-wrapped) as upgradable to P2WPKH and P2WSH?
    }
  }

  // returned as percentage of the total tx weight
  return { realizedGains: realizedGains / (tx.weight+realizedGains) // percent of the pre-segwit tx size
         , potentialBech32Gains: potentialBech32Gains / tx.weight
         , potentialP2shGains: potentialP2shGains / tx.weight
         }
}

// Utilities for segwitFeeGains
const witnessSize = vin => vin.witness.reduce((S, w) => S + (w.length/2), 0)
    , scriptSigSize = vin => vin.scriptsig ? vin.scriptsig.length/2 : 0
