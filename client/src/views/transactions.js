import { formatSat, formatNumber, truncateTxid } from "./util";
import loader from "../components/loading";
import { CopyIcon, TxArrowsIcon } from "../components/icons";

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
      <div className="transaction-table">
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

        <div className="transaction-table-body">
          {txs.map((txOverview) => {
            const feerate = txOverview.fee / txOverview.vsize;
            const feeClass = feeRateClass(feerate, S.feeEst);
            return (
              <a href={`tx/${txOverview.txid}`}>
              <div className={`transaction-table-row ${S.newTxEntries && S.newTxEntries[txOverview.txid] ? "new-table-entry" : ""}`}>
                <div className="transaction-table-transaction-id">
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
                <div className="transaction-table-transaction-value">
                  {txOverview.value ?
                    formatSat(txOverview.value) : "Confidential"}
                </div>
                <div className="transaction-table-transaction-size">{`${formatNumber(txOverview.vsize)} vB`}</div>
                <div className={`transaction-table-transaction-fee ${feeClass}`}>{`${feerate.toFixed(1)} sat/vB`}</div>
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
