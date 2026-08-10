const test = require("node:test");
const assert = require("node:assert/strict");
const { Subject } = require("../client/node_modules/rxjs/Subject");
const {
  TestScheduler,
} = require("../client/node_modules/rxjs/testing");

process.env.IS_ELEMENTS = "1";
process.env.MENU_ACTIVE = "Liquid";
process.env.SHOW_PEG_DATA = "1";
process.env.SHOW_HIGH_VALUE_ASSETS = "1";
process.env.CANONICAL_URL = "https://blockstream.info/liquid/";

const { Observable: O } = require("../client/src/rxjs");
const {
  blockGridTransactionSelectEvent,
  highValueAssetDefinitions,
  pollIntervalsMs,
} = require("../client/src/const");
const {
  pollWhileActive,
  pollWhileViewing,
  schedulePollsWhileActive,
  tickWhileFocused,
} = require("../client/src/util");
const {
  default: main,
  dashboardNewBlocks,
  parseTipHeight,
  scheduleBlockTemplatePolls,
  scheduleDashboardBlockTemplatePolls,
  subsequentTipHeights,
  tipDrivenBlockListRefreshes,
  trackPendingBlockTemplateEvent,
} = require("../client/src/app");

const empty$ = O.empty();

const makeRoute = () => {
  const location = {
    hash: "",
    key: "home",
    pathname: "/",
    query: {},
  };
  const home$ = O.of(location);
  const route = (pattern) =>
    pattern === undefined || pattern === "/" ? home$ : empty$;

  route.all$ = home$;
  return route;
};

const makeBlockRoute = (hash) => {
  const location = {
    hash: "",
    key: "block",
    params: { hash },
    pathname: `/block/${hash}`,
    query: {},
  };
  const location$ = O.of(location);
  const route = (pattern) =>
    pattern === undefined || pattern === "/block/:hash"
      ? location$
      : empty$;

  route.all$ = location$;
  return route;
};

const makeApiRoute = () => {
  const location = {
    hash: "",
    key: "api",
    pathname: "/explorer-api",
    query: {},
  };
  const location$ = O.of(location);
  const route = (pattern) =>
    pattern === undefined || pattern === "/explorer-api"
      ? location$
      : empty$;

  route.all$ = location$;
  return route;
};

const makeSources = ({
  blockGridEvent$ = empty$,
  responseStreams = {},
  route = makeRoute(),
  selectedCategories = [],
} = {}) => ({
  DOM: {
    select: (selector) => ({
      elements: () => empty$,
      events: (eventName) =>
        selector === ".block-grid__canvas" &&
        eventName === blockGridTransactionSelectEvent
          ? blockGridEvent$
          : empty$,
    }),
  },
  HTTP: {
    select: (category) => {
      selectedCategories.push(category);
      return responseStreams[category] || empty$;
    },
  },
  blinding: empty$,
  route,
  scanner: empty$,
  search: empty$,
  storage: {
    local: {
      getItem: () => O.of(null),
    },
  },
});

const pollingOptions = (scheduler, hasFocus = () => true) => ({
  pollingEnabled: true,
  pollingScheduler: scheduler,
  hasFocus,
});

const requestFrames = (requests, category) => requests
  .filter((request) => request.category === category)
  .map((request) => request.frame);

const highValueAssetRequestCount = (requests, frame) => requests.filter(
  (request) =>
    request.frame === frame &&
    request.category.startsWith("dashboard-high-value-asset-"),
).length;

test("requests and consumes block templates on an Elements dashboard", () => {
  const selectedCategories = [];
  const sources = makeSources({ selectedCategories });
  const requests = [];

  main(sources).HTTP
    .filter(({ category }) => category === "block-template")
    .subscribe((request) => requests.push(request));

  assert.ok(selectedCategories.includes("block-template"));
  assert.deepEqual(requests, [
    {
      bg: true,
      category: "block-template",
      method: "GET",
      url: "/api/block-template",
    },
  ]);
});

test("delays a new-tip poll and resets the regular template cadence", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const start$ = new Subject();
  const newBlock$ = new Subject();
  const polls = [];

  scheduler.maxFrames = 57_000;
  scheduleBlockTemplatePolls(start$, newBlock$, scheduler)
    .subscribe((pollIndex) => polls.push([scheduler.frame, pollIndex]));
  scheduler.schedule(() => start$.next(), 0);
  scheduler.schedule(() => newBlock$.next(), 12_000);
  scheduler.flush();

  assert.deepEqual(polls, [
    [0, 0],
    [27_000, 0],
    [57_000, 1],
  ]);
});

