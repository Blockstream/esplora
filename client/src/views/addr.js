import { last } from "../util";
import layout from "./layout";
import { txBox } from "./tx";
import { formatSat, formatNumber } from "./util";
import { addrTxsPerPage as perPage, maxMempoolTxs } from "../const";
import loader from "../components/loading";
import { AddressHamburgerIcon, CopyIcon } from "../components/icons";
import { InfoStat } from "../components/info-stat";
import { Tooltip } from "../components/tooltip";

const staticRoot = process.env.STATIC_ROOT || "";

export default ({
  t,
  addr,
  addrQR,
  addrTxs,
  goAddr,
  openTx,
  spends,
  tipHeight,
  loading,
  ...S
}) => {
  if (!addr) return;

  const { chain_stats, mempool_stats } = addr,
    chain_utxo_count =
      chain_stats.funded_txo_count - chain_stats.spent_txo_count,
    chain_utxo_sum = chain_stats.funded_txo_sum - chain_stats.spent_txo_sum,
    mempool_utxo_count =
      mempool_stats.funded_txo_count - mempool_stats.spent_txo_count,
    mempool_utxo_sum =
      mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum,
    total_utxo_count = chain_utxo_count + mempool_utxo_count,
    total_utxo_sum = chain_utxo_sum + mempool_utxo_sum,
    total_txs = chain_stats.tx_count + mempool_stats.tx_count,
    shown_txs = addrTxs ? addrTxs.length : 0,
    // paging is on a best-effort basis, might act oddly if the set of transactions change
    // while the user is paging.
    avail_mempool_txs = Math.min(maxMempoolTxs, mempool_stats.tx_count),
    est_prev_total_seen_count = goAddr.last_txids.length
      ? goAddr.est_chain_seen_count + avail_mempool_txs
      : 0,
    est_curr_chain_seen_count = goAddr.last_txids.length
      ? goAddr.est_chain_seen_count + shown_txs
      : shown_txs - avail_mempool_txs,
    last_seen_txid =
      shown_txs > 0 && est_curr_chain_seen_count < chain_stats.tx_count
        ? last(addrTxs).txid
        : null,
    next_paging_txids = last_seen_txid
      ? [...goAddr.last_txids, last_seen_txid].join(",")
      : null,
    prev_paging_txids = goAddr.last_txids.length
      ? goAddr.last_txids.slice(0, -1).join(",")
      : null,
    prev_paging_est_count = goAddr.est_chain_seen_count
      ? Math.max(goAddr.est_chain_seen_count - perPage, 0)
      : 0;

  // in elements mode, only show QR codes for confidential addresses
  const is_confidential = process.env.IS_ELEMENTS && !!goAddr.confidential_addr,
    display_addr = is_confidential
      ? goAddr.confidential_addr
      : addr.display_addr,
    show_qr = !process.env.IS_ELEMENTS || is_confidential;

  return layout(
    [
      <div className="addr-page">
        <div className="table address-table">
          <div>
            <div className="table-header">
              <div className="table-header-icon-container">
                <AddressHamburgerIcon />
              </div>
              <h1 className="table-header-title">{t`Address`}</h1>
              <Tooltip
                iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                text={t`The full activity record for this address: transaction count, outputs received and spent, and what remains unspent.`}
              />
            </div>
            <div className="transaction-table-body">
              {show_qr && (
                <div className="addr-header-qr mobile">
                  <img className="address-qr-code" src={addrQR} />
                </div>
              )}
              <div className="identifier-row">
                <p className="identifier-text">{display_addr}</p>
                <button
                  className="table-copy-button code-button-btn"
                  type="button"
                  data-clipboardCopy={display_addr}
                  aria-label={`Copy address ${display_addr}`}
                >
                  <CopyIcon />
                </button>
              </div>
              <div className="info-stats-row">
                <InfoStat
                  title={t`Total tx count`}
                  value={formatNumber(total_txs)}
                />
                <InfoStat
                  title={t`Confirmed tx count`}
                  value={formatNumber(chain_stats.tx_count)}
                />
                <InfoStat
                  title={t`Confirmed received`}
                  value={fmtTxos(
                    chain_stats.funded_txo_count,
                    chain_stats.funded_txo_sum,
                    t,
                  )}
                />
                <InfoStat
                  title={t`Confirmed spent`}
                  value={fmtTxos(
                    chain_stats.spent_txo_count,
                    chain_stats.spent_txo_sum,
                    t,
                  )}
                />
                <InfoStat
                  title={t`Confirmed unspent`}
                  value={fmtTxos(chain_utxo_count, chain_utxo_sum, t)}
                />
              </div>
            </div>
          </div>

          {show_qr && (
            <div className="addr-header-qr desktop">
              <img className="address-qr-code" src={addrQR} />
            </div>
          )}
        </div>

        <div className="block-box">
          <div className="detail-grid">
            <div className="detail-grid-row">
              <div className="detail-field">
                <p className="detail-field-label">{t`Unconfirmed tx count`}</p>
                <div className="detail-field-content">
                  <p>{formatNumber(mempool_stats.tx_count)}</p>
                </div>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">{t`Unconfirmed received`}</p>
                <div className="detail-field-content">
                  {fmtTxos(
                    mempool_stats.funded_txo_count,
                    mempool_stats.funded_txo_sum,
                    t,
                  )}
                </div>
              </div>
            </div>

            <div className="detail-grid-row">
              <div className="detail-field">
                <p className="detail-field-label">{t`Unconfirmed spent`}</p>
                <div className="detail-field-content">
                  {fmtTxos(
                    mempool_stats.spent_txo_count,
                    mempool_stats.spent_txo_sum,
                    t,
                  )}
                </div>
              </div>

              <div className="detail-field">
                <p className="detail-field-label">{t`Total unspent`}</p>
                <div className="detail-field-content">
                  {fmtTxos(total_utxo_count, total_utxo_sum, t)}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="transactions">
          {addrTxs
            ? addrTxs.map((tx, index) =>
                txBox(tx, {
                  openTx,
                  tipHeight,
                  t,
                  spends,
                  listingIndex: est_prev_total_seen_count + index + 1,
                  listingTotal: total_txs,
                  addr,
                  ...S
                }),
              )
            : loader()}
        </div>

        <div className="load-more-container">
          <div>
            {loading ? (
              <div className="load-more g-btn font-btn-2 disabled">
                <span>{t`Loading...`}</span>
              </div>
            ) : (
              pagingNav(
                addr,
                display_addr,
                last_seen_txid,
                est_curr_chain_seen_count,
                prev_paging_txids,
                next_paging_txids,
                prev_paging_est_count,
                t,
              )
            )}
          </div>
        </div>
      </div>,
    ],
    { t, ...S },
  );
};

