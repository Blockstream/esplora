const test = require("node:test");
const assert = require("node:assert/strict");

const {
  feeRateClass,
  estimateTypicalTransactionFeeUsd,
  feerateCutoff,
  getConfEstimate,
  getFeeTierBoundaries,
} = require("../client/src/lib/fees");

test("validates and applies fee tier boundaries", () => {
  assert.deepEqual(getFeeTierBoundaries({ 3: 10, 12: 2 }), {
    lowMaximum: 2,
    mediumMaximum: 10,
  });
  assert.deepEqual(getFeeTierBoundaries({ 3: 1, 12: 2 }), {
    lowMaximum: 2,
    mediumMaximum: 2,
  });
  assert.equal(getFeeTierBoundaries(), null);
  assert.equal(getFeeTierBoundaries({ 3: 10, 12: -1 }), null);
  assert.equal(feeRateClass(2, { 3: 10, 12: 2 }), "success");
  assert.equal(feeRateClass(10, { 3: 10, 12: 2 }), "warning");
  assert.equal(feeRateClass(11, { 3: 10, 12: 2 }), "danger");
  assert.equal(feeRateClass(0, { 3: 10, 12: 2 }), "success");
  assert.equal(feeRateClass(undefined, { 3: 10, 12: 2 }), "");
  assert.equal(feeRateClass(1, null), "");
});

test("calculates fee cutoff at block size boundaries", () => {
  assert.equal(
    feerateCutoff([
      [10, 500000],
      [5, 499999],
    ]),
    0,
  );
  assert.equal(
    feerateCutoff([
      [10, 500000],
      [5, 500000],
    ]),
    10,
  );
  assert.equal(feerateCutoff([[10, 1000000]]), null);
});

test("selects a confirmation target by numeric order", () => {
  const estimates = {
    25: 1,
    10: 5,
    2: 10,
  };

  assert.equal(getConfEstimate(estimates, 6), "10");
  assert.equal(getConfEstimate(estimates, 0.5), -1);
});

test("estimates a typical transaction fee in dollars", () => {
  const expectedFee = process.env.IS_ELEMENTS ? 1.548 : 0.84;

  assert.equal(estimateTypicalTransactionFeeUsd(50_000, 12), expectedFee);
  assert.equal(estimateTypicalTransactionFeeUsd(50_000, 0), 0);
  assert.equal(estimateTypicalTransactionFeeUsd(null, 12), null);
  assert.equal(estimateTypicalTransactionFeeUsd(50_000, undefined), null);
  assert.equal(estimateTypicalTransactionFeeUsd(-50_000, 12), null);
  assert.equal(estimateTypicalTransactionFeeUsd(50_000, -12), null);
});
