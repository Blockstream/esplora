import { last } from '../util'
import { formatNumber, formatAssetAmount, formatSat } from './util'
import layout from './layout'
import { txBox } from './tx'
import { maxMempoolTxs, assetTxsPerPage as perPage, nativeAssetName } from '../const'
import loader from '../components/loading'
import { ConfidentialBadge, StatusBadge, StatusDot } from '../components/status-badge'
import { InfoStat } from '../components/info-stat'
import {
  AssetContractIcon,
  BurnIcon,
  CopyIcon,
  DefaultAssetIcon,
  LinkIcon,
  TxArrowsIcon
} from '../components/icons'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, asset, assetTxs, goAsset, openTx, spends, tipHeight, loading, ...S }) => {
  if (!asset) return

  const { chain_stats = {}, mempool_stats = {} } = asset
      , total_txs = value(chain_stats.tx_count) + value(mempool_stats.tx_count)
      , shown_txs = assetTxs ? assetTxs.length : 0

      // Paging is on a best-effort basis, and may shift if transactions change
      // while the user is paging.
      , avail_mempool_txs = Math.min(maxMempoolTxs, value(mempool_stats.tx_count))
      , est_curr_chain_seen_count = goAsset.last_txids.length
          ? goAsset.est_chain_seen_count + shown_txs
          : shown_txs - avail_mempool_txs
      , last_seen_txid = shown_txs > 0 && est_curr_chain_seen_count < value(chain_stats.tx_count)
          ? last(assetTxs).txid
          : null
      , next_paging_txids = last_seen_txid
          ? [ ...goAsset.last_txids, last_seen_txid ].join(',')
          : null
      , prev_paging_txids = goAsset.last_txids.length
          ? goAsset.last_txids.slice(0, -1).join(',')
          : null
      , prev_paging_est_count = goAsset.est_chain_seen_count
          ? Math.max(goAsset.est_chain_seen_count-perPage, 0)
          : 0

      , is_native_asset = !asset.issuance_txin
      , has_contract = !!asset.contract
      , is_unregistered = !is_native_asset && !has_contract
      , contract = asset.contract || {}
      , contract_entity = contract.entity || {}
      , precision = asset.precision != null ? asset.precision : 0
      , has_blinded_issuances =
          chain_stats.has_blinded_issuances || mempool_stats.has_blinded_issuances
      , total_issued = value(chain_stats.issued_amount) + value(mempool_stats.issued_amount)
      , total_burned = value(chain_stats.burned_amount) + value(mempool_stats.burned_amount)
      , total_issuances = value(chain_stats.issuance_count) + value(mempool_stats.issuance_count)
      , is_non_reissuable =
          chain_stats.reissuance_tokens != null &&
          chain_stats.reissuance_tokens === chain_stats.burned_reissuance_tokens
      , circulating = is_native_asset
          ? value(chain_stats.peg_in_amount) + value(mempool_stats.peg_in_amount)
            - value(chain_stats.peg_out_amount) - value(mempool_stats.peg_out_amount)
            - total_burned
          : has_blinded_issuances
            ? null
            : total_issued - total_burned
      , asset_title = is_native_asset
          ? nativeAssetName
          : has_contract
            ? asset.name || contract.name || asset.asset_id
            : shortenValue(asset.asset_id)
      , stats = is_native_asset
          ? [
              { title: 'TOTAL SUPPLY', value: formatSat(circulating) },
              {
                title: 'PEGGED IN',
                value: formatSat(value(chain_stats.peg_in_amount) + value(mempool_stats.peg_in_amount))
              },
              {
                title: 'PEGGED OUT',
                value: formatSat(value(chain_stats.peg_out_amount) + value(mempool_stats.peg_out_amount))
              },
              { title: 'BURNED', value: formatSat(total_burned) },
              { title: 'TRANSACTIONS', value: formatNumber(total_txs) }
            ]
          : [
              {
                title: 'TOTAL SUPPLY',
                value: circulating == null
                  ? <ConfidentialBadge t={t} />
                  : formatAssetAmount(circulating, precision, t)
              },
              {
                title: 'ISSUED',
                value: has_blinded_issuances
                  ? <ConfidentialBadge t={t} />
                  : formatAssetAmount(total_issued, precision, t)
              },
              {
                title: 'BURNED',
                value: formatAssetAmount(total_burned, precision, t)
              },
              { title: 'ISSUANCES', value: formatNumber(total_issuances) },
              { title: 'REISSUABLE', value: is_non_reissuable ? t`No` : t`Yes` }
            ]

  return layout(
    [
      <div className="asset-page">
        <div className="table asset-table">
          <div className="asset-icon-container">
            <DefaultAssetIcon/>
          </div>
          <div className="asset-table-body">
            <div className="asset-title-row">
              <h1 className="asset-title">{asset_title}</h1>
              {!is_native_asset
                ? copyButton(asset.asset_id, t`Copy asset ID`, 'asset-title-copy-button')
                : null}
              {is_unregistered ? (
                <StatusBadge variant="warning">
                  <StatusDot />
                  <span>{t`Unregistered`}</span>
                </StatusBadge>
              ) : null}
            </div>

            <div className="asset-table-details">
              <div className="asset-table-stats">
                {stats.map(stat => <InfoStat title={stat.title} value={stat.value} />)}
              </div>
              {asset.issuance_txin ? (
                <a
                  className="asset-table-issuance-link"
                  href={`tx/${asset.issuance_txin.txid}?input:${asset.issuance_txin.vin}&expand`}
                >
                  <p>{t`View Issuance Tx`}</p>
                  <LinkIcon />
                </a>
              ) : null}
            </div>
          </div>
        </div>

        {!is_native_asset && has_contract ? (
          <div className="table asset-contract-table">
            <div className="table-header">
              <div className="table-header-icon-container">
                <AssetContractIcon/>
              </div>
              <h1 className="table-header-title">{t`Contract`}</h1>
            </div>

            <div className="detail-grid">
              <div className="detail-grid-row">
                {detailField('DOMAIN', contract_entity.domain, null, t)}
                {detailField(
                  'ISSUER PUBKEY',
                  contract.issuer_pubkey,
                  'mono',
                  t,
                  shortenValue(contract.issuer_pubkey)
                )}
              </div>
              <div className="detail-grid-row">
                {detailField('NAME', contract.name, null, t)}
                {detailField('PRECISION', contract.precision, null, t)}
              </div>
              <div className="detail-grid-row">
                {detailField('TICKER', contract.ticker, null, t)}
                {detailField('VERSION', contract.version, null, t)}
              </div>
            </div>
          </div>
        ) : null}

        <div className="transactions">
          {assetTxs
            ? assetTxs.reduce((boxes, tx) => [
                ...boxes,
                ...assetTransactionHeaders(tx, asset, t).map(({ title, tooltip, Icon }) =>
                  txBox(tx, {
                    openTx,
                    tipHeight,
                    t,
                    spends,
                    headerTitle: title,
                    headerTooltip: tooltip,
                    HeaderIcon: Icon,
                    ...S
                  })
                )
              ], [])
            : loader()}
        </div>

        <div className="load-more-container">
          <div>
            {loading ? (
              <div className="load-more g-btn primary-btn font-btn-2 disabled">
                <span>{t`Loading...`}</span>
                <div>{loader('small')}</div>
              </div>
            ) : (
              pagingNav(
                asset,
                last_seen_txid,
                est_curr_chain_seen_count,
                prev_paging_txids,
                next_paging_txids,
                prev_paging_est_count,
                t
              )
            )}
          </div>
        </div>
      </div>
    ],
    { t, activeTab: 'assets', ...S }
  )
}