test("starts template polling when a delayed Liquid dashboard becomes ready", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const view$ = new Subject();
  const newBlock$ = new Subject();
  const polls = [];

  scheduler.maxFrames = 1_000;
  scheduleDashboardBlockTemplatePolls(view$, newBlock$, scheduler)
    .subscribe((pollIndex) => polls.push([scheduler.frame, pollIndex]));
  scheduler.schedule(() => view$.next("loading"), 0);
  scheduler.schedule(() => view$.next("dashBoard"), 250);
  scheduler.flush();

  assert.deepEqual(polls, [[250, 0]]);
});

test("restarts template polling when the dashboard is reopened", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const view$ = new Subject();
  const newBlock$ = new Subject();
  const polls = [];

  scheduler.maxFrames = 1_000;
  scheduleDashboardBlockTemplatePolls(view$, newBlock$, scheduler)
    .subscribe((pollIndex) => polls.push([scheduler.frame, pollIndex]));
  scheduler.schedule(() => view$.next("dashBoard"), 0);
  scheduler.schedule(() => view$.next("tx"), 250);
  scheduler.schedule(() => view$.next("dashBoard"), 500);
  scheduler.flush();

  assert.deepEqual(polls, [
    [0, 0],
    [500, 0],
  ]);
});

test("view polls wait one interval and reset when the active view changes", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const activeKey$ = new Subject();
  const polls = [];

  scheduler.maxFrames = 140_000;
  schedulePollsWhileActive(
    pollIntervalsMs.standard,
    activeKey$,
    scheduler,
  ).subscribe(() => polls.push(scheduler.frame));
  scheduler.schedule(() => activeKey$.next("dashBoard"), 0);
  scheduler.schedule(() => activeKey$.next("dashBoard"), 10_000);
  scheduler.schedule(() => activeKey$.next("recentTxs"), 70_000);
  scheduler.flush();

  assert.deepEqual(polls, [60_000, 130_000]);
});

test("view polls pause while unfocused and restart after leaving the view", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const activeKey$ = new Subject();
  const polls = [];
  let focused = true;

  scheduler.maxFrames = 270_000;
  pollWhileActive(
    pollIntervalsMs.standard,
    activeKey$,
    scheduler,
    () => focused,
    true,
  ).subscribe(() => polls.push(scheduler.frame));
  scheduler.schedule(() => activeKey$.next("dashBoard"), 0);
  scheduler.schedule(() => { focused = false; }, 50_000);
  scheduler.schedule(() => { focused = true; }, 70_000);
  scheduler.schedule(() => activeKey$.next(null), 130_000);
  scheduler.schedule(() => activeKey$.next("dashBoard"), 200_000);
  scheduler.flush();

  assert.deepEqual(polls, [120_000, 260_000]);
});

test("global polling does not catch up immediately when focus returns", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const polls = [];
  let focused = true;

  scheduler.maxFrames = 65_000;
  tickWhileFocused(
    pollIntervalsMs.fast,
    scheduler,
    () => focused,
    true,
  ).subscribe(() => polls.push(scheduler.frame));
  scheduler.schedule(() => { focused = false; }, 10_000);
  scheduler.schedule(() => { focused = true; }, 35_000);
  scheduler.flush();

  assert.deepEqual(polls, [0, 60_000]);
});

test("view polls remain stopped on unrelated views", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const view$ = new Subject();
  const polls = [];

  scheduler.maxFrames = 140_000;
  pollWhileViewing(
    pollIntervalsMs.standard,
    "dashBoard",
    view$,
    scheduler,
    () => true,
    true,
  ).subscribe(() => polls.push(scheduler.frame));
  scheduler.schedule(() => view$.next("dashBoard"), 0);
  scheduler.schedule(() => view$.next("tx"), 20_000);
  scheduler.schedule(() => view$.next("dashBoard"), 70_000);
  scheduler.flush();

  assert.deepEqual(polls, [130_000]);
});

