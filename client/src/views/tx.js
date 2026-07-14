import layout from "./layout";
import search from "./search";
import vinView from "./tx-vin";
import voutView from "./tx-vout";
import privacyAnalysisView from "./tx-privacy-analysis";
import segwitGainsView from "./tx-segwit-gains";
import { formatSat, formatTime, formatVMB, formatNumber } from "./util";
import {
  isAllUnconfidential,
  isAllNative,
  isRbf,
  outTotal,
  updateQuery,
} from "../util";
import {
  BlockIcon,
  CopyIcon,
  MinusIcon,
  PlusIcon,
  TxArrowsIcon,
} from "../components/icons";
import { InfoStat } from "../components/info-stat";
import { StatusBadge } from "../components/status-badge";
import BlockDetailsCard from "./block-details-card";

// Require behind env conditional so it gets removed by `envify` on non-elements builds
const deduceBlinded =
  process.env.IS_ELEMENTS && require("../lib/deduce-blinded").deduceBlinded;

// show a warning for payments paying more than 1.2x the recommended amount for 2 blocks confirmation
const OVERPAYMENT_WARN = 1.2;

const findSpend = (spends, txid, vout) => spends[txid] && spends[txid][vout];

export default ({
  t,
  tx,
  tipHeight,
  spends,
  openTx,
  page,
  unblinded,
  txBlock,
  ...S
}) => {
  if (!tx || !S.txAnalysis) return;

  const block =
    tx.status && txBlock && txBlock.id === tx.status.block_hash
      ? txBlock
      : null;

  // Amount/asset unblinding (Elements only)
  if (unblinded && !unblinded.error) {
    const { matched, total } = unblinded.tryUnblindTx(tx);
    if (matched == 0)
      unblinded.error = t`None of the given blinders matches this transaction.`;
    else if (matched < total)
      unblinded.error = t`${total - matched} of the given blinders did not match this transaction.`;
  }

  return layout(
    [
      <div className="container">
        {txHeader(tx, { t, tipHeight, ...S })}
        {unblinded && unblinded.error ? (
          <div className="transaction-warning text-danger mt-3">
            {t`Warning:`} {unblinded.error.toString()}
          </div>
        ) : (
          <div></div>
        )}
        {txBox(tx, {
          openTx,
          tipHeight,
          t,
          spends,
          query: page.query,
          ...S,
          showTxId: false,
          showFooter: false,
        })}
        {tx.status && tx.status.confirmed ? (
          <div className="block-details-card">
            <div className="table-header">
              <div className="table-header-icon-container">
                <BlockIcon />
              </div>
              <h1 className="table-header-title">Transaction Block</h1>
            </div>
            <BlockDetailsCard
              className="transaction-block-details"
              block={block}
              confirmed={tx.status.confirmed}
            />
          </div>
        ) : null}
      </div>,
    ],
    { t, page, activeTab: "recentTxs", ...S },
  );
};

const confirmationText = (status, tipHeight, t) =>
  !status.confirmed
    ? t`Unconfirmed`
    : tipHeight
      ? t`${tipHeight - status.block_height + 1} Confirmations`
      : t`Confirmed`;

