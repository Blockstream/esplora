import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import vin from './tx-vin'
import vout from './tx-vout'
import { isAnyConfidential, isAnyPegout, isAllNative, isRbf, outTotal } from '../util'
import { formatAmount } from './util'

const findSpend = (spends, txid, vout) => spends[txid] && spends[txid][vout]

export default ({ t, tx, tipHeight, spends, openTx }) => tx && layout(
  <div>
    <div className="jumbotron jumbotron-fluid transaction-page">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div>
          <h1 className="transaction-header-title">{t`Transaction`}</h1>
          <div className="block-hash">
            <span>{tx.txid}</span>
            <div className="code-button">
              <div className="code-button-btn" role="button" data-clipboardCopy={tx.txid}><img src="img/icons/copy.png" /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="container">
      {txHeader(tx, { t, tipHeight })}
      {txBox(tx, { openTx, tipHeight, t, spends })}
    </div>
  </div>
, { t })

const confirmationText = (status, tipHeight, t) =>
  !status.confirmed ? t`Unconfirmed` : tipHeight ? t`${tipHeight - status.block_height + 1} Confirmations` : t`Confirmed`

export const txBox = (tx, { t, openTx, tipHeight, spends }) => {
  const isOpen = openTx == tx.txid

  return <div className="transaction-box">
    <div className="header">
      <div className="txn"><a href={`tx/${tx.txid}`}>{tx.txid}</a></div>
      <div className="details-btn" data-toggleTx={tx.txid}>
        <div role="button" tabindex="0">
          <div>{t`Details`}</div>
          <div><img alt="" src={`img/icons/${ isOpen ? 'minus' : 'plus' }.svg`}/></div>
        </div>
      </div>
    </div>
    <div className="ins-and-outs">
      <div className="vins">{tx.vin.map(i => vin(i, { isOpen, t }))}</div>


      <div className="ins-and-outs_spacer">
        <div className="direction-arrow-container">
          {/* <i class="far fa-long-arrow-right"></i> */}
          <div className="direction-arrow"></div>
        </div>
      </div>


      <div className="vouts">{tx.vout.map((o, idx) => vout(o, { isOpen, spend: findSpend(spends, tx.txid, idx), t }))}</div>
    </div>
    <div className="footer">
      <div></div>
      <div></div>
      <div>
        <span>{confirmationText(tx.status, tipHeight, t)} {isRbf(tx) ? t`(RBF)` : ''}</span>
        <span className="amount">{ isAnyConfidential(tx) ? t`Confidential`
              : isAllNative(tx)       ? formatAmount({ value: outTotal(tx) })
              : ''}</span>
      </div>
    </div>
  </div>
}
const txHeader = (tx, { tipHeight, t }) =>
  <div className="block-stats-table">
    <div>
      <div>{t`Status`}</div>
      <div>{confirmationText(tx.status, tipHeight, t)}</div>
    </div>
   {(tx.status.confirmed) && <div>
      <div>{t`Included in Block`}</div>
      <div><a href={`block/${tx.status.block_hash}`} className="mono">{tx.status.block_hash}</a></div>
    </div>}
    <div>
      <div>{t`Size (bytes)`}</div>
      <div>{tx.size}</div>
    </div>
    <div>
      <div>{t`Virtual size (vbytes)`}</div>
      <div>{Math.ceil(tx.weight/4)}</div>
    </div>
    <div>
      <div>{t`Weight units (WU)`}</div>
      <div>{tx.weight}</div>
    </div>
   {tx.fee != null && <div>
      <div>{t`Transaction fees`}</div>
      <div className="amount">{t`${formatAmount({ value: tx.fee })} (${Math.round(tx.fee/tx.weight*4, 1)} sat/vB)`}</div>
    </div>}
    <div>
      <div>{t`Version`}</div>
      <div>{tx.version}</div>
    </div>
    <div>
      <div>{t`Lock time`}</div>
      <div>{tx.locktime}</div>
    </div>
    { isRbf(tx) && <div>
      <div>{t`Replace by fee`}</div>
      <div>{t`Opted in`}</div>
    </div> }
  </div>
