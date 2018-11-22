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
        { addr.tx_count != null && <div>
            <div>{t`Transaction count`}</div>
            <div>{addr.tx_count}</div>
          </div> }

        { /* unavailable for chains with CT and/or multi-assets */ }
        { addr.total_received != null && <div>
            <div>{t`Total received`}</div>
            <div className="amount">{formatAmount({ value: addr.total_received })}</div>
          </div> }
        { addr.confirmed_balance != null && <div>
            <div>{t`Confirmed balance`}</div>
            <div className="amount">{formatAmount({ value: addr.confirmed_balance })}</div>
          </div> }
        { addr.mempool_balance > 0 && <div>
            <div>{t`Unconfirmed balance`}</div>
            <div className="amount">{formatAmount({ value: addr.mempool_balance })}</div>
          </div> }
      </div>

      { addr.tx_count == null
        ? <h2>{t`Sorry! Addresses with a large number of transactions aren't currently supported.`}</h2>
        : <div>
            <div className="transactions">
              <h3>{addrTxs && addr.tx_count > perPage ? t`${addrTxs.length} of ${addr.tx_count} Transactions` : t`${addr.tx_count} Transactions`}</h3>
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
      }
    </div>
  </div>
, { t })
