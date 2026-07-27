const test = require("node:test");
const assert = require("node:assert/strict");

const { deduceBlinded } = require("../client/src/lib/deduce-blinded");

test("deduces a single blinded output", () => {
  const tx = {
    vin: [
      { prevout: { asset: "asset-a", value: 7 } },
      { prevout: { asset: "asset-a", value: 4 } },
    ],
    vout: [
      { asset: "asset-a", value: 6 },
      { asset: null, value: null },
    ],
  };

  deduceBlinded(tx);

  assert.deepEqual(tx.vout[1], { asset: "asset-a", value: 5 });

  tx.vin[0].prevout.value = 100;
  deduceBlinded(tx);
  assert.deepEqual(tx.vout[1], { asset: "asset-a", value: 5 });
});

test("deduces a single blinded input using bigint amounts", () => {
  const tx = {
    vin: [
      { prevout: { asset: null, value: null } },
      { prevout: { asset: "asset-a", value: 3n } },
    ],
    vout: [{ asset: "asset-a", value: 8n }],
  };

  deduceBlinded(tx);

  assert.deepEqual(tx.vin[0].prevout, {
    asset: "asset-a",
    value: 5n,
  });
});

test("rejects inconsistent balances instead of guessing a blinded value", () => {
  const tx = {
    vin: [
      { prevout: { asset: "asset-a", value: 10 } },
      { prevout: { asset: "asset-b", value: 5 } },
    ],
    vout: [{ asset: null, value: null }],
  };

  assert.throws(
    () => deduceBlinded(tx),
    /unexpected remainder while deducing blinded tx/,
  );
});
