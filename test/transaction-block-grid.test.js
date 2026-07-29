const test = require("node:test");
const assert = require("node:assert/strict");

const {
  findHorizontalNeighborIndex,
} = require("../client/src/components/transaction-block-grid");

const rects = [
  { x: 0, y: 0, width: 4, height: 4 },
  { x: 5, y: 1, width: 2, height: 2 },
  { x: 8, y: 1, width: 2, height: 2 },
  { x: 5, y: 6, width: 2, height: 2 },
];

test("moves horizontal grid focus to the nearest aligned column", () => {
  assert.equal(findHorizontalNeighborIndex(rects, 1, -1), 0);
  assert.equal(findHorizontalNeighborIndex(rects, 1, 1), 2);
});

test("keeps horizontal grid focus at an outer edge", () => {
  assert.equal(findHorizontalNeighborIndex(rects, 0, -1), 0);
  assert.equal(findHorizontalNeighborIndex(rects, 2, 1), 2);
});
