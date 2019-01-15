import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { formatAmount, addressQR, perPage } from './util'

export default ({ t, addr, addrTxs, nextMoreATxs, openTx, spends, tipHeight, loading }) => addr && layout(
  <div>
    <div className="jumbotron jumbotron-fluid addr-page">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div className="row">
          <div className="col-sm-8">
            <h1>{t`Address`}</h1>
            <div className="block-hash"><span>{addr.address}</span>
              <div className="code-button">
                <div className="code-button-btn" role="button" data-clipboardCopy={addr.address}><img alt="" src="img/icons/copy.png" /></div>
              </div>
            </div>
          </div>
          <div className="col-sm-4"><img className="float-sm-right address-qr-code" src={ addressQR(addr.address) } /></div>
        </div>
      </div>
    </div>
    <div className="container">
      <div className="addr-stats-table">
        { addr.stats.tx_count != null && <div>
            <div>{t`Transaction count`}</div>
            <div>{addr.stats.tx_count}</div>
          </div> }

        { /* unavailable for chains with CT and/or multi-assets */ }
        { /* XXX: currently displays confirmed stats only, no mempool data */ }

        { addr.stats.funded_txo_sum != null && <div>
          <div>{t`Received`}</div>
          <div className="amount">{t`${addr.stats.funded_txo_count} outputs`} (total {formatAmount({ value: addr.stats.funded_txo_sum })})</div>
        </div> }

        { addr.stats.spent_txo_sum != null && <div>
          <div>{t`Sent`}</div>
          <div className="amount">{t`${addr.stats.spent_txo_count} outputs`} (total {formatAmount({ value: addr.stats.spent_txo_sum })})</div>
        </div> }

        { addr.stats.funded_txo_count > addr.stats.spent_txo_count && <div>
          <div>{t`Unspent`}</div>
          <div className="amount">{t`${addr.stats.funded_txo_count-addr.stats.spent_txo_count} outputs`} (total {formatAmount({ value: addr.stats.funded_txo_sum - addr.stats.spent_txo_sum})})</div>
        </div> }

      </div>

      <div>
        <div className="transactions">
          <h3>{addrTxs && addr.stats.tx_count > perPage ? t`${addrTxs.length} of ${addr.stats.tx_count} Transactions` : t`${addr.stats.tx_count} Transactions`}</h3>
          { addrTxs ? addrTxs.map(tx => txBox(tx, { openTx, tipHeight, t, spends }))
                     : <img src="img/Loading.gif" className="loading-delay" /> }
        </div>

        { nextMoreATxs && <div className="load-more-container">
          <div>
            { loading
            ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
            : <div className="load-more" role="button" data-loadmoreTxsIndex={nextMoreATxs} data-loadmoreTxsAddr={addr.address}>
                <span>{t`Load more`}</span>
                <div><img alt="" src="img/icons/arrow_down.png" /></div>
              </div> }
          </div>
        </div> }
      </div>
    </div>
  </div>
, { t })
