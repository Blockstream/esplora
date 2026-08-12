const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatCount,
  formatEstimatedBlockTime,
  formatFeeBoundary,
  formatMegabytes,
  formatPanelPercentage,
  formatPercentage,
  formatTransactionDelta,
  formatWeight,
} = require("../client/src/lib/pending-block-details");
const {
  targetBlockIntervalSeconds,
} = require("../client/src/const");

const t = (parts, ...values) => parts.reduce(
  (result, part, index) =>
    result + part + (index < values.length ? values[index] : ""),
  "",
);

test("counts down to and measures time past the expected block interval", () => {
  const timestamp = 1_700_000_000;
  const timestampMs = timestamp * 1000;
  const intervalMs = targetBlockIntervalSeconds * 1000;
  const expectedMinutes = Math.ceil(targetBlockIntervalSeconds / 60);
  const expectedIntervalLabel = expectedMinutes === 1
    ? `EXPECTED IN ~${expectedMinutes} MINUTE`
    : `EXPECTED IN ~${expectedMinutes} MINUTES`;

  assert.equal(
    formatEstimatedBlockTime(timestamp, t, timestampMs),
    expectedIntervalLabel,
  );
  assert.equal(
    formatEstimatedBlockTime(
      timestamp,
      t,
      timestampMs + intervalMs - 30_000,
    ),
    "EXPECTED IN < 1 MINUTE",
  );
  assert.equal(
    formatEstimatedBlockTime(timestamp, t, timestampMs + intervalMs),
    "EXPECTED INTERVAL REACHED",
  );
  assert.equal(
    formatEstimatedBlockTime(
      timestamp,
      t,
      timestampMs + intervalMs + 2 * 60_000,
    ),
    "2 MINUTES PAST EXPECTED INTERVAL",
  );
});

test("formats pending-block metric values and fallbacks", () => {
  assert.equal(formatPercentage(12.345), "12.35%");
  assert.equal(formatPanelPercentage(12.3), "12.3%");
  assert.equal(formatFeeBoundary(2.5), "2.50");
  assert.equal(formatWeight(1_250_000), "1.25 MWU");
  assert.equal(formatMegabytes(2_500_000), "2.5 MB");
  assert.equal(formatCount(12_345), "12,345");
  assert.equal(formatPercentage(null, "-"), "-");
});

test("formats pending transaction changes", () => {
  assert.equal(formatTransactionDelta(12), "+ 12");
  assert.equal(formatTransactionDelta(-12), "− 12");
});
