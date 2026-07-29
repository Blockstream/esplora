const test = require("node:test");
const assert = require("node:assert/strict");

const {
  summarizeBlockTemplate,
} = require("../client/src/lib/block-template");

test("summarizes a block template and its fee tiers", () => {
  const metrics = summarizeBlockTemplate(
    {
      height: 101,
      curtime: 1_700_000_000,
      transactions: [
        { fee: 100, weight: 400, data: "010000000001" },
        { fee: 500, weight: 400, data: "0100000001" },
        { fee: 1_100, weight: 400, data: "0100000001" },
      ],
      weightlimit: 2_400,
      sizelimit: 32,
    },
    { 3: 10, 12: 2 },
  );

  assert.equal(metrics.height, 101);
  assert.equal(metrics.updatedAt, 1_700_000_000);
  assert.equal(metrics.templateTransactionCount, 3);
  assert.equal(metrics.transactionCount, 4);
  assert.equal(metrics.totalFees, 1_700);
  assert.equal(metrics.totalWeight, 1_200);
  assert.equal(metrics.totalSize, 16);
  assert.equal(metrics.averageFeeRate, 1_700 / 300);
  assert.equal(metrics.weightPercentage, 50);
  assert.equal(metrics.sizePercentage, 50);
  assert.equal(metrics.segwitCount, 1);
  assert.ok(Math.abs(metrics.segwitPercentage - 100 / 3) < 1e-12);
  assert.ok(Math.abs(metrics.legacyPercentage - 200 / 3) < 1e-12);
  assert.deepEqual(metrics.feeBuckets, {
    low: { count: 1, averageFeeRate: 1, averageFee: 100 },
    medium: { count: 1, averageFeeRate: 5, averageFee: 500 },
    high: { count: 1, averageFeeRate: 11, averageFee: 1_100 },
  });
});

test("returns explicit empty-template metrics", () => {
  const metrics = summarizeBlockTemplate({ transactions: [] }, null);

  assert.equal(metrics.templateTransactionCount, 0);
  assert.equal(metrics.transactionCount, 1);
  assert.equal(metrics.totalFees, 0);
  assert.equal(metrics.totalWeight, 0);
  assert.equal(metrics.totalSize, 0);
  assert.equal(metrics.averageFeeRate, null);
  assert.equal(metrics.weightPercentage, 0);
  assert.equal(metrics.sizePercentage, null);
  assert.equal(metrics.segwitPercentage, 0);
  assert.equal(metrics.legacyPercentage, 0);
  assert.deepEqual(metrics.feeBuckets, {
    low: null,
    medium: null,
    high: null,
  });
});

test("does not invent metrics from missing or incomplete template data", () => {
  assert.equal(summarizeBlockTemplate(null, null), null);
  assert.equal(summarizeBlockTemplate({}, null), null);

  const metrics = summarizeBlockTemplate(
    { transactions: [{ fee: 100, weight: 400 }] },
    { 3: 10, 12: 2 },
  );

  assert.equal(metrics.totalSize, null);
  assert.equal(metrics.sizePercentage, null);
  assert.equal(metrics.segwitCount, null);
  assert.equal(metrics.segwitPercentage, null);
  assert.equal(metrics.legacyPercentage, null);
});

test("does not present fee buckets from a partial transaction set", () => {
  const metrics = summarizeBlockTemplate(
    {
      transactions: [
        { fee: 100, weight: 400, data: "0100000001" },
        { weight: 400, data: "0100000001" },
      ],
    },
    { 3: 10, 12: 2 },
  );

  assert.deepEqual(metrics.feeBuckets, {
    low: null,
    medium: null,
    high: null,
  });
});

test("ignores empty transaction entries without failing the summary", () => {
  const metrics = summarizeBlockTemplate(
    {
      transactions: [
        null,
        { fee: 100, weight: 400, data: "0100000001" },
      ],
    },
    { 3: 10, 12: 2 },
  );

  assert.equal(metrics.templateTransactionCount, 1);
  assert.equal(metrics.transactionCount, 2);
  assert.equal(metrics.totalFees, 100);
  assert.equal(metrics.totalWeight, 400);
  assert.equal(metrics.totalSize, 5);
});
