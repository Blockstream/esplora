const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

const BlockDetailsCard =
  require("../client/src/components/block-details-card").default;
const PendingBlockDetailsCard =
  require("../client/src/views/pending-block-details-card").default;
const {
  blockTemplateStateForTip,
} = require("../client/src/views/blocks");
const {
  nativeAssetLabel,
  targetBlockIntervalSeconds,
} = require("../client/src/const");

const t = (parts, ...values) => parts.reduce(
  (result, part, index) =>
    result + part + (index < values.length ? values[index] : ""),
  "",
);

const block = {
  id: "a".repeat(64),
  height: 100,
  previousblockhash: "c".repeat(64),
  timestamp: 1_700_000_000,
  tx_count: 2,
  size: 1_000_000,
  weight: 4_000_000,
  version: 1,
  nonce: 2,
  merkle_root: "b".repeat(64),
};

const previousBlock = {
  id: block.previousblockhash,
  timestamp: block.timestamp - 10 * 60,
};

const emptyTemplateMetrics = {
  averageFeeRate: null,
  feeBuckets: { low: null, medium: null, high: null },
  legacyPercentage: 0,
  segwitPercentage: 0,
  sizeLimit: 4_000_000,
  sizePercentage: 0,
  templateTransactionCount: 0,
  totalFees: 0,
  totalSize: 0,
  totalWeight: 0,
  transactionCount: 1,
  weightLimit: 4_000_000,
  weightPercentage: 0,
};

test("passes block detail copy through localization", () => {
  const localizedStrings = new Set();
  const t = (parts, ...values) => {
    localizedStrings.add(parts.join("%s"));
    return parts.reduce(
      (result, part, index) =>
        result + part + (index < values.length ? values[index] : ""),
      "",
    );
  };

  render(BlockDetailsCard({ block, detailsOpen: true, t }));

  const networkStrings = process.env.IS_ELEMENTS
    ? [
        "Block Signatures",
        "Signatures authorizing this Elements block.",
      ]
    : ["Nonce", "Nonce recorded in the block header."];

  [
    "Block #%s",
    "Block hash",
    "Block Weight",
    "Block is %s% full",
    "Block filling",
    "Block utilization unavailable",
    "Block weight divided by four.",
    "Commitment to all transactions included in the block.",
    "Details",
    "How full the block is.",
    "In block",
    "Loading block utilization",
    "Merkle root",
    "Number of transactions included in this block.",
    "Size",
    "Time Since Last Block",
    "Time elapsed between this block and the previous block.",
    "Transactions",
    "Version",
    "Version bits recorded in the block header.",
    "Virtual size",
    "Weight",
    ...networkStrings,
  ].forEach((message) => assert.ok(
    localizedStrings.has(message),
    `Missing localized string: ${message}`,
  ));
});

test("compares confirmed blocks only against the weight limit", () => {
  const html = render(BlockDetailsCard({
    block,
    detailsOpen: true,
    t: (parts, ...values) => parts.reduce(
      (result, part, index) =>
        result + part + (index < values.length ? values[index] : ""),
      "",
    ),
  }));

  assert.equal((html.match(/class="metric-bar-container"/g) || []).length, 1);
  assert.doesNotMatch(html, /class="metric-bar-title">Size</);
});

test("shows the block hash above the nonce or signatures", () => {
  const html = render(BlockDetailsCard({ block, detailsOpen: true, t }));
  const networkField = process.env.IS_ELEMENTS
    ? "Block Signatures"
    : "Nonce";

  assert.ok(html.includes(block.id));
  assert.ok(html.indexOf("Block hash") < html.indexOf(networkField));
});

test("disables block details until block metadata is available", () => {
  const html = render(BlockDetailsCard({ block: null, t }));

  assert.match(
    html,
    /class="block-details-card-details-button"[^>]*disabled="disabled"/,
  );
});

test("shows the interval from the displayed block to its predecessor", () => {
  const html = render(BlockDetailsCard({
    block,
    detailsOpen: true,
    previousBlock,
    t,
  }));

  assert.equal((html.match(/>10m</g) || []).length, 2);
});

test("shows the pending transaction live badge only with template data", () => {
  const props = {
    bitcoinMarketChart: null,
    block,
    detailsOpen: true,
    feeEst: null,
    mempool: null,
    metrics: null,
    t,
    transactionDelta: null,
  };

  const unavailableHtml = render(PendingBlockDetailsCard({
    ...props,
    blockTemplate: null,
  }));
  const liveHtml = render(PendingBlockDetailsCard({
    ...props,
    blockTemplate: {
      transactions: [],
      weightlimit: 4_000_000,
      sizelimit: 4_000_000,
    },
    metrics: emptyTemplateMetrics,
  }));

  assert.doesNotMatch(unavailableHtml, />Live</);
  assert.match(liveHtml, />Live</);
  assert.equal(
    (unavailableHtml.match(/class="confirmation-status-dot"/g) || []).length,
    0,
  );
  assert.equal(
    (liveHtml.match(/class="confirmation-status-dot"/g) || []).length,
    1,
  );
});

