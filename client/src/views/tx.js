import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import vinView from './tx-vin'
import voutView from './tx-vout'
import privacyAnalysisView from './tx-privacy-analysis'
import segwitGainsView from './tx-segwit-gains'
import { formatSat, formatTime, formatVMB, formatNumber } from './util'
import { isAnyConfidential, isAllNative, isRbf, outTotal, updateQuery } from '../util'

// show a warning for payments paying more than 1.2x the recommended amount for 2 blocks confirmation
const OVERPAYMENT_WARN = 1.2

const findSpend = (spends, txid, vout) => spends[txid] && spends[txid][vout]

export default ({ t, tx, tipHeight, spends, openTx, page, ...S }) => tx && S.txAnalysis && layout(
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
      {txBox(tx, { openTx, tipHeight, t, spends, query: page.query, ...S })}
    </div>
  </div>
, { t, page, ...S })

const confirmationText = (status, tipHeight, t) =>
  !status.confirmed ? t`Unconfirmed` : tipHeight ? t`${tipHeight - status.block_height + 1} Confirmations` : t`Confirmed`

export const txBox = (tx, { t, openTx, tipHeight, spends, query, ...S }) => {
  const vopt = { isOpen: (openTx == tx.txid), query, t, ...S }

  return <div className="transaction-box" id="transaction-box">
    <div className="header">
      <div className="txn"><a href={`tx/${tx.txid}`}>{tx.txid}</a></div>
      {btnDetails(tx.txid, vopt.isOpen, query, t)}
    </div>
    <div className="ins-and-outs">
      <div className="vins">{tx.vin.map((vin, index) => vinView(vin, { ...vopt, index }))}</div>


      <div className="ins-and-outs_spacer">
        <div className="direction-arrow-container">
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
        {tx.status && <span>{confirmationText(tx.status, tipHeight, t)} {!tx.status.confirmed && isRbf(tx) ? t`(RBF)` : ''}</span>}
        <span className="amount">{
              isAnyConfidential(tx) ? t`Confidential`
              : isAllNative(tx)     ? formatSat(outTotal(tx))
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

const txHeader = (tx, { tipHeight, mempool, feeEst, t
                      , txAnalysis: { feerate, mempoolDepth, confEstimate, overpaying, privacyAnalysis, segwitGains } }) => {

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
        <div>{formatNumber(tx.status.block_height)}</div>
      </div>
    , <div>
        <div>{t`Block timestamp`}</div>
        <div>{formatTime(tx.status.block_time, t)}</div>
      </div>
    ]}

    { !tx.status.confirmed && feerate != null && <div>
      <div>{t`ETA`}</div>
      <div>{confEstimate == null || mempoolDepth == null ? <span className="text-muted">{t`Loading...`}</span>
           : confEstimate == -1 ? t`unknown (${formatVMB(mempoolDepth)} from tip)`
           : t`in ${confEstimate} blocks (${formatVMB(mempoolDepth)} from tip)` }
      </div>
    </div> }

    { feerate != null && <div>
      <div>{t`Transaction fees`}</div>
      <div>
        <span className="amount">{t`${formatSat(tx.fee)} (${feerate.toFixed(1)} sat/vB)`}</span>
        { overpaying > OVERPAYMENT_WARN &&
          <p className={`text-${ overpaying > OVERPAYMENT_WARN*1.5 ? 'danger' : 'warning' } mb-0`} title={t`compared to bitcoind's suggested fee of ${feeEst[2].toFixed(1)} sat/vB for confirmation within 2 blocks`}>
            ⓘ {t`overpaying by ${Math.round((overpaying-1)*100)}%`}
          </p>
        }
      </div>
    </div> }

    <div>
      <div>{t`Size`}</div>
      <div>{`${formatNumber(tx.size)} B`}</div>
    </div>
    <div>
      <div>{t`Virtual size`}</div>
      <div>{`${formatNumber(Math.ceil(tx.weight/4))} vB`}</div>
    </div>
    <div>
      <div>{t`Weight units`}</div>
      <div>{`${formatNumber(tx.weight)} WU`}</div>
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
      <div className="py-2 small-sm">{segwitGainsView(segwitGains, t)}</div>
    </div> }

    <div>
      <div>{t`Privacy analysis`}</div>
      <div className="py-2 small-sm">{privacyAnalysisView(privacyAnalysis, t)}</div>
    </div>

  </div>)
}
