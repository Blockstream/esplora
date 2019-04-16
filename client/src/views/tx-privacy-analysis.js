import Snabbdom from 'snabbdom-pragma'

// each issue type is a tuple of (type, title, description, url)
//
// the issues marked as "danger" (displayed in red) are the ones where it is relatively trivial
// to avoid the issue by changing habits and/or changing wallet software. the ones marked as "warning"
// (displayed in orange) are more difficult to do something about.
const messages = {
  'internal-address-reuse': [
    'danger'
  , 'Address reuse'
  , 'This transaction re-uses addresses. This makes it trivial to track your transactions over time and link them together. Note that we currently only look for address reuse within the transaction, not across the history.'
  , 'https://en.bitcoin.it/wiki/Privacy#Address_reuse'
  ]

, 'change-detection-precision': [
    'danger'
  , 'Round payment amount'
  , 'Using round payment amounts gives an indication of which output is the payment and which is the change. To avoid leaking this information, use all available precision by adding more decimal digits to the payment amount.'
  , 'https://en.bitcoin.it/wiki/Privacy#Round_numbers'
  ]

, 'change-detection-script-types': [
    'warning'
  , 'Mixed script types'
  , 'Sending to a different script type than the one used by your wallet gives an indication of which output is the change and which is the payment.'
  , 'https://en.bitcoin.it/wiki/Privacy#Sending_to_a_different_script_type'
  ]

, 'change-detection-uih1': [
    'info'
  , 'Unnecessary input heuristic'
  , 'With some consumer wallets, this heuristic gives an indication that one output is more likely to be the change because some inputs would\'ve been unnecessary if it was the payment. Note that more sophisticated wallet software may add seemingly unnecessary inputs for different reasons.'
  , 'https://en.bitcoin.it/wiki/Privacy#Unnecessary_input_heuristic'
  ]

, 'exotic-detection-uih2': [
    'info'
  , 'Unnecessary input heuristic'
  , 'This transaction has seemingly unnecessary inputs that are not typically added by consumer wallet software with less sophisticated coin selection algorithms.'
  , 'https://en.bitcoin.it/wiki/Privacy#Unnecessary_input_heuristic'
  ]

, 'self-transfer': [
    'info'
  , 'Possibly self-transfer'
  , 'Sending exact amounts (with no change) gives an indication that the bitcoins possibly didn\'t change hands. It could also mean the change was small enough to waive it.'
  , 'https://en.bitcoin.it/wiki/Privacy#Exact_payment_amounts_.28no_change.29'
  ]

, 'coinjoin-equal-outputs': [
    'success'
  , 'Possibly a CoinJoin transaction'
  , 'CoinJoin transactions hide the link between inputs and outputs and improves Bitcoin\'s overall privacy and fungibility for everyone.'
  , 'https://en.bitcoin.it/wiki/Privacy#CoinJoin'
  ]
}

const msgOrdering = Object.values(messages)

export default (analysis, t) =>
  analysis.length ? <ul className="list-unstyled">
    {analysis.map(msg => messages[msg])
      .sort((a, b) => msgOrdering.indexOf(a) - msgOrdering.indexOf(b))
      .map(([ type, title, desc, url ]) =>
        <li title={t(desc)}><a className={`text-${type}`} href={url}>{t(title) + '➚'}</a></li>)
    }
  </ul>

  : <a className="text-success" href="https://en.bitcoin.it/wiki/Privacy#Blockchain_attacks_on_privacy">
      {t`This transaction doesn't violate any of the privacy gotchas we cover. Read on other potential ways it might leak privacy.`}➚
    </a>
