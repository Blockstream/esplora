import { BlockGrid } from "../components/block-grid";
import { ElapsedTime } from "../components/elapsed-time";
import { ExpectedBlockTime } from "../components/expected-block-time";
import {
  LightningBoltIcon,
  MinusIcon,
  PlusIcon,
} from "../components/icons";
import { InfoCard } from "../components/info-card";
import { MempoolCongestion } from "../components/mempool-congestion";
import { MetricBar } from "../components/metric-bar";
import { StatusBadge, StatusDot } from "../components/status-badge";
import { renderBlockGrid } from "../components/transaction-block-grid";
import {
  blockGridLoadingDelayMs,
  satoshisPerBitcoin,
} from "../const";
import { getFeeTierBoundaries } from "../lib/fees";
import {
  formatCount,
  formatFeeBoundary,
  formatMegabytes,
  formatPanelPercentage,
  formatPercentage,
  formatTransactionDelta,
  formatWeight,
} from "../lib/pending-block-details";
import { getLatestBitcoinPrice } from "../lib/market";
import { formatFeeRate, formatSat, formatUsd, formatVMB } from "./util";

// Fee estimates are inclusive upper bounds, while the grid expects inclusive
// lower thresholds. Move just beyond a boundary so an equal rate stays in the
// lower tier.
const exclusiveFeeTierMinimum = (value) =>
  value + Math.max(1, Math.abs(value)) * Number.EPSILON;

const getBlockGridConfig = (
  element,
  boundaries,
  weightLimit,
  t,
) => {
  if (typeof window === "undefined") return null;

  const styles = window.getComputedStyle(element);
  const cssValue = (property) => styles.getPropertyValue(property).trim();
  const rgbColor = (property) => `rgb(${cssValue(property)})`;
  const neutralColor = rgbColor("--accent-color-rgb");
  const feeTiers = boundaries
    ? {
        low: {
          threshold: 0,
          color: rgbColor("--success-color-rgb"),
        },
        medium: {
          threshold: exclusiveFeeTierMinimum(boundaries.lowMaximum),
          color: rgbColor("--warning-color-rgb"),
        },
        high: {
          threshold: exclusiveFeeTierMinimum(
            Math.max(
              boundaries.mediumMaximum,
              exclusiveFeeTierMinimum(boundaries.lowMaximum),
            ),
          ),
          color: rgbColor("--danger-color-rgb"),
        },
      }
    : {
        low: { threshold: 0, color: neutralColor },
        medium: { threshold: Number.MAX_VALUE / 2, color: neutralColor },
        high: { threshold: Number.MAX_VALUE, color: neutralColor },
      };
  const options = {
    backgroundColor: cssValue("--surface-primary-color"),
    placeholderColor: cssValue("--surface-secondary-color"),
    weightLimit,
    labels: {
      allTransactionsShown:
        t`All selected transactions are shown individually.`,
      fee: t`Fee`,
      feeRate: t`Fee rate`,
      individuallyRendered: t`Individually rendered transactions`,
      keyboardInstructions:
        t`Use the arrow keys to inspect transactions and Enter to open one.`,
      omittedTransactions:
        t`Lower-fee transactions are summarized in the metrics because they do not fit at this resolution.`,
      transaction: t`Transaction`,
      transactionGrid: t`Pending block transaction grid`,
      virtualSize: t`Virtual size`,
    },
  };

  return {
    feeTiers,
    options,
    key: JSON.stringify({ feeTiers, options }),
  };
};

const showPendingBlockGridLoading = (element, label) => {
  const loading = document.createElement("div");
  const wave = document.createElement("div");

  loading.className = "pending-block-grid-loading";
  loading.setAttribute("role", "status");
  loading.setAttribute("aria-label", label);
  wave.className = "pending-block-grid-loading-wave";
  wave.setAttribute("aria-hidden", "true");

  for (let index = 0; index < 25; index += 1) {
    const cell = document.createElement("span");
    const row = Math.floor(index / 5);
    const column = index % 5;
    cell.style.animationDelay = `${(row + column) * 70}ms`;
    wave.append(cell);
  }

  loading.append(wave);
  element.classList.add("block-grid");
  element.replaceChildren(loading);
};

const clearPendingBlockGridLoadingTimer = (gridState) => {
  if (gridState.loadingTimer !== null) {
    window.clearTimeout(gridState.loadingTimer);
    gridState.loadingTimer = null;
  }
};

