const test = require("node:test");
const assert = require("node:assert/strict");

process.env.IS_ELEMENTS = "1";
process.env.MENU_ACTIVE = "Liquid";

const { Observable: O } = require("../client/src/rxjs");
const {
  blockGridTransactionSelectEvent,
} = require("../client/src/const");
const {
  default: main,
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

const makeSources = ({
  blockGridEvent$ = empty$,
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
      return empty$;
    },
  },
  blinding: empty$,
  route: makeRoute(),
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
