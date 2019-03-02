import Snabbdom from 'snabbdom-pragma'

// each issue type is a tuple of (type, title, description, url)
//
// the issues marked as "danger" (displayed in red) are the ones where it is relatively trivial
// to avoid the issue by changing habits and/or changing wallet software. the ones marked as "warning"
// (displayed in orange) are more difficult to do something about.
const issueTypes = {
  'internal-address-reuse': [
    'danger'
  , 'Address reuse'
  , 'This transaction re-uses addresses. This makes it trivial to track your transactions over time and link them together. Note that we currently only look for address reuse within the transaction, not across the history.'
  , 'https://en.bitcoin.it/wiki/Privacy#Address_reuse'
  ]

, 'change-detection-precision': [
    'danger'
  , 'Round payment amount'
  , 'Using round payment amounts gives an indication of which output is the payment and which is the change. Padding payment amounts to use all available precision resolves this issue.'
  , 'https://en.bitcoin.it/wiki/Privacy#Round_numbers'
  ]

, 'change-detection-script-types': [
    'warning'
  , 'Sending to a different script type'
  , 'It is possible to tell the change output apart because you\'re sending to a different script type than the one you\'re spending from.'
  , 'https://en.bitcoin.it/wiki/Privacy#Sending_to_a_different_script_type'
  ]

, 'change-detection-uih1': [
    'warning'
  , 'Unnecessary input heuristic'
  , 'There\'s an indication that one output is more likely to be the change because some inputs would\'ve been unnecessary if it was the payment.'
  , 'https://en.bitcoin.it/wiki/Privacy#Unnecessary_input_heuristic'
  ]

, 'exotic-detection-uih2': [
    'warning'
  , 'Unnecessary input heuristic'
  , 'This transaction has unnecessary inputs that are not typically added by wallet software.'
  , 'https://en.bitcoin.it/wiki/Privacy#Unnecessary_input_heuristic'
  ]

, 'self-transfer': [
    'warning'
  , 'Likely self-transfer'
  , 'Sending exact amounts (with no change) is an indication the bitcoins likely didn\'t change hands.'
  , 'https://en.bitcoin.it/wiki/Privacy#Exact_payment_amounts_.28no_change.29'
  ]
}

const issueOrdering = Object.values(issueTypes)

export default (issues, t) =>
  issues.length ? <ul className="list-unstyled">
    {issues.map(issue => issueTypes[issue])
      .sort((a, b) => issueOrdering.indexOf(a) - issueOrdering.indexOf(b))
      .map(([ type, title, desc, url ]) =>
        <li title={t(desc)}><a className={`text-${type}`} href={url}>{t(title) + '➚'}</a></li>)
    }
  </ul>

  : <a className="text-success" href="https://en.bitcoin.it/wiki/Privacy#Blockchain_attacks_on_privacy">
      {t`This transaction doesn't violate any of the privacy gotchas we cover. Read on other potential ways it might leak privacy.`}➚
    </a>
