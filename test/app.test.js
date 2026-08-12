const test = require("node:test");
const assert = require("node:assert/strict");
const { Subject } = require("../client/node_modules/rxjs/Subject");
const {
  TestScheduler,
} = require("../client/node_modules/rxjs/testing");

process.env.IS_ELEMENTS = "1";
process.env.MENU_ACTIVE = "Liquid";

const { Observable: O } = require("../client/src/rxjs");
const {
  blockGridTransactionSelectEvent,
} = require("../client/src/const");
const {
  default: main,
  scheduleBlockTemplatePolls,
  scheduleDashboardBlockTemplatePolls,
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
