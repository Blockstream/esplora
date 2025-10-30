import {formatAssetAmount} from "../views/util";

export const getSupply = (asset, t) => {
    let { chain_stats = {}, mempool_stats = {} } = asset
    let has_blinded_issuances =
        chain_stats.has_blinded_issuances || mempool_stats.has_blinded_issuances
    let is_native_asset = !asset.issuance_txin
    let circulating = is_native_asset
        ? chain_stats.peg_in_amount +
        mempool_stats.peg_in_amount -
        chain_stats.peg_out_amount -
        mempool_stats.peg_out_amount -
        chain_stats.burned_amount -
        mempool_stats.burned_amount
        : has_blinded_issuances
            ? null
            : chain_stats.issued_amount +
            mempool_stats.issued_amount -
            chain_stats.burned_amount -
            mempool_stats.burned_amount;

    let totalSupply = circulating == null ? t`Confidential`
        : formatAssetAmount(circulating, asset.precision, t)
    return totalSupply
}


// Simplicity helpers (Elements only)

// Helper to check if witness has an annex (per BIP 341)
const hasAnnex = (witness) => witness && witness.length >= 2 && witness[witness.length - 1].startsWith('50')

// Get the control block element from a witness stack (accounting for optional annex)
const getControlBlock = witness => {
    if (!witness || witness.length < 3) return null
    const hasAnnexBlock = hasAnnex(witness)
    if (hasAnnexBlock) {
        return witness[witness.length - 2]
    }
    return witness[witness.length - 1]
}

export const isSimplicityTapleafVersion = (controlBlock) => {
    return controlBlock && (controlBlock.startsWith('be') || controlBlock.startsWith('bf'))
}

// Check if a vin is a P2TR Simplicity spend
// A P2TR Simplicity spend has:
// - 4 witness elements (or 5 with optional annex)
// - is a simplicity Tapleaf
export const isSimplicitySpend = (vin) => {
    if (!process.env.IS_ELEMENTS || !vin.witness) return false

    const witnessLen = vin.witness.length
    const hasAnnexBlock = hasAnnex(vin.witness)

    // Must be 4 elements without annex, or 5 elements with annex
    if (witnessLen !== 4 && !(witnessLen === 5 && hasAnnexBlock)) return false

    const controlBlock = getControlBlock(vin.witness)
    return isSimplicityTapleafVersion(controlBlock)
}

// Extract Simplicity witness components from a vin
// Returns: { witnessData, program, cmr, controlBlock, annex }
export const getSimplicityWitness = (vin) => {
    if (!isSimplicitySpend(vin)) return null

    const witness = vin.witness
    const hasAnnexBlock = hasAnnex(witness)

    return {
        witnessData: witness[0],
        program: witness[1],
        cmr: witness[2],
        controlBlock: witness[3],
        annex: hasAnnexBlock && witness.length === 5 ? witness[4] : null
    }
}
