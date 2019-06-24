import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import { formatTime, formatSat, formatNumber } from './util'

const staticRoot = process.env.STATIC_ROOT || ''
const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
    <div className="jumbotron jumbotron-fluid">
      <div className="explorer-title-container">
        <img className="explorer-title-container_logo" alt="" src={`${staticRoot}img/icons/menu-logo.png`} />
        <h1 className="explorer-title-container_title">{t(process.env.HOME_TITLE || process.env.SITE_TITLE || 'Block Explorer')}</h1>
      </div>
      { search({ t, autofocus: !isTouch }) }
    </div>

    <div className="title-bar-container">
      <div className="title-bar-recent">
        <h1>
          <a href="." class={{ active: activeTab == 'recentBlocks' }}>Blocks</a>
          <a href="tx/recent" class={{ active: activeTab == 'recentTxs' }}>Transactions</a>
        </h1>
      </div>
    </div>

    { body }
  </div>
, { t, ...S })

export const recentBlocks = ({ t, blocks, loading, ...S }) => homeLayout(
  <div className="container">
    <div className="blocks-table">
      <div className="blocks-table-row header">
        <div className="blocks-table-cell">{t`Height`}</div>
        <div className="blocks-table-cell">{t`Timestamp`}</div>
        <div className="blocks-table-cell">{t`Transactions`}</div>
        <div className="blocks-table-cell">{t`Size (KB)`}</div>
        <div className="blocks-table-cell">{t`Weight (KWU)`}</div>
      </div>
      { blocks && blocks.map(b =>
        <div className="blocks-table-link-row">
        <a className="blocks-table-row block-data" href={`block/${b.id}`}>
          <div className="blocks-table-cell highlighted-text" data-label={t`Height`}>{formatNumber(b.height)}</div>
          <div className="blocks-table-cell" data-label={t`Timestamp`}>{formatTime(b.timestamp, t)}</div>
          <div className="blocks-table-cell" data-label={t`Transactions`}>{formatNumber(b.tx_count)}</div>
          <div className="blocks-table-cell" data-label={t`Size (KB)`}>{formatNumber(b.size/1000)}</div>
          <div className="blocks-table-cell" data-label={t`Weight (KWU)`}>{formatNumber(b.weight/1000)}</div>
        </a>
        </div>
      )}
      { <div className="load-more-container">
        <div>
        { loading
        ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
        : pagingNav({ ...S, t }) }
        </div>
      </div> }
    </div>
  </div>
, { ...S, t, activeTab: 'recentBlocks' })

const pagingNav = ({nextBlocks, prevBlocks, t }) =>
  process.browser

? nextBlocks &&
    <div className="load-more" role="button" data-loadmoreBlockHeight={nextBlocks}>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prevBlocks != null &&
      <a className="load-more" href={`?start=${prevBlocks}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Newer`}</span>
      </a>
  , nextBlocks != null &&
      <a className="load-more" href={`?start=${nextBlocks}`}>
        <span>{t`Older`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]

export const recentTxs = ({ mempoolRecent, t, ...S }) => homeLayout(
  <div className="container">
    { !mempoolRecent ? <img src="img/Loading.gif" className="loading-delay" />
    : !mempoolRecent.length ? <p>{t`No recent transactions`}</p>
    : <div className="transactions-table">
          <div className="transactions-table-row header">
            <div className="transactions-table-cell">{t`TXID`}</div>
            { mempoolRecent[0].value != null && <div className="transactions-table-cell">{t`Value`}</div> }
            <div className="transactions-table-cell">{t`Size`}</div>
            <div className="transactions-table-cell">{t`Fee`}</div>
          </div>
          {mempoolRecent.map(txOverview => { const feerate = txOverview.fee/txOverview.vsize; return (
            <div className="transactions-table-link-row">
              <a className="transactions-table-row transaction-data" href={`tx/${txOverview.txid}`}>
                <div className="transactions-table-cell highlighted-text" data-label={t`TXID`}>{txOverview.txid}</div>
                { txOverview.value != null && <div className="transactions-table-cell" data-label={t`Value`}>{formatSat(txOverview.value)}</div> }
                <div className="transactions-table-cell" data-label={t`Size`}>{`${formatNumber(txOverview.vsize)} vB`}</div>
                <div className="transactions-table-cell" data-label={t`Fee`}>{`${feerate.toFixed(1)} sat/vB`}</div>
              </a>
            </div>
          )})}
      </div>
    }
  </div>
, { ...S, t, activeTab: 'recentTxs' })
