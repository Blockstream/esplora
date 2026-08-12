const test = require("node:test");
const assert = require("node:assert/strict");

const {
  getBitcoinPrices,
  getLatestBitcoinPrice,
} = require("../client/src/lib/market");

test("selects finite market prices and the latest available value", () => {
  const marketChart = {
    prices: [[1, 100], null, [2, NaN], [3, 125]],
  };

  assert.deepEqual(getBitcoinPrices(marketChart), [100, 125]);
  assert.equal(getLatestBitcoinPrice(marketChart), 125);
  assert.deepEqual(getBitcoinPrices(null), []);
  assert.equal(getLatestBitcoinPrice(null), null);
  assert.deepEqual(getBitcoinPrices({ prices: {} }), []);
  assert.deepEqual(getBitcoinPrices({ prices: "invalid" }), []);
});