export const txBox = (
  tx,
  {
    t,
    openTx,
    tipHeight,
    spends,
    query,
    unblinded,
    listingIndex,
    listingTotal,
    showTxId = true,
    showFooter = true,
    ...S
  },
) => {
  const vopt = { isOpen: openTx == tx.txid, query, t, ...S };
  const hasListingHeader =
    Number.isFinite(listingIndex) && Number.isFinite(listingTotal);

  // Try deducing unknown blinded ins/outs (elements only)
  if (process.env.IS_ELEMENTS) deduceBlinded(tx);

  return (
    <div className="transaction-box" id="transaction-box">
      {hasListingHeader ? (
        <div className="table-header">
          <div className="table-header-icon-container">
            <TxArrowsIcon />
          </div>
          <h1 className="table-header-title">
            {t`${listingIndex} of ${listingTotal} Transactions`}
          </h1>
        </div>
      ) : null}
      <div className="transaction-box-header">
        {showTxId ? (
          <div className="tx-details-txid">
            <a className="tx-details-txid-text" href={`tx/${tx.txid}`}>
              {tx.txid}
            </a>
            <div
              className="table-copy-button code-button-btn"
              role="button"
              tabindex="0"
              data-clipboardCopy={tx.txid}
              aria-label={`Copy transaction id ${tx.txid}`}
            >
              <CopyIcon />
            </div>
          </div>
        ) : (
          ""
        )}
        {btnDetails(tx.txid, vopt.isOpen, query, t)}
      </div>
      <div className="ins-and-outs">
        <div className="vins">
          {tx.vin.map((vin, index) => vinView(vin, { ...vopt, index }))}
        </div>

        <div className="ins-and-outs_spacer">
          <div className="direction-arrow-container">
            <div className="direction-arrow"></div>
          </div>
        </div>

        <div className="vouts">
          {tx.vout.map((out, index) =>
            voutView(out, {
              ...vopt,
              index,
              spend: findSpend(spends, tx.txid, index),
            }),
          )}
        </div>
      </div>
      {showFooter ? transactionFooter(tx, tipHeight, t) : null}
    </div>
  );
};

const btnDetails = (txid, isOpen, query, t) =>
  process.browser ? (
    // dynamic button in browser env
    <div className="details-btn font-btn-2 font-h5" data-toggleTx={txid}>
      {btnDetailsContent(isOpen, t)}
    </div>
  ) : (
    // or a plain link in server-side rendered env
    <a
      className="details-btn font-btn-2 font-h5"
      href={`tx/${txid}${updateQuery(query, { expand: !isOpen })}`}
    >
      {btnDetailsContent(isOpen, t)}
    </a>
  );

const btnDetailsContent = (isOpen, t) => (
  <div role="button" tabindex="0">
    <p>{t`Details`}</p>
    {isOpen ? <MinusIcon /> : <PlusIcon />}
  </div>
);

