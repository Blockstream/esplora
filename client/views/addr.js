import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { formatAmount, addressQR, perPage } from './util'

export default ({ t, addr, addrTxs, nextMoreATxs, openTx, spends, tipHeight, loading }) => {
  if (!addr) return;

  const { chain_stats, mempool_stats } = addr
      , chain_utxo_count = chain_stats.funded_txo_count-chain_stats.spent_txo_count
      , chain_utxo_sum = chain_stats.funded_txo_sum-chain_stats.spent_txo_sum
      , mempool_utxo_count = mempool_stats.funded_txo_count-mempool_stats.spent_txo_count
      , mempool_utxo_sum = mempool_stats.funded_txo_sum-mempool_stats.spent_txo_sum
      , total_utxo_count = chain_utxo_count+mempool_utxo_count
      , total_utxo_sum = chain_utxo_sum+mempool_utxo_sum
      , total_txs = chain_stats.tx_count + mempool_stats.tx_count
      , shown_txs = addrTxs ? addrTxs.mempool.length + addrTxs.chain.length : 0

  // @fixme indent
  return layout(
    <div>
      <div className="jumbotron jumbotron-fluid addr-page">
        <div className="container">
          { search({ t, klass: 'page-search-bar' }) }
          <div className="row">
            <div className="col-sm-8">
              <h1>{t`Address`}</h1>
              <div className="block-hash">
                <span>{addr.address}</span>
                { process.browser && <div className="code-button">
                  <div className="code-button-btn" role="button" data-clipboardCopy={addr.address}></div>
                </div> }
              </div>
            </div>
            <div className="col-sm-4"><img className="float-sm-right address-qr-code" src={ addressQR(addr.address) } /></div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="addr-stats-table">
          <div>
            <div>{t`Total tx count`}</div>
            <div>{total_txs}</div>
          </div>

          { chain_stats.tx_count > 0 && <div>
            <div>{t`Confirmed tx count`}</div>
            <div>{chain_stats.tx_count}</div>
          </div> }
          { chain_stats.funded_txo_count > 0 && <div>
            <div>{t`Confirmed received`}</div>
            <div>{fmtTxos(chain_stats.funded_txo_count, chain_stats.funded_txo_sum, t)}</div>
          </div> }
          { chain_stats.spent_txo_count > 0 && <div>
            <div>{t`Confirmed sent`}</div>
            <div>{fmtTxos(chain_stats.spent_txo_count, chain_stats.spent_txo_sum, t)}</div>
          </div> }
          { chain_utxo_count > 0 && <div>
            <div>{t`Confirmed balance`}</div>
            <div>{fmtTxos(chain_utxo_count, chain_utxo_sum, t)}</div>
          </div> }

          { mempool_stats.tx_count > 0 && <div>
            <div>{t`Unconfirmed tx count`}</div>
            <div>{mempool_stats.tx_count}</div>
          </div> }
          { mempool_stats.funded_txo_count > 0 && <div>
            <div>{t`Unconfirmed received`}</div>
            <div>{fmtTxos(mempool_stats.funded_txo_count, mempool_stats.funded_txo_sum, t)}</div>
          </div> }
          { mempool_stats.spent_txo_count > 0 && <div>
            <div>{t`Unconfirmed sent`}</div>
            <div>{fmtTxos(mempool_stats.spent_txo_count, mempool_stats.spent_txo_sum, t)}</div>
          </div> }
          { mempool_utxo_count > 0 && <div>
            <div>{t`Unconfirmed balance`}</div>
            <div>{fmtTxos(mempool_utxo_count, mempool_utxo_sum, t)}</div>
          </div> }
          { total_utxo_count > 0 && <div>
            <div>{t`Total balance`}</div>
            <div>{fmtTxos(total_utxo_count, total_utxo_sum, t)}</div>
          </div> }
        </div>

        <div>
          <div className="transactions">
            <h3>{shown_txs && chain_stats.tx_count > perPage ? t`${shown_txs} of ${total_txs} Transactions` : t`${total_txs} Transactions`}</h3>
            { addrTxs ? [ ...addrTxs.mempool, ...addrTxs.chain ].map(tx => txBox(tx, { openTx, tipHeight, t, spends }))
                       : <img src="img/Loading.gif" className="loading-delay" /> }
          </div>

          { nextMoreATxs && <div className="load-more-container">
            <div>
              { loading
              ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
              : <div className="load-more" role="button" data-loadmoreTxsLastTxid={nextMoreATxs} data-loadmoreTxsAddr={addr.address}>
                  <span>{t`Load more`}</span>
                  <div><img alt="" src="img/icons/arrow_down.png" /></div>
                </div> }
            </div>
          </div> }
        </div>
      </div>
    </div>
  , { t })
}

const fmtTxos = (count, sum, t) =>
  (t`${count} outputs`)
+ (sum > 0 ? ' ' + t`of ${formatAmount({ value: sum })}` : '')
