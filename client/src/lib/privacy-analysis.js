
// Detect common privacy issues:
//
// - Round payment amounts
// - Spending to a different script type
// - Unnecessary input heuristic
// - Address reuse within the same tx
// - Self transfers
//
// And the usage of CoinJoin

// TODO: round payments, different script types and UIH could be detected for >2 outputs transactions as well

export default function getPrivacyAnalysis(tx) {
  // None of this applies to coinbase transactions
  if (tx.vin[0].is_coinbase) return []

  // Detect usage of confidential values in any of the inputs/outputs
  const hasCT = tx.vin.some(vin => vin.prevout && vin.prevout.value == null)
             || tx.vout.some(out => out.value == null)

  // List of outputs excluding explicit fee outputs (only relevant for CT-enabled chains)
  const outs = tx.vout.filter(vout => vout.scriptpubkey_type != 'fee')

  const detected = []

  // Issues relating to obvious change output, only applies to txs with exactly 2 spendable outputs
  if (outs.length == 2 && isSpendable(outs[0]) && isSpendable(outs[1])) {
    const [ o1, o2 ] = outs

    // Obvious change due to one output having more precision than the other
    if (!hasCT && Math.abs(lostPrecision(o1.value) - lostPrecision(o2.value)) >= 3) {
      detected.push('change-detection-precision')
    }

    // Obvious change due to different script types, where only one of the types exists in the inputs
    if (o1.scriptpubkey_type != o2.scriptpubkey_type) {
      const inputsHasType1 = inputsHasType(tx.vin, o1.scriptpubkey_type)
          , inputsHasType2 = inputsHasType(tx.vin, o2.scriptpubkey_type)

      // one exists and the other does not
      if (inputsHasType1 != inputsHasType2) {
        detected.push('change-detection-script-types')
      }
    }

    // Unnecessary input heuristic (UIH)
    if (!hasCT && tx.vin.length > 1 && !hasMultiplePrevoutSameScript(tx)) {
      // transactions with multiple inputs of the same previous output's script are possibly
      // due to the preference to always spend all inputs of the same script together, which
      // improves privacy and is implemented by (at least) Bitcoin Core and Electrum.
      // we skip checking these transactions for UIH.

      // if the transaction could've avoided the smallest input and still have enough to fund
      // any of the two outputs, the transaction has what appears to be an unnecessary input.
      const minusSmallestIn = sumInputs(tx.vin) - smallestInput(tx.vin)
          , largeOut = Math.max(o1.value, o2.value)
          , smallOut = Math.min(o1.value, o2.value)

      if (minusSmallestIn >= largeOut + tx.fee) {
        // UIH2: if it still covers the larger output and fee, this implies this was
        // a non-standard transaction that added extra inputs for exotic reasons
        detected.push('exotic-detection-uih2')
      } else if (minusSmallestIn >= smallOut + tx.fee) {
        // UIH1: if it still covers the small output and fee, this implies the smaller
        // output was the change and not the payment
        detected.push('change-detection-uih1')
      }
    }
  }

  // Limited detection for address reuse, only if the change is sent back to one of the prevout scripts
  if (hasInternalReuse(tx)) {
    detected.push('internal-address-reuse')
  }

  // Exact-sized transfers (no change) are an indication the bitcoins possibly didn't change ownership.
  // this could mean the user used the "send max" feature to transfer funds to her new wallet or
  // to her exchange account, to sell-off fork coins, or to fund a lightning channel. it could also
  // mean the wallet was able to find a combination of inputs with a change small enough to waive.
  if (outs.length == 1 && isSpendable(outs[0])) {
    detected.push('self-transfer')
  }

  // Detect CoinJoin-looking transactions
  if (!hasCT && isCoinJoinLike(tx)) {
    detected.push('coinjoin-equal-outputs')
  }

  return detected
}

// Utilities

const sumInputs = ins => ins.reduce((T, vin) => T + (vin.prevout && vin.prevout.value || 0), 0)
    , smallestInput = ins => Math.min(...ins.map(vin => vin.prevout && vin.prevout.value || Math.Infinity))

// checks if there's at least one previous output of this type
const inputsHasType = (ins, scriptpubkey_type) =>
  ins.some(vin => vin.prevout && vin.prevout.scriptpubkey_type == scriptpubkey_type)

const isSpendable = out => ![ 'empty', 'op_return', 'provably_unspendable', 'fee' ].includes(out.scriptpubkey_type)

const lostPrecision = num => {
  // avoid infinite loop with num = 0
  if (num == 0) return 0;

  let count = 0
  for (let d=10; num%d==0; ++count, d*=10);
  return count
}

const counter = (T={}) => key => T[key] = (T[key] || 0) + 1

// Checks if the transaction has multiple inputs with the same previous output's script
const hasMultiplePrevoutSameScript = tx => {
  const inc = counter()
  return tx.vin
    .filter(vin => vin.prevout && vin.prevout.scriptpubkey)
    .some(vin => inc(vin.prevout.scriptpubkey) > 1)
}

// Checks if the transaction sends funds back to any of the previous output's scripts
const hasInternalReuse = tx => {
  const sourceScripts = tx.vin
    .filter(vin => vin.prevout && vin.prevout.scriptpubkey)
    .reduce((S, vin) => ({ ...S, [vin.prevout.scriptpubkey]: 1 }), {})

  return tx.vout
    .filter(out => out.scriptpubkey)
    .some(out => !!sourceScripts[out.scriptpubkey])
}

// Detect transactions that looks like equal-output CoinJoin
// checks if more than N outputs are of the same size, where N is half the
// number of outputs capped between 2 and 5
const isCoinJoinLike = tx => {
  const inc = counter(), target = Math.min(Math.max(tx.vout.length/2|0, 2), 5)
  return tx.vin.length > 1 && tx.vout.some(out => inc(out.value) >= target)
}