const value = n => n || 0

const shortenValue = value =>
  value && value.length > 20
    ? `${value.substr(0, 10)}...${value.substr(-10)}`
    : value

const display = value =>
  value == null || value === '' ? 'N/A' : value

const copyButton = (value, label, className) =>
  <div
    className={[ className, 'table-copy-button', 'code-button-btn' ].filter(Boolean).join(' ')}
    role="button"
    tabindex="0"
    data-clipboardCopy={String(value)}
    aria-label={label}
  >
    <CopyIcon />
  </div>

const detailField = (label, value, className, t, displayed_value = value) => {
  const displayed = display(displayed_value)

  return (
    <div className="detail-field">
      <p className="detail-field-label">{label}</p>
      <div className="detail-field-content">
        <p className={className}>{displayed}</p>
        {displayed !== 'N/A'
          ? copyButton(value, t`Copy ${label.toLowerCase()}`)
          : null}
      </div>
    </div>
  )
}

const isBurnOutput = (vout, asset) => {
  const is_target_asset =
    vout.asset === asset.asset_id || vout.asset === asset.reissuance_token
  const scriptpubkey = vout.scriptpubkey || ''
  const scriptpubkey_asm = vout.scriptpubkey_asm || ''

  return is_target_asset && (
    vout.scriptpubkey_type === 'op_return' ||
    vout.scriptpubkey_type === 'provably_unspendable' ||
    scriptpubkey_asm.indexOf('OP_RETURN') === 0 ||
    scriptpubkey.toLowerCase().indexOf('6a') === 0
  )
}

const assetTransactionHeaders = (tx, asset, t) => {
  const headers = []
      , vins = tx.vin || []
      , vouts = tx.vout || []
      , issuances = vins
          .map(vin => vin.issuance)
          .filter(issuance => issuance && issuance.asset_id === asset.asset_id)

  if (!asset.issuance_txin) {
    if (vins.some(vin => vin.is_pegin)) {
      headers.push({ title: t`Peg In Transaction`, Icon: TxArrowsIcon })
    }
    if (vouts.some(vout => vout.pegout)) {
      headers.push({ title: t`Peg Out Transaction`, Icon: TxArrowsIcon })
    }
  } else {
    if (issuances.some(issuance => !issuance.is_reissuance)) {
      headers.push({
        title: t`Issuance Transaction`,
        tooltip: t`The transaction that created this asset and issued its initial supply.`,
        Icon: TxArrowsIcon
      })
    }
    if (issuances.some(issuance => issuance.is_reissuance)) {
      headers.push({
        title: t`Reissuance Transaction`,
        tooltip: t`A transaction that issued additional units of this asset using its reissuance token.`,
        Icon: TxArrowsIcon
      })
    }
  }

  if (vouts.some(vout => isBurnOutput(vout, asset))) {
    headers.push({
      title: t`Burn Transaction`,
      tooltip: t`A transaction that permanently destroyed units of this asset, reducing circulating supply.`,
      Icon: BurnIcon
    })
  }

  if (!headers.length) {
    headers.push({
      title: asset.issuance_txin ? t`Asset Transaction` : t`Peg Transaction`,
      Icon: TxArrowsIcon
    })
  }

  return headers
}

const pagingNav = (
  asset,
  last_seen_txid,
  est_curr_chain_seen_count,
  prev_paging_txids,
  next_paging_txids,
  prev_paging_est_count,
  t
) =>
  process.browser

  ? last_seen_txid != null &&
      <div
        className="load-more g-btn primary-btn font-btn-2"
        role="button"
        data-loadmoreTxsLastTxid={last_seen_txid}
        data-loadmoreTxsAsset={asset.asset_id}
      >
        {t`Load more`}
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
