
import Snabbdom from 'snabbdom-pragma'
import { formatSat, formatNumber } from './util'
import loader from '../components/loading'

const staticRoot = process.env.STATIC_ROOT || ''

export const transactions = (txs, viewMore, { t } ) => 
    <div className="tx-container">
      { !txs ? loader()
      : !txs.length ? <p>{t`No recent transactions`}</p>
      : <div className="transactions-table">
            <h3 className="table-title">{t`Latest Transactions`}</h3>
            <div className="transactions-table-row header">
              <div className="transactions-table-cell">{t`Transaction ID`}</div>
              { txs[0].value != null && <div className="transactions-table-cell">{t`Value`}</div> }
              <div className="transactions-table-cell">{t`Size`}</div>
              <div className="transactions-table-cell">{t`Fee`}</div>
            </div>
            {txs.map(txOverview => { const feerate = txOverview.fee/txOverview.vsize; return (
              <div className="transactions-table-link-row">
                <a className="transactions-table-row transaction-data" href={`tx/${txOverview.txid}`}>
                  <div className="transactions-table-cell highlighted-text" data-label={t`TXID`}>{txOverview.txid}</div>
                  { txOverview.value != null && <div className="transactions-table-cell" data-label={t`Value`}>{formatSat(txOverview.value)}</div> }
                  <div className="transactions-table-cell" data-label={t`Size`}>{`${formatNumber(txOverview.vsize)} vB`}</div>
                  <div className="transactions-table-cell" data-label={t`Fee`}>{`${feerate.toFixed(1)} sat/vB`}</div>
                </a>
              </div>
            )})}

            {txs && viewMore ?
              <a className="view-more" href="tx/recent">
                <span>{t`View more transactions`}</span>
                <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
              </a> : ""}
        </div>
      }
    </div>

  