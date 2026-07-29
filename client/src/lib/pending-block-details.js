import { targetBlockIntervalSeconds } from "../const";

export const formatEstimatedBlockTime = (
  timestamp,
  t,
  now = Date.now(),
) => {
  // This is a simple reference against the configured nominal block interval,
  // not an exact estimate of the remaining wait.
  if (!Number.isFinite(timestamp)) return t`N/A`;

  const timestampMs = timestamp < 1e12 ? timestamp * 1000 : timestamp;
  const elapsedSeconds = Math.max(0, (now - timestampMs) / 1000);
  const remainingSeconds = targetBlockIntervalSeconds - elapsedSeconds;

  if (remainingSeconds > 0) {
    if (remainingSeconds < 60) return t`EXPECTED IN < 1 MINUTE`;

    const remainingMinutes = Math.ceil(remainingSeconds / 60);
    return remainingMinutes === 1
      ? t`EXPECTED IN ~${remainingMinutes} MINUTE`
      : t`EXPECTED IN ~${remainingMinutes} MINUTES`;
  }

  const elapsedPastIntervalSeconds = Math.abs(remainingSeconds);
  if (elapsedPastIntervalSeconds === 0) {
    return t`EXPECTED INTERVAL REACHED`;
  }
  if (elapsedPastIntervalSeconds < 60) {
    return t`< 1 MINUTE PAST EXPECTED INTERVAL`;
  }

  const elapsedPastIntervalMinutes = Math.floor(
    elapsedPastIntervalSeconds / 60,
  );
  return elapsedPastIntervalMinutes === 1
    ? t`${elapsedPastIntervalMinutes} MINUTE PAST EXPECTED INTERVAL`
    : t`${elapsedPastIntervalMinutes} MINUTES PAST EXPECTED INTERVAL`;
};

export const formatPercentage = (value, fallback = "N/A") =>
  Number.isFinite(value) ? `${value.toFixed(2)}%` : fallback;

const formatTrimmedDecimal = (value) =>
  value.toFixed(2).replace(/\.?0+$/, "");

export const formatPanelPercentage = (value, fallback = "N/A") =>
  Number.isFinite(value) ? `${formatTrimmedDecimal(value)}%` : fallback;

export const formatFeeRate = (value, fallback = "N/A") =>
  Number.isFinite(value) ? `${value.toFixed(2)} sat/vB` : fallback;

export const formatFeeBoundary = (value, fallback = "N/A") =>
  Number.isFinite(value) ? value.toFixed(2) : fallback;

export const formatWeight = (value, fallback = "N/A") =>
  Number.isFinite(value)
    ? `${formatTrimmedDecimal(value / 1_000_000)} MWU`
    : fallback;

export const formatMegabytes = (value, fallback = "N/A") =>
  Number.isFinite(value)
    ? `${formatTrimmedDecimal(value / 1_000_000)} MB`
    : fallback;

export const formatCount = (value, fallback = "N/A") =>
  Number.isFinite(value) ? value.toLocaleString() : fallback;

export const getLatestBitcoinPrice = (marketChart) => {
  const prices = ((marketChart && marketChart.prices) || [])
    .map((price) => price && price[1])
    .filter(Number.isFinite);

  return prices.length ? prices[prices.length - 1] : null;
};

export const formatUsd = (value, fallback = "N/A") =>
  Number.isFinite(value)
    ? `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD`
    : fallback;

export const formatTransactionDelta = (delta) =>
  delta > 0
    ? `+ ${formatCount(delta)}`
    : `− ${formatCount(Math.abs(delta))}`;
