const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getMempoolCongestion,
  getMempoolUsage,
} = require("../client/src/lib/mempool");

test("estimates default mempool utilization from virtual size", () => {
  assert.equal(getMempoolUsage({ vsize: 150_000_000 }), 0.5);
  assert.equal(getMempoolUsage({ vsize: 300_000_000 }), 1);
  assert.equal(getMempoolUsage({ vsize: 450_000_000 }), 1);
  assert.equal(getMempoolUsage({ vsize: -1 }), 0);
  assert.equal(getMempoolUsage(), 0);
});

test("classifies estimated default mempool utilization by thirds", () => {
  assert.deepEqual(getMempoolCongestion({ vsize: 99_000_000 }), {
    className: "success",
    level: "Low",
    percentage: 33,
  });

  assert.equal(getMempoolCongestion({ vsize: 100_000_000 }).level, "Moderate");
  assert.equal(getMempoolCongestion({ vsize: 200_000_000 }).level, "High");
  assert.deepEqual(getMempoolCongestion(), {
    className: "",
    level: "",
    percentage: 0,
  });
});
