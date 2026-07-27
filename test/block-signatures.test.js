const test = require("node:test");
const assert = require("node:assert/strict");

const { parseBlockSignatures } = require("../client/src/lib/block-signatures");

test("parses a signblock witness", () => {
  const block = {
    ext: {
      signblock_witness: [
        [],
        [0x01],
        [0x02],
        [0x52, 0x53, 0xae],
      ],
    },
  };

  assert.deepEqual(parseBlockSignatures(block), {
    requiredSignatures: 2,
    totalSigners: 3,
    signatureCount: 2,
    source: "signblock_witness",
  });
});

test("parses a legacy block proof", () => {
  const signature = `09${"00".repeat(9)}`;
  const block = {
    proof: {
      challenge: "5253ae",
      solution: `00${signature}${signature}`,
    },
  };

  assert.deepEqual(parseBlockSignatures(block), {
    requiredSignatures: 2,
    totalSigners: 3,
    signatureCount: 2,
    source: "challenge",
  });
});

test("returns source-tagged errors for malformed signature data", () => {
  const result = parseBlockSignatures({
    ext: {
      signblock_witness: [[0x00], [0x51, 0x51, 0xae]],
    },
  });

  assert.equal(result.error.source, "signblock_witness");
  assert.match(result.error.message, /dummy must be empty/);
});
