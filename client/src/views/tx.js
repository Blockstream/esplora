import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import vinView from './tx-vin'
import voutView from './tx-vout'
import privacyIssuesView from './tx-privacy-issues'
import segwitGainsView from './tx-segwit-gains'
import { formatAmount, formatTime, formatVMB } from './util'
import { isAnyConfidential, isAnyPegout, isAllNative, isRbf, outTotal, updateQuery } from '../util'
import { getMempoolDepth, getConfEstimate, calcSegwitFeeGains } from '../lib/fees'
import detectPrivacyIssues from '../lib/privacy-analysis'

// show a warning for payments paying more than 1.2x the recommended amount for 2 blocks confirmation
const OVERPAYMENT_WARN = 1.2

const findSpend = (spends, txid, vout) => spends[txid] && spends[txid][vout]

export default ({ t, tx, tipHeight, spends, openTx, page, ...S }) => tx && layout(
  <div>
    <div className="jumbotron jumbotron-fluid transaction-page">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div>
          <h1 className="transaction-header-title">{t`Transaction`}</h1>
          <div className="block-hash">
            <span>{tx.txid}</span>
            { process.browser && <div className="code-button">
              <div className="code-button-btn" role="button" data-clipboardCopy={tx.txid}></div>
            </div> }
          </div>
        </div>
      </div>
    </div>
    <div className="container">
      {txHeader(tx, { t, tipHeight, ...S })}
      {txBox(tx, { openTx, tipHeight, t, spends, query: page.query })}
    </div>
  </div>
, { t, page, ...S })

const confirmationText = (status, tipHeight, t) =>
  !status.confirmed ? t`Unconfirmed` : tipHeight ? t`${tipHeight - status.block_height + 1} Confirmations` : t`Confirmed`

export const txBox = (tx, { t, openTx, tipHeight, spends, query}) => {
  const vopt = { isOpen: (openTx == tx.txid), query, t }

  return <div className="transaction-box" id="transaction-box">
    <div className="header">
      <div className="txn"><a href={`tx/${tx.txid}`}>{tx.txid}</a></div>
      {btnDetails(tx.txid, vopt.isOpen, query, t)}
    </div>
    <div className="ins-and-outs">
      <div className="vins">{tx.vin.map((vin, index) => vinView(vin, { ...vopt, index }))}</div>


      <div className="ins-and-outs_spacer">
        <div className="direction-arrow-container">
          {/* <i class="far fa-long-arrow-right"></i> */}
          <div className="direction-arrow"></div>
        </div>
      </div>


      <div className="vouts">{tx.vout.map((out, index) =>
        voutView(out, { ...vopt, index, spend: findSpend(spends, tx.txid, index) }))}
      </div>
    </div>
    <div className="footer">
      <div></div>
      <div></div>
      <div>
        <span>{tx.status && confirmationText(tx.status, tipHeight, t)} {isRbf(tx) ? t`(RBF)` : ''}</span>
        <span className="amount">{ isAnyConfidential(tx) ? t`Confidential`
              : isAllNative(tx)       ? formatAmount({ value: outTotal(tx) })
              : ''}</span>
      </div>
    </div>
  </div>
}

const btnDetails = (txid, isOpen, query, t) => process.browser
  // dynamic button in browser env
  ? <div className="details-btn" data-toggleTx={txid}>{btnDetailsContent(isOpen, t)}</div>
  // or a plain link in server-side rendered env
  :  <a className="details-btn" href={`tx/${txid}${updateQuery(query, { expand: !isOpen })}`}>{btnDetailsContent(isOpen, t)}</a>

const btnDetailsContent = (isOpen, t) =>
  <div role="button" tabindex="0">
    <div>{t`Details`}</div>
    <div className={isOpen?'minus':'plus'}></div>
  </div>

const txHeader = (tx, { tipHeight, mempool, feeEst, t }) => {
  const feerate = tx.fee ? tx.fee/tx.weight*4 : null
       , mempoolDepth = !tx.status.confirmed && feerate != null && mempool ? getMempoolDepth(mempool.fee_histogram, feerate) : null
       , confEstimate = !tx.status.confirmed && feerate != null && feeEst ? getConfEstimate(feeEst, feerate) : null
       , overpaying = !tx.status.confirmed && feerate != null && feeEst && feerate / feeEst[2]
       , privacyIssues = detectPrivacyIssues(tx)
       , segwitGains = calcSegwitFeeGains(tx)

  return (
  <div className="stats-table">
    <div>
      <div>{t`Status`}</div>
      <div>{confirmationText(tx.status, tipHeight, t)}</div>
    </div>
    {tx.status.confirmed && [
     <div>
        <div>{t`Included in Block`}</div>
        <div><a href={`block/${tx.status.block_hash}`} className="mono">{tx.status.block_hash}</a></div>
      </div>
    , <div>
        <div>{t`Block height`}</div>
        <div>{tx.status.block_height}</div>
      </div>
    , <div>
        <div>{t`Block timestamp`}</div>
        <div>{formatTime(tx.status.block_time, t)}</div>
      </div>
    ]}

    { !tx.status.confirmed && feerate != null && <div>
      <div>{t`ETA`}</div>
      <div>{confEstimate == null || mempoolDepth == null ? t`Loading...`
           : t`in ${confEstimate} blocks (${formatVMB(mempoolDepth)} from tip)` }
      </div>
    </div> }

    { feerate != null && <div>
      <div>{t`Transaction fees`}</div>
      <div>
        <span className="amount">{t`${formatAmount({ value: tx.fee })} (${feerate.toFixed(1)} sat/vB)`}</span>
        { overpaying > OVERPAYMENT_WARN &&
          <p className="text-danger mb-0" title={t`compared to bitcoind's suggested fee of ${feeEst[2].toFixed(1)} sat/vB for confirmation within 2 blocks`}>
            ⓘ {t`overpaying by ${Math.round((overpaying-1)*100)}%`}
          </p>
        }
      </div>
    </div> }

    <div>
      <div>{t`Size`}</div>
      <div>{`${tx.size} B`}</div>
    </div>
    <div>
      <div>{t`Virtual size`}</div>
      <div>{`${Math.ceil(tx.weight/4)} vB`}</div>
    </div>
    <div>
      <div>{t`Weight units`}</div>
      <div>{`${tx.weight} WU`}</div>
    </div>
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

    { !!(segwitGains.realizedGains || segwitGains.potentialBech32Gains) && <div>
      <div>{t`SegWit fee savings`}</div>
      <div className="small-sm">{segwitGainsView(segwitGains, t)}</div>
    </div> }

    <div>
      <div>{t`Privacy gotchas`}</div>
      <div className="small-sm">{privacyIssuesView(privacyIssues, t)}</div>
    </div>

  </div>)
}
