const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

const { overview } = require("../client/src/views/overview");

const t = (parts, ...values) => parts.reduce(
  (result, part, index) =>
    result + part + (index < values.length ? values[index] : ""),
  "",
);

test("formats the recommended fee rate and dollar estimate", () => {
  const html = render(overview({
    blocks: [],
    feeEst: { 3: 6 },
    mempool: { vsize: 0 },
    bitcoinMarketChart: { prices: [[1, 40_000], [2, 50_000]] },
    t,
  }));

  const expectedFeeUsd = process.env.IS_ELEMENTS ? "$0.77 USD" : "$0.42 USD";

  assert.match(
    html,
    /Recommended Fee[\s\S]*6 sat\/vB/,
  );
  assert(html.includes(expectedFeeUsd), expectedFeeUsd);
  assert.match(html, /\$50,000\.00 USD/);
  assert.match(html, /\+25\.00%/);
});

test("formats negative Bitcoin price changes", () => {
  const html = render(overview({
    blocks: [],
    bitcoinMarketChart: { prices: [[1, 50_000], [2, 40_000]] },
    t,
  }));

  assert.match(html, /class="text-danger">-20\.00%/);
});

test("shows an unavailable Bitcoin price change without a valid baseline", () => {
  const singlePriceHtml = render(overview({
    blocks: [],
    bitcoinMarketChart: { prices: [[1, 50_000]] },
    t,
  }));
  const zeroBaselineHtml = render(overview({
    blocks: [],
    bitcoinMarketChart: { prices: [[1, 0], [2, 50_000]] },
    t,
  }));

  assert.match(singlePriceHtml, /\$50,000\.00 USD<\/span>N\/A/);
  assert.match(zeroBaselineHtml, /\$50,000\.00 USD<\/span>N\/A/);
});

test("shows unavailable overview fee and price values explicitly", () => {
  const html = render(overview({ blocks: [], mempool: null, t }));

  assert.match(html, /Recommended Fee[\s\S]*N\/A[\s\S]*N\/A/);
});