test("uses the configured dashboard request cadences without immediate duplicates", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const requests = [];
  const expectedFrames = (interval) => {
    const frames = [];
    for (let frame = 0; frame <= pollIntervalsMs.slow; frame += interval) {
      frames.push(frame);
    }
    return frames;
  };

  scheduler.maxFrames = pollIntervalsMs.slow;
  main(makeSources(), pollingOptions(scheduler)).HTTP
    .subscribe((request) => requests.push({ ...request, frame: scheduler.frame }));
  scheduler.flush();

  const fastFrames = expectedFrames(pollIntervalsMs.fast);
  const standardFrames = expectedFrames(pollIntervalsMs.standard);
  const slowFrames = expectedFrames(pollIntervalsMs.slow);

  assert.deepEqual(requestFrames(requests, "tip-height"), fastFrames);
  assert.deepEqual(requestFrames(requests, "block-template"), fastFrames);
  assert.deepEqual(requestFrames(requests, "recent"), fastFrames);
  assert.deepEqual(requestFrames(requests, "mempool"), standardFrames);
  assert.deepEqual(requestFrames(requests, "fee-est"), standardFrames);
  assert.deepEqual(
    requestFrames(requests, "dashboard-peg-mempool-txs"),
    standardFrames,
  );
  assert.deepEqual(requestFrames(requests, "blocks"), slowFrames);
  assert.deepEqual(
    requestFrames(requests, "bitcoin-market-chart"),
    slowFrames,
  );

  const highValueAssetRequests = requests.filter((request) =>
    request.category.startsWith("dashboard-high-value-asset-"));
  assert.deepEqual(
    [...new Set(highValueAssetRequests.map((request) => request.frame))],
    slowFrames,
  );
  assert.equal(
    highValueAssetRequests.length,
    slowFrames.length * highValueAssetDefinitions.length * 2,
  );
  for (const frame of slowFrames) {
    assert.equal(
      highValueAssetRequestCount(requests, frame),
      highValueAssetDefinitions.length * 2,
    );
  }
});

test("does not run the block-list reorg safety poll on unrelated routes", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const requests = [];

  scheduler.maxFrames = pollIntervalsMs.slow;
  main(
    makeSources({ route: makeApiRoute() }),
    pollingOptions(scheduler),
  ).HTTP.subscribe((request) => requests.push({
    ...request,
    frame: scheduler.frame,
  }));
  scheduler.flush();

  assert.deepEqual(requestFrames(requests, "blocks"), []);
});

test("emits only actual tip-height changes after the initial baseline", () => {
  const tipHeight$ = new Subject();
  const heights = [];

  subsequentTipHeights(tipHeight$).subscribe((height) => heights.push(height));
  [ 100, 100, 101, 101, 99 ].forEach((height) => tipHeight$.next(height));

  assert.deepEqual(heights, [ 101, 99 ]);
});

test("accepts only non-negative safe integer tip heights", () => {
  assert.equal(parseTipHeight("0"), 0);
  assert.equal(parseTipHeight(" 101\n"), 101);
  assert.equal(parseTipHeight(42), 42);

  [
    "",
    "   ",
    "1.5",
    "-1",
    "not-a-height",
    -1,
    1.5,
    Number.MAX_SAFE_INTEGER + 1,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    null,
    undefined,
  ].forEach((value) => assert.equal(parseTipHeight(value), null));
});

test("gates tip-driven block refreshes to views that show the block list", () => {
  const tipHeight$ = new Subject();
  const view$ = new Subject();
  const heights = [];

  tipDrivenBlockListRefreshes(tipHeight$, view$)
    .subscribe((height) => heights.push(height));
  view$.next("dashBoard");
  tipHeight$.next(101);
  view$.next("apiLanding");
  tipHeight$.next(102);
  view$.next("recentBlocks");
  tipHeight$.next(103);

  assert.deepEqual(heights, [101, 103]);
});

test("refreshes the dashboard block list when the tip height changes", () => {
  const tipHeightResponses = new Subject();
  const requests = [];
  const sources = makeSources({
    responseStreams: { "tip-height": tipHeightResponses },
  });

  main(sources).HTTP.subscribe((request) => requests.push(request));
  tipHeightResponses.next(O.of({ text: "not-a-height" }));
  tipHeightResponses.next(O.of({ text: "100" }));
  tipHeightResponses.next(O.of({ text: "" }));
  tipHeightResponses.next(O.of({ text: "100" }));
  tipHeightResponses.next(O.of({ text: "101" }));

  assert.equal(
    requests.filter((request) => request.category === "blocks").length,
    2,
  );
});

