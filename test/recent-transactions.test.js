const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const path = require("node:path");

// Each process loads the actual build-time network configuration independently.
const simulatePage = () => {
  const { Subject } = require("./client/node_modules/rxjs/Subject");
  const { TestScheduler } = require("./client/node_modules/rxjs/testing");
  const { Observable: O } = require("./client/src/rxjs");
  const main = require("./client/src/app").default;
  const makeRouteDriver = require("./client/src/driver/route");
  const views = require("./client/src/views");
  const { recentTxs } = views;
  const { nativeAssetId } = require("./client/src/const");
  const render = require("snabbdom-to-html");

  const scheduler = new TestScheduler(() => {});
  const page$ = new Subject();
  const requests = [];
  const responses = Object.fromEntries(
    ["recent", "fee-est", "tip-height", "bitcoin-market-chart", "asset-map", "mempool",
      "tx", "tx-status", "tx-block", "previous-block", "block", "block-stat", "block-txs",
      "address", "addr-txs", "asset", "asset-txs"]
      .map(category => [category, new Subject()]),
  );
  const block = {
    id: "d".repeat(64), previousblockhash: "e".repeat(64), height: 100,
    timestamp: 1_700_000_000, size: 1_000, weight: 4_000, tx_count: 1,
  };
  const output = { value: 100_000, asset: process.env.IS_ELEMENTS ? nativeAssetId : undefined,
    scriptpubkey: "", scriptpubkey_asm: "", scriptpubkey_type: "v0_p2wpkh", scriptpubkey_address: "bc1qpreview" };
  const tx = {
    txid: "a".repeat(64), value: 100_000, fee: 1_000, vsize: 500, weight: 2_000,
    size: 500, version: 2, locktime: 0,
    vin: [{ txid: "b".repeat(64), vout: 0, prevout: { ...output, value: 101_000 }, sequence: 0xffffffff, scriptsig: "", witness: [] }],
    vout: [output],
    status: process.env.PAGE_KIND === "confirmed"
      ? { confirmed: true, block_hash: block.id, block_height: 100, block_time: block.timestamp }
      : { confirmed: false },
  };
  const asset = {
    asset_id: nativeAssetId,
    chain_stats: { tx_count: 0, peg_in_amount: 1_000_000, peg_out_amount: 200_000, burned_amount: 100_000 },
    mempool_stats: { tx_count: 0, peg_in_amount: 200_000, peg_out_amount: 100_000, burned_amount: 50_000 },
  };
  const address = {
    address: "bc1qpreview", display_addr: "bc1qpreview",
    chain_stats: { tx_count: 3, funded_txo_count: 3, funded_txo_sum: 400_000, spent_txo_count: 1, spent_txo_sum: 100_000 },
    mempool_stats: { tx_count: 2, funded_txo_count: 2, funded_txo_sum: 200_000, spent_txo_count: 1, spent_txo_sum: 50_000 },
  };
  const pages = { recent: "/tx/recent", unconfirmed: `/tx/${tx.txid}`, confirmed: `/tx/${tx.txid}`,
    block: `/block/${block.id}`, addr: "/address/bc1qpreview", mempool: "/mempool", asset: `/asset/${nativeAssetId}` };
  const initialPage = pages[process.env.PAGE_KIND || "recent"];
  const renderPage = state => render(views[state.view](state));
  let state, htmlAfterFailure, cachedPrice, focused = true;
  const sinks = main({
    DOM: { select: () => ({ elements: () => O.empty(), events: () => O.empty() }) },
    HTTP: { select: category => responses[category] || O.empty() },
    route: makeRouteDriver(() => page$)(O.empty()),
    storage: { local: { getItem: () => O.of(null) } },
    scanner: O.empty(), search: O.empty(), blinding: O.empty(),
  }, { pollingEnabled: true, pollingScheduler: scheduler, hasFocus: () => focused });

  sinks.state.subscribe(next => { state = next; });
  sinks.HTTP.subscribe(request => {
    requests.push({ category: request.category, frame: scheduler.frame });
    scheduler.schedule(() => {
      const category = request.category;
      if (!responses[category]) return;
      // The regular poll retries a failed feed, without immediate extra requests.
      const failedFrame = process.env.SCENARIO === "initial-failure" ? 0 : 600_000;
      if (process.env.SCENARIO?.endsWith("failure") && category === "bitcoin-market-chart" && scheduler.frame === failedFrame) {
        responses[category].next(new O(observer => observer.error(new Error("Price feed unavailable"))));
        return;
      }
      const body = category === "recent" ? [tx]
        : category === "fee-est" ? { 1: 5, 3: 4, 12: 2 }
        : category === "bitcoin-market-chart" ? {
          prices: [[scheduler.frame, process.env.SCENARIO === "failure" && scheduler.frame >= 1_200_000 ? 200_000 : 100_000]],
        }
        : category === "mempool" ? { count: 1, vsize: 500, total_fee: 1_000, fee_histogram: [[2, 500]] }
        : category === "tx" ? tx
        : category === "tx-status" ? tx.status
        : category === "block" || category === "tx-block" ? block
        : category === "previous-block" ? { ...block, id: block.previousblockhash, previousblockhash: undefined, timestamp: block.timestamp - 600 }
        : category === "block-stat" ? { in_best_chain: true }
        : category === "block-txs" ? [tx]
        : category === "address" ? address
        : category === "addr-txs" ? [tx]
        : category === "asset" ? asset
        : category === "asset-txs" ? []
        : {};
      responses[category].next(O.of({
        body, request,
        text: category === "tip-height" ? String(100 + Math.floor(scheduler.frame / (process.env.MENU_ACTIVE === "Bitcoin" ? 600_000 : 60_000))) : undefined,
      }));
    }, 0);
  });

  const navigate = (pathname, search = "") => page$.next({ pathname, hash: "", search });
  scheduler.schedule(() => navigate(initialPage), 0);
  if (process.env.SCENARIO === "failure") {
    scheduler.schedule(() => { htmlAfterFailure = render(recentTxs(state)); }, 600_001);
  }
  if (process.env.SCENARIO === "navigation") {
    scheduler.schedule(() => { focused = false; }, 550_000);
    scheduler.schedule(() => { focused = true; }, 650_000);
    scheduler.schedule(() => navigate("/explorer-api"), 950_000);
    scheduler.schedule(() => navigate("/tx/recent"), 1_100_000);
    scheduler.schedule(() => navigate("/explorer-api"), 1_750_000);
    scheduler.maxFrames = 2_500_000;
  } else if (process.env.SCENARIO === "shared") {
    scheduler.schedule(() => navigate(initialPage + "/"), 50_000);
    scheduler.schedule(() => {
      navigate(pages.addr);
      cachedPrice = state.bitcoinPrice;
    }, 100_000);
    scheduler.schedule(() => navigate(pages.addr, "?txids=" + tx.txid), 200_000);
    scheduler.schedule(() => navigate(pages.addr, "?expand"), 300_000);
    scheduler.schedule(() => navigate(pages.block), 800_000);
    scheduler.schedule(() => navigate("/explorer-api"), 900_000);
    scheduler.maxFrames = 1_500_000;
  } else if (process.env.SCENARIO === "browsing") {
    [pages.unconfirmed, pages.block, pages.addr, pages.mempool, "/explorer-api", pages.recent]
      .forEach((pathname, index) => scheduler.schedule(() => navigate(pathname), (index + 1) * 60_000));
    scheduler.maxFrames = 3_600_000 - 1;
  } else if (process.env.SCENARIO === "initial-failure") {
    scheduler.schedule(() => navigate(pages.block), 60_000);
    scheduler.schedule(() => navigate(pages.addr), 120_000);
    scheduler.schedule(() => { htmlAfterFailure = renderPage(state); }, 180_000);
    scheduler.maxFrames = 700_000;
  } else {
    scheduler.maxFrames = 3_600_000 - 1;
  }
  scheduler.flush();

  process.stdout.write(JSON.stringify({
    counts: requests.reduce((counts, request) => ({
      ...counts, [request.category]: (counts[request.category] || 0) + 1,
    }), {}),
    priceFrames: requests.filter(request => request.category === "bitcoin-market-chart").map(request => request.frame),
    total: requests.length,
    html: renderPage(state),
    htmlAfterFailure,
    cachedPrice,
  }));
};

