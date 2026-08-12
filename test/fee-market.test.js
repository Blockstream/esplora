const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

const { feeMarket } = require("../client/src/views/fee-market");

const t = (parts, ...values) => parts.reduce(
  (result, part, index) =>
    result + part + (index < values.length ? values[index] : ""),
  "",
);

test("renders low, average, and high fee estimates with dollar footers", () => {
  const html = render(feeMarket({
    feeEst: {
      1: 12,
      3: 6,
      12: 2,
    },
    bitcoinMarketChart: {
      prices: [[1, 40_000], [2, 50_000], [3, null]],
    },
    t,
  }));

  const expectedUsd = process.env.IS_ELEMENTS
    ? ["$0.26 USD", "$0.77 USD", "$1.55 USD"]
    : ["$0.14 USD", "$0.42 USD", "$0.84 USD"];

  assert.match(html, /Low[\s\S]*2 sat\/vB/);
  assert.match(html, /Average[\s\S]*6 sat\/vB/);
  assert.match(html, /High[\s\S]*12 sat\/vB/);
  expectedUsd.forEach((value) => assert(html.includes(value), value));
  assert.match(html, /within 12 blocks/);
  assert.match(html, /within 3 blocks/);
  assert.match(html, /in the next block/);
  assert.doesNotMatch(html, /\[object Object\]/);
});

test("keeps fee market panels visible while estimates are unavailable", () => {
  const html = render(feeMarket({ t }));

  assert.match(html, /Fee Market/);
  assert.match(html, /Low/);
  assert.match(html, /Average/);
  assert.match(html, /High/);
  assert.match(html, /N\/A/);
  assert.doesNotMatch(html, /sat\/vB/);
  assert.doesNotMatch(html, /USD/);
});

test("passes fee market copy through localization", () => {
  const localizedStrings = new Set();
  const localizedT = (parts, ...values) => {
    localizedStrings.add(parts.join("%s"));
    return parts.reduce(
      (result, part, index) =>
        result + part + (index < values.length ? values[index] : ""),
      "",
    );
  };

  render(feeMarket({ t: localizedT }));

  [
    "A balanced fee rate estimated to confirm within %s blocks.",
    "A higher-priority fee rate estimated to confirm in the next block.",
    "A lower-priority fee rate estimated to confirm within %s blocks.",
    "Average",
    "Fee Market",
    "High",
    "Low",
    "N/A",
  ].forEach((value) => assert(localizedStrings.has(value), value));
});