const schedulePendingBlockGridLoading = (
  element,
  gridState,
  loadingDelayMs,
  loadingLabel,
) => {
  clearPendingBlockGridLoadingTimer(gridState);
  gridState.loadingTimer = window.setTimeout(() => {
    gridState.loadingTimer = null;
    if (!gridState.destroyed && !gridState.handle) {
      showPendingBlockGridLoading(element, loadingLabel);
    }
  }, loadingDelayMs);
};

const cancelPendingBlockGridWork = (gridState) => {
  if (gridState.paintFrame !== null) {
    window.cancelAnimationFrame(gridState.paintFrame);
  }
  if (gridState.workFrame !== null) {
    window.cancelAnimationFrame(gridState.workFrame);
  }
  gridState.paintFrame = null;
  gridState.workFrame = null;
};

const sameGridTransactions = (first, second) =>
  first === second ||
  (Array.isArray(first) &&
    Array.isArray(second) &&
    first.length === second.length &&
    first.every(
      (transaction, index) =>
        transaction.txid === second[index].txid &&
        transaction.fee === second[index].fee &&
        transaction.weight === second[index].weight,
    ));

const queuePendingBlockGridWork = (
  element,
  gridState,
  transactions,
  config,
) => {
  gridState.targetTransactions = transactions;
  gridState.targetConfig = config;
  if (gridState.paintFrame !== null || gridState.workFrame !== null) return;

  gridState.paintFrame = window.requestAnimationFrame(() => {
    gridState.paintFrame = null;
    gridState.workFrame = window.requestAnimationFrame(() => {
      gridState.workFrame = null;
      if (gridState.destroyed) return;

      const nextConfig = gridState.targetConfig;
      const nextTransactions = gridState.targetTransactions;
      if (!nextConfig) return;

      if (!gridState.handle || gridState.configKey !== nextConfig.key) {
        const transactionBaseUrl = new URL("tx", document.baseURI).href;
        gridState.handle = renderBlockGrid(
          "pending-block",
          nextTransactions,
          transactionBaseUrl,
          nextConfig.feeTiers,
          nextConfig.options,
        );
        gridState.configKey = nextConfig.key;
        gridState.transactions = nextTransactions;
      } else if (
        !sameGridTransactions(gridState.transactions, nextTransactions)
      ) {
        gridState.handle.update(nextTransactions);
        gridState.transactions = nextTransactions;
      }

      clearPendingBlockGridLoadingTimer(gridState);
    });
  });
};

const mountPendingBlockGrid = (
  vnode,
  transactions,
  boundaries,
  weightLimit,
  t,
  loadingDelayMs = blockGridLoadingDelayMs,
) => {
  const gridState = {
    configKey: null,
    destroyed: false,
    handle: null,
    loadingTimer: null,
    paintFrame: null,
    targetConfig: null,
    targetTransactions: transactions,
    transactions: null,
    workFrame: null,
  };
  const loadingLabel = t`Loading pending block transactions`;

  vnode.elm.pendingBlockGrid = gridState;
  vnode.elm.classList.add("block-grid");
  schedulePendingBlockGridLoading(
    vnode.elm,
    gridState,
    loadingDelayMs,
    loadingLabel,
  );

  const config = getBlockGridConfig(
    vnode.elm,
    boundaries,
    weightLimit,
    t,
  );
  if (config && Array.isArray(transactions)) {
    queuePendingBlockGridWork(vnode.elm, gridState, transactions, config);
  }
};

const patchPendingBlockGrid = (
  _,
  vnode,
  transactions,
  boundaries,
  weightLimit,
  t,
) => {
  const gridState = vnode.elm.pendingBlockGrid;
  const config = getBlockGridConfig(
    vnode.elm,
    boundaries,
    weightLimit,
    t,
  );

  if (!gridState || !config) return;
  if (!Array.isArray(transactions)) {
    cancelPendingBlockGridWork(gridState);
    if (gridState.handle) gridState.handle.destroy();
    gridState.handle = null;
    gridState.configKey = null;
    gridState.transactions = null;
    gridState.targetTransactions = null;
    schedulePendingBlockGridLoading(
      vnode.elm,
      gridState,
      blockGridLoadingDelayMs,
      t`Loading pending block transactions`,
    );
    return;
  }
  if (
    gridState.targetConfig &&
    gridState.targetConfig.key === config.key &&
    sameGridTransactions(gridState.targetTransactions, transactions)
  ) {
    return;
  }

  queuePendingBlockGridWork(vnode.elm, gridState, transactions, config);
};