const runPage = (network, scenario = "hour", pageKind = "recent") => JSON.parse(execFileSync(
  process.execPath,
  ["--require", "@babel/register", "-e", `(${simulatePage.toString()})()`],
  {
    cwd: path.resolve(__dirname, ".."),
    env: {
      ...process.env,
      MENU_ACTIVE: network,
      NATIVE_ASSET_LABEL: network === "Liquid" ? "LBTC" : "BTC",
      IS_ELEMENTS: network.startsWith("Liquid") ? "1" : "",
      ASSET_MAP_URL: network.startsWith("Liquid") ? "./_data/assets.minimal.json" : "",
      API_URL: "/api", BASE_HREF: "/", SCENARIO: scenario, PAGE_KIND: pageKind,
    },
    encoding: "utf8",
  },
));

for (const [network, total] of [["Bitcoin", 306], ["Liquid", 307]]) {
  test(`${network} recent page stays within its approved first-hour budget`, () => {
    const page = runPage(network);
    assert.equal(page.total, total);
    assert.equal(page.counts["tip-height"], 120);
    assert.equal(page.counts.recent, 120);
    assert.equal(page.counts["fee-est"], 60);
    assert.deepEqual(page.priceFrames, [0, 600_000, 1_200_000, 1_800_000, 2_400_000, 3_000_000]);
    assert.match(page.html, /transactions-with-usd-values/);
    assert.match(page.html, /\$100\.00 USD/);
    assert.match(page.html, /\$1\.00 USD/);
    assert.match(page.html, network === "Liquid" ? /0\.00100000 LBTC/ : /0\.00100000 BTC/);
  });
}

