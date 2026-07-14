import { formatSat, formatNumber, truncateTxid } from "./util";
import loader from "../components/loading";
import { CopyIcon, TxArrowsIcon } from "../components/icons";
import { ConfidentialBadge } from "../components/status-badge";

const staticRoot = process.env.STATIC_ROOT || "";

const feeRateClass = (feerate, feeEst) => {
  if (!feeEst || feeEst[3] == null || feeEst[12] == null) return "";

  return feerate <= feeEst[12]
    ? "success"
    : feerate <= feeEst[3]
      ? "warning"
      : "danger";
}

export const transactions = (txs, viewMore, { t, ...S }) => (
  <div className="tx-container">
    {!txs ? (
      loader()
    ) : !txs.length ? (
      <p>{t`No recent transactions`}</p>
    ) : (
      <div className="latest-transactions-table">
        <div className="table-header">
          <div className="table-header-icon-container">
            <TxArrowsIcon />
          </div>
          <h1 className="table-header-title">Latest Transactions</h1>
        </div>

        <div className="table-title-row">
          <div className="transaction-table-transaction-id">TRANSACTION ID</div>
          <div className="transaction-table-transaction-value">VALUE</div>
          <div className="transaction-table-transaction-size">SIZE</div>
          <div className="transaction-table-transaction-fee">
            FEE
          </div>
        </div>

        <div className="latest-transactions-table-body">
          {txs.map((txOverview) => {
            const feerate = txOverview.fee / txOverview.vsize;
            const feeClass = feeRateClass(feerate, S.feeEst);
            return (
              <a href={`tx/${txOverview.txid}`}>
              <div className={`transaction-table-row ${S.newTxEntries && S.newTxEntries[txOverview.txid] ? "new-table-entry" : ""}`}>
                <div className="transaction-table-field transaction-table-transaction-id">
                  <div className="transaction-table-field-label">{t`TX ID`}</div>
                  <div className="transaction-table-field-value">
                    <p>{truncateTxid(txOverview.txid)}</p>
                    <div
                      className="table-copy-button code-button-btn"
                      role="button"
                      tabindex="0"
                      data-clipboardCopy={txOverview.txid}
                      aria-label={`Copy transaction id ${txOverview.txid}`}
                    >
                      <CopyIcon />
                    </div>
                  </div>
                </div>
                <div className="transaction-table-field transaction-table-transaction-value">
                  <div className="transaction-table-field-label">{t`VALUE`}</div>
                  <div className="transaction-table-field-value">
                    {txOverview.value != null ?
                      formatSat(txOverview.value) : <ConfidentialBadge t={t} />}
                  </div>
                </div>
                <div className="transaction-table-field transaction-table-transaction-size">
                  <div className="transaction-table-field-label">{t`SIZE`}</div>
                  <div className="transaction-table-field-value">{`${formatNumber(txOverview.vsize)} vB`}</div>
                </div>
                <div className={`transaction-table-field transaction-table-transaction-fee ${feeClass}`}>
                  <div className="transaction-table-field-label">{t`FEE`}</div>
                  <div className="transaction-table-field-value">{`${feerate.toFixed(2)} sat/vB`}</div>
                </div>
              </div>
              </a>
            );
          })}
        </div>

        {txs && viewMore ? (
          <a className="view-more font-link-semibold" href="tx/recent">
            <span>{t`See more`}</span>
            <div>
              <img alt="" src={`${staticRoot}img/icons/arrow-right-blue.svg`} />
            </div>
          </a>
        ) : (
          ""
        )}
      </div>
    )}
  </div>
);
