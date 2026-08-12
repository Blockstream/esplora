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
    bitcoinMarketChart: { prices: [[1, 50_000]] },
    t,
  }));

  const expectedFeeUsd = process.env.IS_ELEMENTS ? "$0.77 USD" : "$0.42 USD";

  assert.match(
    html,
    /Recommended Fee[\s\S]*6 sat\/vB/,
  );
  assert(html.includes(expectedFeeUsd), expectedFeeUsd);
  assert.match(html, /\$50,000\.00 USD/);
});

test("shows unavailable overview fee and price values explicitly", () => {
  const html = render(overview({ blocks: [], mempool: null, t }));

  assert.match(html, /Recommended Fee[\s\S]*N\/A[\s\S]*N\/A/);
});