test("treats the first block response of each dashboard visit as a baseline", () => {
  const page$ = new Subject();
  const latestBlock$ = new Subject();
  const newBlocks = [];

  dashboardNewBlocks(page$, latestBlock$)
    .subscribe((block) => newBlocks.push(block.id));

  page$.next({ key: "home-1", pathname: "/" });
  latestBlock$.next({ id: "a" });
  latestBlock$.next({ id: "b" });
  page$.next({ key: "tx", pathname: "/tx/b" });
  latestBlock$.next({ id: "c" });
  page$.next({ key: "home-2", pathname: "/" });
  latestBlock$.next({ id: "d" });
  latestBlock$.next({ id: "e" });

  assert.deepEqual(newBlocks, ["b", "e"]);
});

test("refreshes Liquid block-dependent data only after a new block response", () => {
  const scheduler = new TestScheduler((actual, expected) =>
    assert.deepEqual(actual, expected));
  const blocksResponses = new Subject();
  const tipHeightResponses = new Subject();
  const requests = [];
  const sources = makeSources({
    responseStreams: {
      blocks: blocksResponses,
      "tip-height": tipHeightResponses,
    },
  });

  scheduler.maxFrames = 16_000;
  main(sources, pollingOptions(scheduler)).HTTP
    .subscribe((request) => requests.push({ ...request, frame: scheduler.frame }));
  scheduler.schedule(() => blocksResponses.next(O.of({
    body: [{ id: "a", height: 100 }],
  })), 1);
  scheduler.schedule(() => tipHeightResponses.next(O.of({ text: "100" })), 2);
  scheduler.schedule(() => tipHeightResponses.next(O.of({ text: "101" })), 3);
  scheduler.schedule(() => blocksResponses.next(O.of({
    body: [{ id: "b", height: 101 }],
  })), 4);
  scheduler.flush();

  assert.deepEqual(requestFrames(requests, "blocks"), [0, 3]);
  assert.deepEqual(requestFrames(requests, "dashboard-peg-asset"), [0, 4]);
  assert.deepEqual(
    requestFrames(requests, "dashboard-peg-chain-txs"),
    [0, 4],
  );
  assert.deepEqual(
    requestFrames(requests, "dashboard-peg-mempool-txs"),
    [0],
  );
  assert.deepEqual(requestFrames(requests, "block-template"), [0, 15_004]);
});

test("navigates a selected pending-block transaction in app history", () => {
  const txid = "a".repeat(64);
  const routeUpdates = [];
  const sources = makeSources({
    blockGridEvent$: O.of({ detail: { txid } }),
  });

  main(sources).route.subscribe((update) => routeUpdates.push(update));

  assert.deepEqual(routeUpdates, [
    {
      type: "push",
      pathname: `/tx/${txid}`,
    },
  ]);
});

test("requests predecessor metadata for confirmed block intervals", () => {
  const hash = "a".repeat(64);
  const previousHash = "b".repeat(64);
  const blockResponses = new Subject();
  const requests = [];
  const sources = makeSources({
    responseStreams: { block: blockResponses },
    route: makeBlockRoute(hash),
  });

  main(sources).HTTP.subscribe((request) => requests.push(request));
  blockResponses.next(O.of({
    body: { id: hash, previousblockhash: previousHash },
  }));

  assert.ok(requests.some((request) =>
    request.category === "previous-block" &&
    request.url === `/api/block/${previousHash}`
  ));
});

test("ignores block template responses for an older tip", () => {
  const firstTip = "a".repeat(64);
  const secondTip = "b".repeat(64);
  const initialState = {
    template: null,
    key: null,
    transactionCount: null,
    delta: null,
    tipId: null,
  };
  const atFirstTip = trackPendingBlockTemplateEvent(initialState, {
    tipId: firstTip,
  });
  const firstTemplate = trackPendingBlockTemplateEvent(atFirstTip, {
    template: { previousblockhash: firstTip, transactions: [] },
  });
  const atSecondTip = trackPendingBlockTemplateEvent(firstTemplate, {
    tipId: secondTip,
  });
  const secondTemplate = trackPendingBlockTemplateEvent(atSecondTip, {
    template: {
      previousblockhash: secondTip,
      transactions: [{ txid: "c".repeat(64) }],
    },
  });
  const afterLateFirstResponse = trackPendingBlockTemplateEvent(
    secondTemplate,
    { template: { previousblockhash: firstTip, transactions: [] } },
  );

  assert.equal(atSecondTip.template, null);
  assert.equal(secondTemplate.template.previousblockhash, secondTip);
  assert.equal(afterLateFirstResponse, secondTemplate);
});
