import Snabbdom from 'snabbdom-pragma'
import { last } from '../util'
import { formatNumber, formatJson, formatAssetAmount } from './util'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { maxMempoolTxs, assetTxsPerPage as perPage } from '../const'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, asset, assetTxs, goAsset, openTx, spends, tipHeight, loading, ...S }) => {
  if (!asset) return;

  const { chain_stats = {}, mempool_stats = {} } = asset
      , total_txs = chain_stats.tx_count + mempool_stats.tx_count
      , shown_txs = assetTxs ? assetTxs.length : 0

      // paging is on a best-effort basis, might act oddly if the set of transactions change
      // while the user is paging.
      , avail_mempool_txs = Math.min(maxMempoolTxs, mempool_stats.tx_count)
      , est_prev_total_seen_count  = goAsset.last_txids.length ? goAsset.est_chain_seen_count + avail_mempool_txs : 0
      , est_curr_chain_seen_count = goAsset.last_txids.length ? goAsset.est_chain_seen_count + shown_txs : shown_txs - avail_mempool_txs
      , last_seen_txid = (shown_txs > 0 && est_curr_chain_seen_count < chain_stats.tx_count) ? last(assetTxs).txid : null
      , next_paging_txids = last_seen_txid ? [ ...goAsset.last_txids, last_seen_txid ].join(',') : null
      , prev_paging_txids = goAsset.last_txids.length ? goAsset.last_txids.slice(0, -1).join(',') : null
      , prev_paging_est_count = goAsset.est_chain_seen_count ? Math.max(goAsset.est_chain_seen_count-perPage, 0) : 0

      , entity_type = asset.entity && Object.keys(asset.entity)[0]

      , is_non_reissuable = chain_stats.reissuance_tokens != null && chain_stats.reissuance_tokens === asset.chain_stats.burned_reissuance_tokens

      // XXX could an asset have a mixture of blinded and non-blinded issuances?
      , has_blinded_issuances = chain_stats.has_blinded_issuances || mempool_stats.has_blinded_issuances

      , is_native_asset = !asset.issuance_txin

  return layout(
    <div>
      <div className="jumbotron jumbotron-fluid asset-page">
        <div className="container">
          { search({ t, klass: 'page-search-bar' }) }
          <h1>{t`Asset`}</h1>
          <div className="block-hash">
            <span>{asset.asset_id}</span>
            { process.browser && <div className="code-button">
              <div className="code-button-btn" role="button" data-clipboardCopy={asset.asset_id}></div>
            </div> }
          </div>
        </div>
      </div>
      <div className="container">
        <div className="stats-table">
          <div>
            <div>{t`Asset id`}</div>
            <div className="mono">{asset.asset_id}</div>
          </div>

          { asset.name && <div>
            <div>{t`Name`}</div>
            <div>{asset.name}</div>
          </div> }

          <div>
            <div>{t`Precision - decimal places`}</div>
            <div>{asset.precision || 0}</div>
          </div>

          { asset.ticker && <div>
            <div>{t`Ticker`}</div>
            <div>{asset.ticker}</div>
          </div> }

          { asset.entity && <div>
            <div>{t(`Issuer ${entity_type}`)}</div>
            <div>{asset.entity[entity_type]}</div>
          </div> }

          { asset.issuance_txin && <div>
            <div>{t`Issuance transaction`}</div>
            <div><a href={`tx/${asset.issuance_txin.txid}?input:${asset.issuance_txin.vin}&expand`}>{`${asset.issuance_txin.txid}:${asset.issuance_txin.vin}`}</a></div>
          </div> }

          { asset.status && <div>
            <div>{t`Included in Block`}</div>
            <div>{ asset.status.confirmed
              ? <a href={`block/${asset.status.block_hash}`} className="mono">{asset.status.block_hash}</a>
              : t`Unconfirmed`
            }</div>
          </div> }

          { chain_stats.issuance_count > 0 && <div>
            <div>{t`Number of issuances`}</div>
            <div>{chain_stats.issuance_count}</div>
          </div> }

          { mempool_stats.issuance_count > 0 && <div>
            <div>{t`Number of issuances (unconfirmed)`}</div>
            <div>{mempool_stats.issuance_count}</div>
          </div> }

          { chain_stats.issued_amount > 0 && <div>
            <div>{t`Issued amount`}</div>
            <div>{chain_stats.has_blinded_issuances ? t`Confidential`
                 : formatAssetAmount(chain_stats.issued_amount, asset.precision, t) }</div>
          </div> }

          { mempool_stats.issued_amount > 0 && <div>
            <div>{t`Issued amount (unconfirmed)`}</div>
            <div>{formatAssetAmount(mempool_stats.issued_amount, asset.precision, t)}</div>
          </div> }

          { chain_stats.burned_amount > 0 && <div>
            <div>{t`Burned amount`}</div>
            <div>{formatAssetAmount(chain_stats.burned_amount, asset.precision, t)}</div>
          </div> }

          { mempool_stats.burned_amount > 0 && <div>
            <div>{t`Burned amount (unconfirmed)`}</div>
            <div>{formatAssetAmount(mempool_stats.burned_amount, asset.precision, t)}</div>
          </div> }

          { 'reissuance_tokens' in chain_stats && <div>
            <div>{t`Reissuance tokens created`}</div>
            <div>{chain_stats.reissuance_tokens == null ? t`Confidential`
                : chain_stats.reissuance_tokens === 0 ? t`None`
                : formatNumber(chain_stats.reissuance_tokens) }</div>
          </div> }

          { chain_stats.burned_reissuance_tokens > 0 && <div>
            <div>{t`Reissuance tokens burned`}</div>
            <div>{formatNumber(chain_stats.burned_reissuance_tokens)}</div>
          </div>}

          { mempool_stats.burned_reissuance_tokens > 0 && <div>
            <div>{t`Reissuance tokens burned (unconfirmed)`}</div>
            <div>{formatNumber(mempool_stats.burned_reissuance_tokens)}</div>
          </div>}

          { !is_native_asset && <div>
            <div>{t`Re-issuable`}</div>
            <div>{ is_non_reissuable ? t`No` : t`Yes` }</div>
          </div> }

          { asset.contract_hash && <div>
            <div>{t`Contract hash`}</div>
            <div className="mono">{asset.contract_hash}</div>
          </div> }

          { asset.contract && <div>
            <div>{t`Contract JSON`}</div>
            <div className="mono contract-json">{formatJson(asset.contract)}</div>
          </div> }

        </div>

        { !is_native_asset && <div>
          <div className="transactions">
            <h3>{txsShownText(total_txs, est_prev_total_seen_count, shown_txs, t)}</h3>
            { assetTxs ? assetTxs.map(tx => txBox(tx, { openTx, tipHeight, t, spends, ...S }))
                       : <img src="img/Loading.gif" className="loading-delay" /> }
          </div>

          <div className="load-more-container">
            <div>
              { loading ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
                        : pagingNav(asset, last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) }
            </div>
          </div>

        </div> }
      </div>
    </div>
  , { t, ...S })
}

const txsShownText = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${formatNumber(total)} Issuance/Burn Transactions`
  : t`${total} Issuance/Burn Transactions`

const pagingNav = (asset, last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) =>
  process.browser

? last_seen_txid != null &&
    <div className="load-more" role="button" data-loadmoreTxsLastTxid={last_seen_txid} data-loadmoreTxsAsset={asset.asset_id}>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prev_paging_txids != null &&
      <a className="load-more" href={`asset/${asset.asset_id}?txids=${prev_paging_txids}&c=${prev_paging_est_count}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Newer`}</span>
      </a>
  , next_paging_txids != null &&
      <a className="load-more" href={`asset/${asset.asset_id}?txids=${next_paging_txids}&c=${est_curr_chain_seen_count}`}>
        <span>{t`Older`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]


