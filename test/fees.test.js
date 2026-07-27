const test = require("node:test");
const assert = require("node:assert/strict");

const {
  feerateCutoff,
  getConfEstimate,
} = require("../client/src/lib/fees");

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
