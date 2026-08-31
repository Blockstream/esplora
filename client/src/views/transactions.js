import { formatSat, formatNumber, truncateTxid } from "./util";
import loader from "../components/loading";
import { CopyIcon, TxArrowsIcon } from "../components/icons";
import { ConfidentialBadge } from "../components/status-badge";
import { feeRateClass } from "../lib/fees";

const staticRoot = process.env.STATIC_ROOT || "";

export const transactions = (txs, viewMore, { t, ...S }) => (
  <div className="txs-page">
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
          <h1 className="table-header-title">{t`Latest Transactions`}</h1>
        </div>

        <div className="table-title-row latest-transactions-table-title-row">
          <div className="transaction-table-transaction-id">{t`TRANSACTION ID`}</div>
          <div className="transaction-table-transaction-value">{t`VALUE`}</div>
          <div className="transaction-table-transaction-size">{t`SIZE`}</div>
          <div className="transaction-table-transaction-fee">
            {t`FEE`}
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
                      aria-label={t`Copy transaction id ${txOverview.txid}`}
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
          <div className="transaction-table-view-more-container">
            <a className="view-more font-link-semibold" href="tx/recent">
              <span>{t`See More`}</span>
              <div>
                <img alt="" src={`${staticRoot}img/icons/arrow-right-blue.svg`} />
              </div>
            </a>
          </div>
        ) : (
          ""
        )}
      </div>
    )}
  </div>
);
