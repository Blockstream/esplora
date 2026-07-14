const test = require("node:test");
const assert = require("node:assert/strict");

const { formatNumber } = require("../client/src/views/util");

test("separates whole-number digits into groups of three", () => {
  assert.equal(formatNumber(999), "999");
  assert.equal(formatNumber(1000), "1,000");
  assert.equal(formatNumber(1234567), "1,234,567");
  assert.equal(formatNumber(-1234567.89), "-1,234,567.89");
});

test("preserves exact decimal strings and requested precision", () => {
  assert.equal(
    formatNumber("12345678901234567890.12345678"),
    "12,345,678,901,234,567,890.12345678",
  );
  assert.equal(formatNumber("1234.5", 3), "1,234.500");
});
