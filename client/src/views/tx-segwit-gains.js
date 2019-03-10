import Snabbdom from 'snabbdom-pragma'

const percent = num => `${num >= 0.01 ? Math.round(num*100) : (num*100).toFixed(2)}%`

const makeMessage = ({ realizedGains, potentialBech32Gains, potentialP2shGains  }, t) =>
  (realizedGains && !potentialBech32Gains)
    ? [ 'success', t`This transaction saved ${percent(realizedGains)} on fees by upgrading to native SegWit-Bech32` ]
: (realizedGains && potentialBech32Gains)
    ? [ 'warning', t`This transaction saved ${percent(realizedGains)} on fees by upgrading to SegWit and could save ${percent(potentialBech32Gains)} more by fully upgrading to native SegWit-Bech32` ]
: (potentialP2shGains || potentialBech32Gains)
    ? [ 'danger', t`This transaction could save ${percent(potentialBech32Gains)} on fees by upgrading to native SegWit-Bech32 or ${percent(potentialP2shGains)} by upgrading to SegWit-P2SH` ]
: null

export default (gains, t) => {
  const msg = makeMessage(gains, t)
  return msg ? <span className={`text-${msg[0]}`}>{msg[1]}</span> : null
}
