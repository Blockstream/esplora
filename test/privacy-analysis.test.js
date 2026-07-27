const test = require("node:test");
const assert = require("node:assert/strict");

const getPrivacyAnalysis =
  require("../client/src/lib/privacy-analysis").default;

test("skips privacy analysis for coinbase transactions", () => {
  const tx = {
    vin: [{ is_coinbase: true }],
    vout: [],
  };

  assert.deepEqual(getPrivacyAnalysis(tx), []);
});

test("detects equal-output coinjoins only with explicit amounts", () => {
  const vin = [
    {
      prevout: {
        value: 2000,
        scriptpubkey: "input-a",
        scriptpubkey_type: "v0_p2wpkh",
      },
    },
    {
      prevout: {
        value: 2000,
        scriptpubkey: "input-b",
        scriptpubkey_type: "v0_p2wpkh",
      },
    },
  ];
  const vout = [1000, 1000, 900, 800].map((value, index) => ({
    value,
    scriptpubkey: `output-${index}`,
    scriptpubkey_type: "v0_p2wpkh",
  }));

  assert.deepEqual(
    getPrivacyAnalysis({ vin, vout }),
    ["coinjoin-equal-outputs"],
  );

  const confidentialVin = [
    { ...vin[0], prevout: { ...vin[0].prevout, value: null } },
    vin[1],
  ];
  assert.deepEqual(
    getPrivacyAnalysis({ vin: confidentialVin, vout }),
    [],
  );
});
