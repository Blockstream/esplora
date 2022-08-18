import Snabbdom from 'snabbdom-pragma'
import { formatTime, formatNumber } from './util'
import loader from '../components/loading'

const staticRoot = process.env.STATIC_ROOT || ''

export const blks = (blocks, viewMore, loadMore, { t, loading, ...S }) =>
  <div className="block-container">
  { !blocks ? loader()
  : !blocks.length ? <p>{t`No recent blocks`}</p>
  : <div className="blocks-table">
      <h3 className="table-title">{t`Latest Blocks`}</h3>
      <div className="blocks-table-row header">
        <div className="blocks-table-cell">{t`Height`}</div>
        <div className="blocks-table-cell">{process.browser ? t`Timestamp` : t`Timestamp (UTC)`}</div>
        <div className="blocks-table-cell">{t`Transactions`}</div>
        <div className="blocks-table-cell">{t`Size (KB)`}</div>
        <div className="blocks-table-cell">{t`Weight (KWU)`}</div>
      </div>
      { blocks && blocks.map(b =>
        <div className="blocks-table-link-row">
        <a className="blocks-table-row block-data" href={`block/${b.id}`}>
          <div className="blocks-table-cell highlighted-text" data-label={t`Height`}>{b.height}</div>
          <div className="blocks-table-cell" data-label={t`Timestamp`}>{formatTime(b.timestamp, false)}</div>
          <div className="blocks-table-cell" data-label={t`Transactions`}>{formatNumber(b.tx_count)}</div>
          <div className="blocks-table-cell" data-label={t`Size (KB)`}>{formatNumber(b.size/1000)}</div>
          <div className="blocks-table-cell" data-label={t`Weight (KWU)`}>{formatNumber(b.weight/1000)}</div>
        </a>
        </div>
      )}
      {blocks && viewMore ?
      <a className="view-more" href="blocks/recent">
      <span>{t`View more blocks`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a> : ""}
      {loadMore ?
       <div className="load-more-container">
        <div>
        { loading
        ? <div className="load-more disabled"><span>{t`Load more`}</span><div>{loader("small")}</div></div>
        : pagingNav({ ...S, t }) }
        </div>
      </div> 
      : "" }
    </div>
    }
  </div>
  

const pagingNav = ({ nextBlocks, prevBlocks, t }) =>
  process.browser

? nextBlocks != null &&
    <div className="load-more" role="button" data-loadmoreBlockHeight={''+nextBlocks}>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prevBlocks != null &&
      <a className="load-more" href={`blocks/recent/?start=${prevBlocks}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Newer`}</span>
      </a>
  , nextBlocks != null &&
      <a className="load-more" href={`blocks/recent/?start=${nextBlocks}`}>
        <span>{t`Older`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]