const destroyPendingBlockGrid = (vnode) => {
  const gridState = vnode.elm.pendingBlockGrid;
  if (!gridState) return;

  gridState.destroyed = true;
  clearPendingBlockGridLoadingTimer(gridState);
  cancelPendingBlockGridWork(gridState);
  if (gridState.handle) gridState.handle.destroy();
  vnode.elm.pendingBlockGrid = null;
};

const formatFeeCost = (sats, bitcoinPrice, fallback = "N/A") => {
  if (!Number.isFinite(sats) || !Number.isFinite(bitcoinPrice)) {
    return fallback;
  }

  const usdValue = (sats / satoshisPerBitcoin) * bitcoinPrice;
  return `${formatSat(Math.round(sats))} / ${formatUsd(usdValue, fallback)}`;
};

const blockStat = (title, value) => (
  <div className="pending-block-stat">
    <p className="pending-block-stat-header">{title}</p>
    <p className="pending-block-stat-value">{value}</p>
  </div>
);

const detailPanel = (className, title, value, footer, tooltipText) => (
  <InfoCard
    className={className}
    title={title}
    tooltip={tooltipText}
    value={value}
    footer={footer === undefined ? "N/A" : footer}
  />
);

const feeBucketPanel = (
  className,
  title,
  bucket,
  bitcoinPrice,
  valueFallback,
  costFallback,
  tooltipText,
) =>
  detailPanel(
    className,
    title,
    bucket
      ? formatFeeRate(bucket.averageFeeRate, valueFallback)
      : valueFallback,
    bucket
      ? formatFeeCost(bucket.averageFee, bitcoinPrice, costFallback)
      : costFallback,
    tooltipText,
  );

