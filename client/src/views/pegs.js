import Snabbdom from 'snabbdom-pragma'
import { last } from '../util'
import { formatNumber, formatSat } from './util'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { maxMempoolTxs, pegTxsPerPage as perPage } from '../const'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, pegStats, pegTxs, goPegs, openTx, loading, ...S }) => {
  if (!pegStats) return;

  const { chain_stats, mempool_stats } = pegStats
      , total_txs = chain_stats.tx_count + mempool_stats.tx_count
      , shown_txs = pegTxs ? pegTxs.length : 0

      , current_peg = chain_stats.peg_in_amount + mempool_stats.peg_in_amount - chain_stats.peg_out_amount - mempool_stats.peg_out_amount

      // paging is on a best-effort basis, might act oddly if the set of transactions change
      // while the user is paging.
      , avail_mempool_txs = Math.min(maxMempoolTxs, mempool_stats.tx_count)
      , est_prev_total_seen_count  = goPegs.last_txids.length ? goPegs.est_chain_seen_count + avail_mempool_txs : 0
      , est_curr_chain_seen_count = goPegs.last_txids.length ? goPegs.est_chain_seen_count + shown_txs : shown_txs - avail_mempool_txs
      , last_seen_txid = (shown_txs > 0 && est_curr_chain_seen_count < chain_stats.tx_count) ? last(pegTxs).txid : null
      , next_paging_txids = last_seen_txid ? [ ...goPegs.last_txids, last_seen_txid ].join(',') : null
      , prev_paging_txids = goPegs.last_txids.length ? goPegs.last_txids.slice(0, -1).join(',') : null
      , prev_paging_est_count = goPegs.est_chain_seen_count ? Math.max(goPegs.est_chain_seen_count-perPage, 0) : 0

  return layout(
    <div>
      <div className="jumbotron jumbotron-fluid peg-txs-page">
        <div className="container">
          { search({ t, klass: 'page-search-bar' }) }
          <h1>{t`Peg in/out transactions`}</h1>
        </div>
      </div>
      <div className="container">

        <div className="stats-table">
          <div>
            <div>{t`Total pegged in (confirmed)`}</div>
            <div className="mono">{formatSat(chain_stats.peg_in_amount)}</div>
          </div>

          {mempool_stats.peg_in_amount > 0 && <div>
            <div>{t`Total pegged in (unconfirmed)`}</div>
            <div className="mono">{formatSat(mempool_stats.peg_in_amount)}</div>
          </div>}

          <div>
            <div>{t`Total pegged out (confirmed)`}</div>
            <div className="mono">{formatSat(chain_stats.peg_out_amount)}</div>
          </div>

          {mempool_stats.peg_out_amount > 0 && <div>
            <div>{t`Total pegged out (unconfirmed)`}</div>
            <div className="mono">{formatSat(mempool_stats.peg_out_amount)}</div>
          </div>}

          <div>
            <div>{t`Peg in/out transactions (confirmed)`}</div>
            <div className="mono">{formatNumber(chain_stats.tx_count)}</div>
          </div>

          {mempool_stats.peg_out_amount > 0 && <div>
            <div>{t`Peg in/out transactions (unconfirmed)`}</div>
            <div className="mono">{formatNumber(mempool_stats.tx_count)}</div>
          </div>}

          <div>
            <div>{t`Currently in peg`}</div>
            <div className="mono">{formatSat(current_peg)}</div>
          </div>
       </div>

        <div className="transactions">
          <h3>{txsShownText(total_txs, est_prev_total_seen_count, shown_txs, t)}</h3>
          { pegTxs ? pegTxs.map(tx => txBox(tx, { openTx, t, ...S }))
                     : <img src="img/Loading.gif" className="loading-delay" /> }
        </div>

        <div className="load-more-container">
          <div>
            { loading ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
                      : pagingNav(last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) }
          </div>
        </div>

      </div>
    </div>
  , { t, ...S })
}

const txsShownText = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${formatNumber(total)} Peg In/Out Transactions`
  : t`${total} Peg In/Out Transactions`

const pagingNav = (last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) =>
  process.browser

? last_seen_txid != null &&
    <div className="load-more" role="button" data-loadmoreTxsLastTxid={last_seen_txid} data-loadmoreTxsPeg>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prev_paging_txids != null &&
      <a className="load-more" href={`/pegs?txids=${prev_paging_txids}&c=${prev_paging_est_count}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Newer`}</span>
      </a>
  , next_paging_txids != null &&
      <a className="load-more" href={`pegs?txids=${next_paging_txids}&c=${est_curr_chain_seen_count}`}>
        <span>{t`Older`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]