test("only combines a pending template with its own chain tip", () => {
  const state = {
    template: { previousblockhash: block.id, transactions: [] },
  };

  assert.equal(blockTemplateStateForTip(block, state), state);
  assert.equal(
    blockTemplateStateForTip({ ...block, id: "c".repeat(64) }, state),
    null,
  );
});

test("uses the template limit for pending block utilization", () => {
  const html = render(PendingBlockDetailsCard({
    bitcoinMarketChart: null,
    block,
    blockTemplate: { transactions: [] },
    detailsOpen: false,
    feeEst: null,
    mempool: null,
    metrics: {
      ...emptyTemplateMetrics,
      totalWeight: 1_200,
      weightPercentage: 50,
      weightLimit: 2_400,
    },
    t,
    transactionDelta: null,
  }));

  assert.match(
    html,
    /aria-label="Block is 50% full"/,
  );
  assert.match(html, />Block filling</);
});

test("counts down from the last block to the configured expected interval", () => {
  const timestamp = Math.floor(Date.now() / 1000);
  const html = render(PendingBlockDetailsCard({
    bitcoinMarketChart: null,
    block: { ...block, timestamp },
    blockTemplate: { transactions: [] },
    detailsOpen: false,
    feeEst: null,
    mempool: null,
    metrics: emptyTemplateMetrics,
    t,
    transactionDelta: null,
  }));
  const expectedMinutes = Math.ceil(targetBlockIntervalSeconds / 60);
  const expectedIntervalPattern = targetBlockIntervalSeconds <= 60
    ? /EXPECTED IN &lt; 1 MINUTE/
    : new RegExp(`EXPECTED IN ~${expectedMinutes} MINUTE`);

  assert.match(html, expectedIntervalPattern);
});

test("passes pending block copy through localization", () => {
  const localizedStrings = new Set();
  const localizedT = (parts, ...values) => {
    localizedStrings.add(parts.join("%s"));
    return t(parts, ...values);
  };

  render(PendingBlockDetailsCard({
    bitcoinMarketChart: null,
    block,
    blockTemplate: { transactions: [] },
    detailsOpen: true,
    feeEst: { 3: 10, 12: 2 },
    mempool: { count: 1, vsize: 1_000 },
    metrics: emptyTemplateMetrics,
    t: localizedT,
    transactionDelta: null,
  }));

  [
    "Next Block",
    "Details",
    "SIZE",
    "Block filling",
    "Transactions",
    "Block Weight",
    "Pending Transactions",
    "Mempool Congestion",
  ].forEach((message) => assert.ok(
    localizedStrings.has(message),
    `Missing localized string: ${message}`,
  ));
});

test("renders precomputed pending-block metrics", () => {
  const html = render(PendingBlockDetailsCard({
    bitcoinMarketChart: null,
    block,
    blockTemplate: { transactions: [] },
    detailsOpen: false,
    feeEst: null,
    mempool: null,
    metrics: { ...emptyTemplateMetrics, transactionCount: 7 },
    t,
    transactionDelta: null,
  }));

  assert.match(
    html,
    /TRANSACTIONS<\/p><p class="pending-block-stat-value">7<\/p>/,
  );
});

test("keeps fee cost loading separate from fee-rate availability", () => {
  const html = render(PendingBlockDetailsCard({
    bitcoinMarketChart: null,
    block,
    blockTemplate: { transactions: [] },
    detailsOpen: true,
    feeEst: {},
    mempool: null,
    metrics: emptyTemplateMetrics,
    t,
    transactionDelta: null,
  }));

  assert.match(
    html,
    /class="info-card-container low-fee"[\s\S]*?<p class="info-card-value">N\/A<\/p><p class="info-card-footer">-<\/p>/,
  );
});

test("formats average fees with the shared native-asset formatter", () => {
  const html = render(PendingBlockDetailsCard({
    bitcoinMarketChart: { prices: [[0, 50_000]] },
    block,
    blockTemplate: { transactions: [] },
    detailsOpen: true,
    feeEst: {},
    mempool: null,
    metrics: {
      ...emptyTemplateMetrics,
      feeBuckets: {
        low: { averageFee: 1.5, averageFeeRate: 1 },
        medium: null,
        high: null,
      },
    },
    t,
    transactionDelta: null,
  }));

  assert.ok(html.includes(`0.00000002 ${nativeAssetLabel} / $0.00 USD`));
});