const fmtTxos = (count, sum, t) => {
  const outputs =
    count > 0 ? t`${formatNumber(count)} outputs` : t`No outputs`;

  if (!Number.isFinite(sum)) return outputs;

  return count > 0 ? `${formatSat(sum)} (${outputs})` : outputs;
};

const pagingNav = (
  addr,
  display_addr,
  last_seen_txid,
  est_curr_chain_seen_count,
  prev_paging_txids,
  next_paging_txids,
  prev_paging_est_count,
  t,
) =>
  process.browser
    ? last_seen_txid != null && (
        <div
          className="load-more g-btn primary-btn font-btn-2"
          role="button"
          data-loadmoreTxsLastTxid={last_seen_txid}
          data-loadmoreTxsAddr={addr.address}
        >
          {t`Load more`}
        </div>
      )
    : [
        prev_paging_txids != null && (
          <a
            className="load-more"
            href={`address/${display_addr}?txids=${prev_paging_txids}&c=${prev_paging_est_count}`}
          >
            <div>
              <img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} />
            </div>
            <span>{t`Newer`}</span>
          </a>
        ),
        next_paging_txids != null && (
          <a
            className="load-more"
            href={`address/${display_addr}?txids=${next_paging_txids}&c=${est_curr_chain_seen_count}`}
          >
            <span>{t`Older`}</span>
            <div>
              <img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} />
            </div>
          </a>
        ),
      ];
