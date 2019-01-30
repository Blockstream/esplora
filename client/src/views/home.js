import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import { formatTime } from './util'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, blocks: recentBlocks, nextMoreBlocks, loading, ...S }) => recentBlocks && layout(
  <div>
    <div className="jumbotron jumbotron-fluid">
      <div className="explorer-title-container">
        <img className="explorer-title-container_logo" alt="" src={`${staticRoot}img/icons/menu-logo.svg`} />
        <h1 className="explorer-title-container_title">{t(process.env.HOME_TITLE || process.env.SITE_TITLE || 'Block Explorer')}</h1>
      </div>
      { search({ t, autofocus: true }) }
    </div>

    <div className="title-bar-container">
      <div className="title-bar-recent-blocks">
        <h1>{t`Recent Blocks`}</h1>
      </div>
    </div>

    <div className="container">
      <div className="blocks-table">
        <div className="blocks-table-row header">
          <div className="blocks-table-cell">{t`Height`}</div>
          <div className="blocks-table-cell">{t`Timestamp`}</div>
          <div className="blocks-table-cell">{t`Transactions`}</div>
          <div className="blocks-table-cell">{t`Size (KB)`}</div>
          <div className="blocks-table-cell">{t`Weight (KWU)`}</div>
        </div>
        { recentBlocks.map(b =>
          <div className="blocks-table-link-row">
          <a className="blocks-table-row block-data" href={`block/${b.id}`}>
            <div className="blocks-table-cell highlighted-text" data-label={t`Height`}>{b.height}</div>
            <div className="blocks-table-cell" data-label={t`Timestamp`}>{formatTime(b.timestamp, t)}</div>
            <div className="blocks-table-cell" data-label={t`Transactions`}>{b.tx_count}</div>
            <div className="blocks-table-cell" data-label={t`Size (KB)`}>{b.size/1000}</div>
            <div className="blocks-table-cell" data-label={t`Weight (KWU)`}>{b.weight/1000}</div>
          </a>
          </div>
        )}
        { nextMoreBlocks != null && <div className="load-more-container">
          <div>
          { loading
          ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
          : <div className="load-more" role="button" data-loadmoreBlockHeight={nextMoreBlocks}>
              <span>{t`Load more`}</span>
              <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
            </div> }
          </div>
        </div> }
      </div>
    </div>
  </div>
, { t, ...S })
