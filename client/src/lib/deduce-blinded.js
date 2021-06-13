// Attempt to deduce the blinded input/output based on the available information
export function deduceBlinded(tx) {
  if (tx._deduced) return;
  tx._deduced = true

  // Find ins/outs with unknown amounts (blinded ant not revealed via the `#blinded` hash fragment)
  const unknown_ins = tx.vin.filter(vin => vin.prevout && vin.prevout.value == null)
      , unknown_outs = tx.vout.filter(vout => vout.value == null)

  // If the transaction has a single unknown input/output, we can deduce its asset/amount
  // based on the other known inputs/outputs.
  if (unknown_ins.length + unknown_outs.length == 1) {

    // Keep a per-asset tally of all known input amounts, minus all known output amounts
    const totals = new Map
    tx.vin.filter(vin => vin.prevout && vin.prevout.value != null)
      .forEach(({ prevout }) =>
        totals.set(prevout.asset, (totals.get(prevout.asset) || 0) + prevout.value))
    tx.vout.filter(vout => vout.value != null)
      .forEach(vout =>
        totals.set(vout.asset, (totals.get(vout.asset) || 0) - vout.value))

    // There should only be a single asset where the inputs and outputs amounts mismatch,
    // which is the asset of the blinded input/output
    const remainder = Array.from(totals.entries()).filter(([ asset, value ]) => value != 0)
    if (remainder.length != 1) throw new Error('unexpected remainder while deducing blinded tx')
    const [ blinded_asset, blinded_value ] = remainder[0]

    // A positive remainder (when known in > known out) is the asset/amount of the unknown blinded output,
    // a negative one is the input.
    if (blinded_value > 0) {
      if (!unknown_outs.length) throw new Error('expected unknown output')
      unknown_outs[0].asset = blinded_asset
      unknown_outs[0].value = blinded_value
    } else {
      if (!unknown_ins.length) throw new Error('expected unknown input')
      unknown_ins[0].prevout.asset = blinded_asset
      unknown_ins[0].prevout.value = blinded_value * -1
    }
  }
}
