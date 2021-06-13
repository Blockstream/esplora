import { Observable as O } from '../rxjs'
import * as libwally from '../lib/libwally'

// Accepts a stream of blinding data strings, returns a stream of Unblinded
// objects with a map from the commitments to the unblinded data
module.exports = blinders_str$ =>
  O.from(blinders_str$).flatMap(async blinders_str => {
    if (!blinders_str) return null

    await libwally.load()

    try {
      const blinders = parseBlinders(blinders_str)
      return new Unblinded(blinders)
    }
    catch (error) {
      return { error }
    }
  })
  .share()

class Unblinded {
  constructor(blinders) {
    this.commitments = makeCommitmentMap(blinders)
  }

  // Look for the given output, returning an { value, asset } object
  find(vout) {
    return vout.assetcommitment && vout.valuecommitment && 
      this.commitments.get(`${vout.assetcommitment}:${vout.valuecommitment}`)
  }

  // Lookup all transaction inputs/outputs and attach the unblinded data
  tryUnblindTx(tx) {
    if (tx._unblinded) return tx._unblinded
    let matched = 0
    tx.vout.forEach(vout => matched += +this.tryUnblindOut(vout))
    tx.vin.filter(vin => vin.prevout).forEach(vin => matched += +this.tryUnblindOut(vin.prevout))
    tx._unblinded = { matched, total: this.commitments.size }
    tx._deduced = false // invalidate cache so deduction is attempted again
    return tx._unblinded
  }

  // Look the given output and attach the unblinded data
  tryUnblindOut(vout) {
    const unblinded = this.find(vout)
    if (unblinded) Object.assign(vout, unblinded)
    return !!unblinded
  }
}

function makeCommitmentMap(blinders) {
  const commitments = new Map

  blinders.forEach(b => {
    const { asset_commitment, value_commitment } =
      libwally.generate_commitments(b.value, b.asset, b.value_blinder, b.asset_blinder)

    commitments.set(`${asset_commitment}:${value_commitment}`, {
      asset: b.asset,
      value: b.value,
    })
  })

  return commitments
}

// Parse the blinders data from a string encoded as a comma separated list, in the following format:
// <value_in_satoshis>,<asset_tag_hex>,<amount_blinder_hex>,<asset_blinder_hex>
// This can be repeated with a comma separator to specify blinders for multiple outputs.

function parseBlinders(str) {
  const parts = str.split(',')
      , blinders = []

  while (parts.length) {
    blinders.push({
      value: verifyNum(parts.shift())
    , asset: verifyHex32(parts.shift())
    , value_blinder: verifyHex32(parts.shift())
    , asset_blinder: verifyHex32(parts.shift())
    })
  }
  return blinders
}

function verifyNum(num) {
  if (!+num) throw new Error('Invalid blinding data (invalid number)')
  return +num
}
function verifyHex32(str) {
  if (!str || !/^[0-9a-f]{64}$/i.test(str)) throw new Error('Invalid blinding data (invalid hex)')
  return str
}