for (const network of ["Bitcoin Testnet", "Bitcoin Signet", "Liquid Testnet", "Custom"]) {
  test(`${network} recent page does not fetch prices or display USD values`, () => {
    const page = runPage(network);
    assert.deepEqual(page.priceFrames, []);
    assert.equal(page.total, network.startsWith("Liquid") ? 301 : 300);
    assert.doesNotMatch(page.html, /amount-with-usd|transactions-with-usd-values/);
  });
}

test("recent-page price polling respects focus, departure, and reentry", () => {
  const page = runPage("Bitcoin", "navigation");
  assert.deepEqual(page.priceFrames, [0, 1_100_000, 1_700_000]);
});

test("a failed price refresh retains the previous price and waits for the regular retry", () => {
  const page = runPage("Bitcoin", "failure");
  assert.equal(page.total, 306);
  assert.deepEqual(page.priceFrames, [0, 600_000, 1_200_000, 1_800_000, 2_400_000, 3_000_000]);
  assert.match(page.htmlAfterFailure, /\$100\.00 USD/);
  assert.match(page.html, /\$200\.00 USD/);
});

test("a failed first price request leaves USD lines blank until the regular retry succeeds", () => {
  const page = runPage("Bitcoin", "initial-failure", "addr");
  assert.deepEqual(page.priceFrames, [0, 600_000]);
  assert.match(page.htmlAfterFailure, /0\.00450000 BTC/);
  assert.match(page.htmlAfterFailure, /amount-with-usd-secondary" aria-hidden="true">\u00a0</);
  assert.doesNotMatch(page.htmlAfterFailure, /N\/A|USD/);
  assert.match(page.html, /\$450\.00 USD/);
});

for (const [network, extra] of [["Bitcoin", 0], ["Liquid", 1]]) {
  for (const [kind, count] of [["confirmed", 131], ["block", 130], ["addr", 128], ["mempool", 246]]) {
    test(`${network} ${kind} page uses one shared price feed within its hourly budget`, () => {
      const page = runPage(network, "hour", kind);
      assert.equal(page.total, count + extra, JSON.stringify(page.counts));
      assert.deepEqual(page.priceFrames, [0, 600_000, 1_200_000, 1_800_000, 2_400_000, 3_000_000]);
      assert.match(page.html, /amount-with-usd-secondary/);
      assert.doesNotMatch(page.html, /amount-with-usd-secondary">N\/A/);
      if (kind === "confirmed") {
        const footer = page.html.match(/class="transaction-table-footer-confirmation-text text-success">([\s\S]*?)<\/div>/)[1];
        assert.match(footer, /0\.00100000 (L)?BTC/);
        assert.doesNotMatch(footer, /USD|amount-with-usd/);
      }
      if (kind === "addr") assert.match(page.html, /\$450\.00 USD/);
    });
  }
  test(`${network} unconfirmed transaction adds no tip-driven price fetches`, () => {
    const page = runPage(network, "hour", "unconfirmed");
    const statusRequests = network === "Bitcoin" ? 5 : 59;
    assert.equal(page.counts["tx-status"], statusRequests);
    assert.equal(page.total, 1 + 120 + 60 + 60 + statusRequests + 6 + extra);
    assert.equal(page.priceFrames.length, 6);
    assert.match(page.html, /\$101\.00 USD/);
    assert.match(page.html, /\$100\.00 USD/);
    assert.match(page.html, /\$1\.00 USD/);
    const footer = page.html.match(/class="transaction-table-footer-confirmation-text text-warning">([\s\S]*?)<\/div>/)[1];
    assert.match(footer, /0\.00100000 (L)?BTC/);
    assert.doesNotMatch(footer, /USD|amount-with-usd/);
  });
}

test("Liquid native asset statistics use the shared BTC price with peg-outs and burns kept separate", () => {
  const page = runPage("Liquid", "hour", "asset");
  assert.equal(page.total, 129);
  for (const amount of ["$750.00 USD", "$1,200.00 USD", "$300.00 USD", "$150.00 USD"]) {
    assert.ok(page.html.includes(amount), amount);
  }
});

test("pages share the cached price, with no fetch on page changes, pagination, or expanding details", () => {
  const page = runPage("Bitcoin", "shared");
  assert.equal(page.cachedPrice, 100_000);
  assert.deepEqual(page.priceFrames, [0, 600_000]);
});

test("browsing price pages reuses a fresh price and keeps one timer across page changes", () => {
  const page = runPage("Bitcoin", "browsing");
  // Returning at 360s from a non-price page reuses the price and restarts the timer.
  assert.deepEqual(page.priceFrames, [0, 960_000, 1_560_000, 2_160_000, 2_760_000, 3_360_000]);
});