const txHeader = (
  tx,
  {
    tipHeight,
    feeEst,
    t,
    txAnalysis: {
      feerate,
      mempoolDepth,
      confEstimate,
      overpaying,
      privacyAnalysis,
      segwitGains,
    },
  },
) => {
  const isConfirmed = tx.status && tx.status.confirmed;
  const isLoadingEta = confEstimate == null || mempoolDepth == null;
  const etaMultiplier = process.env.IS_ELEMENTS ? 1 : 10;
  const etaLabel = isLoadingEta
    ? t`Loading...`
    : confEstimate == -1
      ? t`Unknown`
      : `~${confEstimate * etaMultiplier} min`;
  const confirmationTime =
    isConfirmed && Number.isFinite(tx.status.block_time)
      ? formatTime(tx.status.block_time)
      : "N/A";
  const segwitSavings = segwitGainsView(segwitGains, t);

  return (
    <span>
      <div className="transaction-table">
        <div className="table-header">
          <div className="table-header-icon-container">
            <TxArrowsIcon />
          </div>
          <h1 className="table-header-title">Transaction Details</h1>
        </div>
        <div className="transaction-table-body">
          <div className="tx-details-txid">
            <p className="tx-details-txid-text">{tx.txid}</p>
            <div
              className="table-copy-button code-button-btn"
              role="button"
              tabindex="0"
              data-clipboardCopy={tx.txid}
              aria-label={`Copy transaction id ${tx.txid}`}
            >
              <CopyIcon />
            </div>
            <StatusBadge variant={isConfirmed ? "success" : "warning"}>
              {!isConfirmed ? (
                <span className="confirmation-status-dot" aria-hidden="true">
                  <span className="confirmation-status-dot-back"></span>
                  <span className="confirmation-status-dot-middle"></span>
                  <span className="confirmation-status-dot-front"></span>
                </span>
              ) : null}
              <span>{confirmationText(tx.status, tipHeight, t)}</span>
            </StatusBadge>
          </div>
          <div className="info-stats-row">
            <InfoStat title="SIZE" value={`${formatNumber(tx.size)} B`} />
            <InfoStat
              title="VIRTUAL SIZE"
              value={`${formatNumber(Math.ceil(tx.weight / 4))} vB`}
            />
            <InfoStat
              title="WEIGHT UNITS"
              value={`${formatNumber(tx.weight)} WU`}
            />
            <InfoStat title="VERSION" value={tx.version} />
            <InfoStat title="LOCK TIME" value={tx.locktime} />

            {isRbf(tx) ? (
              <InfoStat title="REPLACE BY FEE" value={t`Opted in`} />
            ) : null}
          </div>
          <div className="transaction-details">
            <div className="transaction-details-row">
              {isConfirmed ? (
                <div className="tx-overview-panel">
                  <p className="tx-overview-panel-label">CONFIRMATION TIME</p>
                  <div className="tx-overview-panel-details">
                    <p>{confirmationTime}</p>
                  </div>
                </div>
              ) : (
                <div className="tx-overview-panel">
                  <p className="tx-overview-panel-label">ETA</p>
                  <div className="tx-overview-panel-details">
                    <div className="eta-label">
                      <div className="dot"></div>
                      <p>{etaLabel}</p>
                    </div>
                    {!isLoadingEta ? (
                      <div>
                        {confEstimate != -1 ? (
                          <p className="eta-blocks">
                            {confEstimate == 1
                              ? t`1 Block`
                              : t`${confEstimate} Blocks`}
                          </p>
                        ) : null}
                        <p className="eta-blocks-from-tip">
                          {t`${formatVMB(mempoolDepth)} from tip`}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}

              <div className="tx-overview-panel">
                <p className="tx-overview-panel-label">TRANSACTION FEES</p>
                <div className="tx-overview-panel-details">
                  {feerate != null ? (
                    <div>
                      <div className="overview-fees">
                        <p className="tx-overview-panel-fee">
                          {formatSat(tx.fee)}
                        </p>
                        <p className="tx-overview-panel-fee-p-vb">
                          {`(${feerate.toFixed(2)} sat/vB)`}
                        </p>
                      </div>
                      {overpaying > OVERPAYMENT_WARN ? (
                        <p
                          className={`overpay-warning text-${
                            overpaying > OVERPAYMENT_WARN * 1.5
                              ? "danger"
                              : "warning"
                          }`}
                          title={t`compared to the suggested fee of ${feeEst[2].toFixed(1)} sat/vB for confirmation within 2 blocks`}
                        >
                          {t`Overpaying by ${Math.round((overpaying - 1) * 100)}%`}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <p>N/A</p>
                  )}
                </div>
              </div>
            </div>

            <div className="transaction-details-row">
              <div className="tx-overview-panel">
                <p className="tx-overview-panel-label">PRIVACY ANALYSIS</p>
                <div className="tx-overview-panel-details">
                  <div>{privacyAnalysisView(privacyAnalysis, t)}</div>
                </div>
              </div>

              <div className="tx-overview-panel">
                <p className="tx-overview-panel-label">SEGWIT FEE SAVINGS</p>
                <div className="tx-overview-panel-details">
                  <div>{segwitSavings || "N/A"}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {transactionFooter(tx, tipHeight, t)}
      </div>
    </span>
  );
};

const transactionFooter = (tx, tipHeight, t) => {
  const isConfirmed = tx.status && tx.status.confirmed;

  return (
    <div className="transaction-table-footer">
      <div
        className={`transaction-table-footer-confirmation-text ${
          isConfirmed ? "text-success" : "text-warning"
        }`}
      >
        {tx.status && (
          <span>
            {confirmationText(tx.status, tipHeight, t)}{" "}
            {!tx.status.confirmed && isRbf(tx) ? t`(RBF)` : ""}
          </span>
        )}
        <span className="amount">
          {!isAllUnconfidential(tx)
            ? t`Confidential`
            : isAllNative(tx)
              ? formatSat(outTotal(tx))
              : ""}
        </span>
      </div>
    </div>
  );
};
