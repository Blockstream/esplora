import Snabbdom from 'snabbdom-pragma'
import { last } from '../util'
import { formatNumber } from './util'
import layout from './layout'
import { txBox } from './tx'
import { maxMempoolTxs, assetTxsPerPage as perPage, nativeAssetLabel, nativeAssetName } from '../const'
import assetSummary from "./asset-summary";
import issuanceHistory from "./asset-issuance-history";
import advancedDetails from "./asset-advanced-details";

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, asset, assetIcons, assetTxs, goAsset, openTx, spends, tipHeight, loading, ...S }) => {
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


      // relevant for issued assets only
      , entity_type = asset.entity && Object.keys(asset.entity)[0]
      , is_non_reissuable = chain_stats.reissuance_tokens != null && chain_stats.reissuance_tokens === asset.chain_stats.burned_reissuance_tokens
      , has_blinded_issuances = chain_stats.has_blinded_issuances || mempool_stats.has_blinded_issuances
      // </>

      , is_native_asset = !asset.issuance_txin

      , circulating =
          is_native_asset
          ? chain_stats.peg_in_amount + mempool_stats.peg_in_amount
            - chain_stats.peg_out_amount - mempool_stats.peg_out_amount
            - chain_stats.burned_amount - mempool_stats.burned_amount
          : has_blinded_issuances ? null
          : chain_stats.issued_amount + mempool_stats.issued_amount
            - chain_stats.burned_amount - mempool_stats.burned_amount

  return layout(
    <div>
      <div className="container back-nav">
        <a href="/assets/" className="back-link"><span>{`<`}</span>{`All Assets`}</a>
      </div>
        <div className="container">
        {assetSummary(is_native_asset, asset, assetIcons, nativeAssetName, 
          nativeAssetLabel, entity_type, circulating, chain_stats, is_non_reissuable, t)}
        </div>

      { is_native_asset 
      // Hide Tabs if Asset is Native
            ? null : [
        <div className="container tabs">
          <input id="tab1" type="radio" name="tabs" checked/>
          <label for="tab1">Issuance History</label>
          <input id="tab2" type="radio" name="tabs"/>
          <label for="tab2">Advanced Details</label>
          <div className="content">
              <div id="content1">
                {issuanceHistory(assetTxs, chain_stats, asset, t)}
              </div>
              <div id="content2">
              {advancedDetails(asset, is_native_asset, mempool_stats, chain_stats, t)}
              </div>
          </div>
        </div>
      ]}

      {is_native_asset 
      // Show Transaction Box if Asset is Native
        ? [
            <div className="container">
              <div>
                <div className="transactions">
                  <h3>{(is_native_asset ? txsShownTextNative : txsShownTextIssued)(total_txs, est_prev_total_seen_count, shown_txs, t)}</h3>
                  { assetTxs ? assetTxs.map(tx => txBox(tx, { openTx, tipHeight, t, spends, ...S }))
                            : <img src="img/Loading.gif" className="loading-delay" /> }       
                </div>

                <div className="load-more-container">
                  <div>
                    { loading ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
                              : pagingNav(asset, last_seen_txid, est_curr_chain_seen_count, prev_paging_txids, next_paging_txids, prev_paging_est_count, t) }
                  </div>
                </div>

              </div>
            </div>
      ] : null }
    </div>
  , { t, ...S })
}

const txsShownTextIssued = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${formatNumber(total)} Issuance and Burn Transactions`
  : t`${total} Issuance and Burn Transactions`

const txsShownTextNative = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${formatNumber(total)} Peg In/Out and Burn Transactions`
  : t`${total} Peg In/Out and Burn transactions`


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


