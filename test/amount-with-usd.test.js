const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

process.env.MENU_ACTIVE = "Bitcoin";

const { formatSatWithUsd, formatOutAmount } = require("../client/src/views/util");
const { transactions } = require("../client/src/views/transactions");
const t = require("../client/src/l10n").default.en;

const bitcoinPrice = 100_000;
const tx = { txid: "a".repeat(64), value: 100_000, fee: 1_000, vsize: 500 };
const state = { t, bitcoinPrice, bitcoinMarketChart: { prices: [[1, bitcoinPrice]] } };

test("keeps full BTC precision and converts satoshis to USD", () => {
  const html = render(formatSatWithUsd(tx.value, state));
  assert.match(html, /0\.00100000 BTC/);
  assert.match(html, /\$100\.00 USD/);
  assert.match(render(formatSatWithUsd(BigInt(100_000), state)), /\$100\.00 USD/);

  const large = render(formatSatWithUsd(2_099_999_999_999_999, state));
  assert.match(large, /20,999,999\.99999999 BTC/);
  assert.match(large, /\$2,100,000,000,000\.00 USD/);
});

test("handles zero, sub-cent, negative, and missing-price conversions", (ctx) => {
  for (const [sats, expected] of [[0, "$0.00 USD"], [1, "$0.00 USD"]]) {
    assert.ok(render(formatSatWithUsd(sats, state)).includes(expected));
  }

  const logError = ctx.mock.method(console, "error", () => {});
  for (const sats of [-1_000, BigInt(-1_000)]) {
    const html = render(formatSatWithUsd(sats, state));
    assert.match(html, /amount-with-usd-secondary">N\/A/);
    assert.doesNotMatch(html, /USD/);
  }
  assert.equal(logError.mock.callCount(), 2);

  assert.match(render(formatSatWithUsd(100, { bitcoinPrice: 0 })), /\$0\.00 USD/);

  for (const price of [null, undefined, NaN, Infinity, -1]) {
    const html = render(formatSatWithUsd(tx.value, { t, bitcoinPrice: price }));
    assert.match(html, /amount-with-usd-primary">0\.00100000 BTC/);
    assert.match(html, /amount-with-usd-secondary" aria-hidden="true">\u00a0</);
    assert.doesNotMatch(html, /N\/A|USD|NaN|Infinity/);
  }
});

test("shows USD for the transaction value and total fee, preserving the rate and its color", () => {
  const html = render(transactions([tx], false, {
    ...state, feeEst: { 12: 2, 3: 4 },
  }));
  assert.match(html, /transactions-with-usd-values/);
  assert.match(html, /0\.00100000 BTC/);
  assert.match(html, /\$100\.00 USD/);
  assert.match(html, /transaction-table-transaction-fee success/);
  assert.match(html, /2\.00 sat\/vB/);
  assert.match(html, /\$1\.00 USD/);
  assert.equal((html.match(/amount-with-usd-secondary/g) || []).length, 2);
});

test("uses the shared price on the dashboard and preserves confidential values", () => {
  const dashboard = render(transactions([tx], true, state));
  assert.match(dashboard, /transactions-with-usd-values/);
  assert.match(dashboard, /\$100\.00 USD/);
  assert.match(dashboard, /0\.00100000 BTC/);
  assert.match(dashboard, /2\.00 sat\/vB/);

  const confidential = render(transactions([{ ...tx, value: null }], false, state));
  assert.match(confidential, /Confidential/);
  assert.equal((confidential.match(/amount-with-usd-secondary/g) || []).length, 1);
});

test("reserves a blank USD line until a price arrives", () => {
  const html = render(transactions([tx], false, { t }));
  assert.match(html, /0\.00100000 BTC/);
  assert.match(html, /2\.00 sat\/vB/);
  assert.equal((html.match(/aria-hidden="true">\u00a0</g) || []).length, 2);
  assert.doesNotMatch(html, /N\/A|USD/);
});

test("only values native outputs in USD and preserves native asset links", () => {
  const { nativeAssetId } = require("../client/src/const");
  const native = render(formatOutAmount({ value: 100_000, asset: nativeAssetId }, state));
  assert.match(native, new RegExp(`href="asset/${nativeAssetId}"`));
  assert.match(native, /\$100\.00 USD/);
  const issued = render(formatOutAmount({ value: 100_000, asset: "a".repeat(64) }, state));
  assert.doesNotMatch(issued, /amount-with-usd|USD/);
  const confidential = render(formatOutAmount({ valuecommitment: "hidden" }, state));
  assert.match(confidential, /Confidential/);
  assert.doesNotMatch(confidential, /amount-with-usd|USD/);
});

test("keeps pending-block fee panel BTC and USD costs inline as on master", () => {
  const PendingBlockDetailsCard = require("../client/src/views/pending-block-details-card").default;
  const { summarizeBlockTemplate } = require("../client/src/lib/block-template");
  const blockTemplate = { height: 101, transactions: [{ fee: 1_000, weight: 400, data: "010000000001" }] };
  const feeEst = { 3: 10, 12: 2 };
  const metrics = summarizeBlockTemplate(blockTemplate, feeEst);
  const html = render(PendingBlockDetailsCard({
    ...state, block: { height: 100, timestamp: 1_700_000_000 }, blockTemplate,
    detailsOpen: true, feeEst, metrics, t,
  }));
  const feePanels = html.slice(html.indexOf('info-card-container low-fee'), html.indexOf('info-card-container total-fees-collected'));
  assert.ok(feePanels.includes('0.00001000 BTC / $1.00 USD'));
  assert.doesNotMatch(feePanels, /amount-with-usd/);
  assert.match(html, /amount-with-usd-primary">0\.00001000 BTC/);
  assert.match(html, /amount-with-usd-secondary">\$1\.00 USD/);
});
