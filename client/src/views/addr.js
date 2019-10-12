import Snabbdom from 'snabbdom-pragma'
import { last } from '../util'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { formatSat, formatNumber } from './util'
import { addrTxsPerPage as perPage, maxMempoolTxs } from '../const'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, addr, addrQR, addrTxs, goAddr, openTx, spends, tipHeight, loading, ...S }) => {
  if (!addr) return;

  const { chain_stats, mempool_stats } = addr
      , chain_utxo_count = chain_stats.funded_txo_count-chain_stats.spent_txo_count
      , chain_utxo_sum = chain_stats.funded_txo_sum-chain_stats.spent_txo_sum
      , mempool_utxo_count = mempool_stats.funded_txo_count-mempool_stats.spent_txo_count
      , mempool_utxo_sum = mempool_stats.funded_txo_sum-mempool_stats.spent_txo_sum
      , total_utxo_count = chain_utxo_count+mempool_utxo_count
      , total_utxo_sum = chain_utxo_sum+mempool_utxo_sum
      , total_txs = chain_stats.tx_count + mempool_stats.tx_count
      , shown_txs = addrTxs ? addrTxs.length : 0

      // paging is on a best-effort basis, might act oddly if the set of transactions change
      // while the user is paging.
      , avail_mempool_txs = Math.min(maxMempoolTxs, mempool_stats.tx_count)
      , est_prev_total_seen_count  = goAddr.last_txids.length ? goAddr.est_chain_seen_count + avail_mempool_txs : 0
      , est_curr_chain_seen_count = goAddr.last_txids.length ? goAddr.est_chain_seen_count + shown_txs : shown_txs - avail_mempool_txs
      , last_seen_txid = (shown_txs > 0 && est_curr_chain_seen_count < chain_stats.tx_count) ? last(addrTxs).txid : null
      , next_paging_txids = last_seen_txid ? [ ...goAddr.last_txids, last_seen_txid ].join(',') : null
      , prev_paging_txids = goAddr.last_txids.length ? goAddr.last_txids.slice(0, -1).join(',') : null
      , prev_paging_est_count = goAddr.est_chain_seen_count ? Math.max(goAddr.est_chain_seen_count-perPage, 0) : 0

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
            <div className="col-sm-4"><img className="float-sm-right address-qr-code" src={ addrQR } /></div>
          </div>
        </div>
      </div>
      <div className="container">
        <div className="stats-table">

          { (mempool_stats.tx_count > 0 || chain_stats.tx_count == 0) && <div>
            <div>{t`Total tx count`}</div>
            <div>{total_txs}</div>
          </div> }

          { chain_stats.tx_count > 0 && <div>
            <div>{t`Confirmed tx count`}</div>
            <div>{formatNumber(chain_stats.tx_count)}</div>
          </div> }
          { chain_stats.funded_txo_count > 0 && <div>
            <div>{t`Confirmed received`}</div>
            <div>{fmtTxos(chain_stats.funded_txo_count, chain_stats.funded_txo_sum, t)}</div>
          </div> }
          { chain_stats.spent_txo_count > 0 && <div>
            <div>{t`Confirmed spent`}</div>
            <div>{fmtTxos(chain_stats.spent_txo_count, chain_stats.spent_txo_sum, t)}</div>
          </div> }
          { chain_stats.tx_count > 0 && <div>
            <div>{t`Confirmed unspent`}</div>
            <div>{fmtTxos(chain_utxo_count, chain_utxo_sum, t)}</div>
          </div> }

          { mempool_stats.tx_count > 0 && <div>
            <div>{t`Unconfirmed tx count`}</div>
            <div>{formatNumber(mempool_stats.tx_count)}</div>
          </div> }
          { mempool_stats.funded_txo_count > 0 && <div>
            <div>{t`Unconfirmed received`}</div>
            <div>{fmtTxos(mempool_stats.funded_txo_count, mempool_stats.funded_txo_sum, t)}</div>
          </div> }
          { mempool_stats.spent_txo_count > 0 && <div>
            <div>{t`Unconfirmed spent`}</div>
            <div>{fmtTxos(mempool_stats.spent_txo_count, mempool_stats.spent_txo_sum, t)}</div>
          </div> }

          { (mempool_stats.tx_count > 0 || chain_stats.tx_count == 0) && <div>
            <div>{t`Total unspent`}</div>
            <div>{fmtTxos(total_utxo_count, total_utxo_sum, t)}</div>
          </div> }
        </div>

        <div>
          <div className="transactions">
            <h3>{txsShownText(total_txs, est_prev_total_seen_count, shown_txs, t)}</h3>
            { addrTxs ? addrTxs.map(tx => txBox(tx, { openTx, tipHeight, t, spends, ...S }))
                       : <img src="img/Loading.gif" className="loading-delay" /> }
          </div>

          <div className="load-more-container">
            <div>
              { loading ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
                        : pagingNav(addr, last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) }
            </div>
          </div>

        </div>
      </div>
    </div>
  , { t, ...S })
}

const fmtTxos = (count, sum, t) =>
  (count > 0 ? t`${formatNumber(count)} outputs` : t`No outputs`)
+ (sum > 0 ? ` (${formatSat(sum)})` : '')

const txsShownText = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${formatNumber(total)} Transactions`
  : t`${total} Transactions`

const pagingNav = (addr, last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) =>
  process.browser

? last_seen_txid != null &&
    <div className="load-more" role="button" data-loadmoreTxsLastTxid={last_seen_txid} data-loadmoreTxsAddr={addr.address}>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prev_paging_txids != null &&
      <a className="load-more" href={`address/${addr.address}?txids=${prev_paging_txids}&c=${prev_paging_est_count}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Newer`}</span>
      </a>
  , next_paging_txids != null &&
      <a className="load-more" href={`address/${addr.address}?txids=${next_paging_txids}&c=${est_curr_chain_seen_count}`}>
        <span>{t`Older`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]