const PendingBlockDetailsCard = ({
  bitcoinMarketChart,
  block,
  blockTemplate,
  detailsOpen,
  feeEst,
  mempool,
  metrics,
  t,
  transactionDelta,
}) => {
  const unavailable = t`N/A`;
  const templateFallback = blockTemplate ? unavailable : "-";
  const feeEstimateFallback = feeEst ? unavailable : "-";
  const mempoolFallback = mempool ? unavailable : "-";
  const feeBucketFallback =
    blockTemplate && feeEst ? unavailable : "-";
  const feeCostFallback =
    blockTemplate && feeEst && bitcoinMarketChart ? unavailable : "-";
  const totalFeesUsdFallback =
    blockTemplate && bitcoinMarketChart ? unavailable : "-";
  const gridTransactions =
    blockTemplate && Array.isArray(blockTemplate.transactions)
      ? blockTemplate.transactions
      : null;
  const feeTierBoundaries = getFeeTierBoundaries(feeEst);
  const bitcoinPrice = getLatestBitcoinPrice(bitcoinMarketChart);
  const weightPercentage = metrics && metrics.weightPercentage;
  const weightLimit = metrics && metrics.weightLimit;
  return (
    <div className="pending-block-details-card">
      <div className="pending-block-details-card-summary">
        <BlockGrid
          blockWeight={metrics && metrics.totalWeight}
          formatAriaLabel={(percentage) => t`Block is ${percentage}% full`}
          loading={!blockTemplate}
          loadingLabel={t`Loading block utilization`}
          unavailableLabel={t`Block utilization unavailable`}
          weightLimit={weightLimit}
        />

        <div className="pending-block-details">
          <div className="pending-block-details-card-header">
            <p className="block-number">{t`Next Block`}</p>

            <p className="pending-block-timestamp">
              {block ? (
                <ExpectedBlockTime timestamp={block.timestamp} t={t} />
              ) : (
                "-"
              )}
            </p>
            <button
              aria-expanded={detailsOpen ? "true" : "false"}
              className="pending-block-details-button"
              type="button"
              data-togglePendingBlockDetails
            >
              {detailsOpen ? <MinusIcon /> : <PlusIcon />}
              {t`Details`}
            </button>
          </div>

          <div className="pending-block-stats">
            {blockStat(
              t`AVG FEE`,
              formatFeeRate(
                metrics && metrics.averageFeeRate,
                templateFallback,
              ),
            )}
            {blockStat(
              t`TRANSACTIONS`,
              formatCount(
                metrics && metrics.transactionCount,
                templateFallback,
              ),
            )}
            {blockStat(
              t`SIZE`,
              metrics && Number.isFinite(metrics.totalSize)
                ? formatVMB(metrics.totalSize, "MB")
                : templateFallback,
            )}
            {blockStat(
              t`TOTAL FEE COLLECTED`,
              metrics && Number.isFinite(metrics.totalFees)
                ? formatSat(metrics.totalFees)
                : templateFallback,
            )}
          </div>

          <div className="pending-block-progress">
            <div className="pending-block-filling">
              <p>{t`Block filling`}</p>
              <p className="usage-number">
                {formatPercentage(
                  weightPercentage,
                  templateFallback,
                )}
              </p>
            </div>

            <div className="pending-block-usage-bar">
              <div
                className="pending-block-usage-bar-fill"
                style={{
                  width: `${Number.isFinite(weightPercentage) ? weightPercentage : 0}%`,
                  backgroundSize: Number.isFinite(weightPercentage)
                    ? `${10_000 / Math.max(weightPercentage, 1)}% 100%`
                    : "100% 100%",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {detailsOpen ? (
        <div className="expanded-pending-block-details">
          <div className="expanded-pending-block-grid-container">
            <div className="pending-block-container">
              <div
                id="pending-block"
                className="pending-block"
                hook-insert={(vnode) =>
                  mountPendingBlockGrid(
                    vnode,
                    gridTransactions,
                    feeTierBoundaries,
                    weightLimit,
                    t,
                  )
                }
                hook-postpatch={(oldVnode, vnode) =>
                  patchPendingBlockGrid(
                    oldVnode,
                    vnode,
                    gridTransactions,
                    feeTierBoundaries,
                    weightLimit,
                    t,
                  )
                }
                hook-destroy={destroyPendingBlockGrid}
              ></div>
            </div>
            {feeTierBoundaries ? (
              <div className="pending-block-legend">
                <div className="pending-block-legend-item">
                  <div className="pending-block-color-reference success"></div>
                  <p className="pending-block-legend-label">
                    {t`Low`} (
                    {`≤${formatFeeBoundary(feeTierBoundaries.lowMaximum)} sat/vB`}
                    )
                  </p>
                </div>
                <div className="pending-block-legend-item">
                  <div className="pending-block-color-reference warning"></div>
                  <p className="pending-block-legend-label">
                    {t`Medium`} (
                    {`>${formatFeeBoundary(feeTierBoundaries.lowMaximum)}–≤${formatFeeBoundary(feeTierBoundaries.mediumMaximum)} sat/vB`}
                    )
                  </p>
                </div>
                <div className="pending-block-legend-item">
                  <div className="pending-block-color-reference danger"></div>
                  <p className="pending-block-legend-label">
                    {t`High`} (
                    {`>${formatFeeBoundary(feeTierBoundaries.mediumMaximum)} sat/vB`}
                    )
                  </p>
                </div>
              </div>
            ) : (
              <p className="pending-block-legend-unavailable">
                {blockTemplate
                  ? t`Fee-rate estimates are unavailable; transactions use a neutral color.`
                  : feeEstimateFallback}
              </p>
            )}
          </div>
          <div className="expanded-pending-block-stats">
            <div className="expanded-pending-block-row">
              {detailPanel(
                "time-since-last-block",
                t`Time Since Last Block`,
                block ? (
                  <ElapsedTime timestamp={block.timestamp} compact />
                ) : (
                  "-"
                ),
                block ? t`Block #${block.height.toLocaleString()}` : "-",
                t`Elapsed time since the last block confirmed.`,
              )}
              <InfoCard
                className="block-transactions"
                title={t`Transactions`}
                tooltip={t`Transactions currently selected for the pending block, including the coinbase transaction.`}
                headerValue={
                  metrics ? (
                    <StatusBadge variant="success">
                      <StatusDot />
                      <span>{t`Live`}</span>
                    </StatusBadge>
                  ) : undefined
                }
                value={
                  <span className="pending-block-transaction-value">
                    <span>
                      {formatCount(
                        metrics && metrics.transactionCount,
                        templateFallback,
                      )}
                    </span>
                    {Number.isFinite(transactionDelta) &&
                    transactionDelta !== 0 ? (
                      <span
                        className="pending-block-transaction-delta"
                        aria-label={
                          transactionDelta > 0
                            ? t`${Math.abs(transactionDelta)} added since the last update`
                            : t`${Math.abs(transactionDelta)} removed since the last update`
                        }
                      >
                        <span>{formatTransactionDelta(transactionDelta)}</span>
                        <LightningBoltIcon />
                      </span>
                    ) : null}
                  </span>
                }
                footer={
                  metrics
                    ? t`${formatCount(metrics.templateTransactionCount)} SELECTED + COINBASE`
                    : templateFallback
                }
              />
            </div>
            <div className="expanded-pending-block-row">
              {feeBucketPanel(
                "low-fee",
                t`Low`,
                metrics && metrics.feeBuckets.low,
                bitcoinPrice,
                feeBucketFallback,
                feeCostFallback,
                t`Average fee rate and transaction fee in the low-fee portion of this template.`,
              )}
              {feeBucketPanel(
                "avg-fee",
                t`Average`,
                metrics && metrics.feeBuckets.medium,
                bitcoinPrice,
                feeBucketFallback,
                feeCostFallback,
                t`Average fee rate and transaction fee in the middle-fee portion of this template.`,
              )}
              {feeBucketPanel(
                "high-fee",
                t`High`,
                metrics && metrics.feeBuckets.high,
                bitcoinPrice,
                feeBucketFallback,
                feeCostFallback,
                t`Average fee rate and transaction fee in the high-fee portion of this template.`,
              )}
            </div>
            <div className="expanded-pending-block-row">
              {detailPanel(
                "total-fees-collected",
                t`Total Fees Collected`,
                metrics && Number.isFinite(metrics.totalFees)
                  ? formatSat(metrics.totalFees)
                  : templateFallback,
                metrics &&
                Number.isFinite(metrics.totalFees) &&
                Number.isFinite(bitcoinPrice)
                  ? formatUsd(
                      (metrics.totalFees / satoshisPerBitcoin) * bitcoinPrice,
                    )
                  : totalFeesUsdFallback,
                t`Total transaction fees a miner would collect from the current template, shown in bitcoin and US dollars.`,
              )}
            </div>
            <div className="expanded-pending-block-row expanded-pending-block-row-large">
              <InfoCard
                className="transaction-types"
                title={t`Transaction Types`}
                tooltip={t`Share of selected transactions using SegWit or legacy serialization.`}
                body={
                  <div>
                    <MetricBar
                      title={t`SegWit`}
                      headerValue={metrics
                        ? formatPanelPercentage(
                            metrics.segwitPercentage,
                            unavailable,
                          )
                        : templateFallback}
                      fillPercentage={metrics && metrics.segwitPercentage}
                      fillClass="block-weight-segwit-bar-fill"
                    />
                    <MetricBar
                      title={t`Legacy`}
                      headerValue={metrics
                        ? formatPanelPercentage(
                            metrics.legacyPercentage,
                            unavailable,
                          )
                        : templateFallback}
                      fillPercentage={metrics && metrics.legacyPercentage}
                      fillClass="block-weight-legacy-bar-fill"
                    />
                  </div>
                }
              />

              <InfoCard
                className="block-weight"
                title={t`Block Weight`}
                tooltip={t`Current template weight and serialized size compared with their block limits.`}
                body={
                  <div>
                    <MetricBar
                      title={t`Weight`}
                      headerValue={metrics
                        ? `${formatWeight(
                            metrics.totalWeight,
                            unavailable,
                          )} / ${formatWeight(
                            metrics.weightLimit,
                            unavailable,
                          )}`
                        : templateFallback}
                      fillPercentage={
                        metrics && metrics.weightPercentage
                      }
                      fillClass="block-weight-weight-bar"
                    />
                    <MetricBar
                      title={t`Size`}
                      headerValue={
                        metrics &&
                        Number.isFinite(metrics.totalSize) &&
                        Number.isFinite(metrics.sizeLimit)
                          ? `${formatMegabytes(
                              metrics.totalSize,
                              unavailable,
                            )} / ${formatMegabytes(
                              metrics.sizeLimit,
                              unavailable,
                            )}`
                          : templateFallback
                      }
                      fillPercentage={
                        metrics && metrics.sizePercentage
                      }
                      fillClass="block-weight-size-bar"
                    />
                  </div>
                }
              />
            </div>
            <div className="expanded-pending-block-row expanded-pending-block-row-large">
              {detailPanel(
                "pending-transactions",
                t`Pending Transactions`,
                formatCount(mempool && mempool.count, mempoolFallback),
                mempool ? t`IN MEMPOOL` : mempoolFallback,
                t`Transactions currently waiting in the node's mempool.`,
              )}

              <InfoCard
                className="pending-block-mempool-congestion"
                title={t`Mempool Congestion`}
                tooltip={t`How busy mempool activity is. More congestion means higher fees for quick confirmation.`}
                body={
                  <MempoolCongestion
                    mempool={mempool}
                    fallback={mempoolFallback}
                    t={t}
                  />
                }
              />
            </div>
          </div>
        </div>
      ) : (
        ""
      )}
    </div>
  );
};

export default PendingBlockDetailsCard;
