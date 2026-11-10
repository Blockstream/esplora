const reNumber = /^\d+$/
    , reAddrLike = /^([a-km-zA-HJ-NP-Z1-9]{26,35}|[a-km-zA-HJ-NP-Z1-9]{80}|[a-z]{2,5}1[ac-hj-np-z02-9]{8,100}|[A-Z]{2,5}1[AC-HJ-NP-Z02-9]{8,100})$/
    , reShortTxOut = /^(\d+)([x:])(\d+)\2(\d+)$/
    , stripUri = s => s.replace(/^(?:bitcoin|liquidnetwork):([^?]+).*/i, '$1')

export const normalizeSearchQuery = query => stripUri(query.trim())
export const isNumberSearch = query => reNumber.test(query)
export const isAddressSearch = query => reAddrLike.test(query)
export const matchShortTxOut = query => query.match(reShortTxOut)
