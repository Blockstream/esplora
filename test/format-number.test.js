const test = require("node:test");
const assert = require("node:assert/strict");

const {
  formatFeeRate,
  formatNumber,
  formatUsd,
} = require("../client/src/views/util");

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

test("formats fee rates with up to two decimal places and a fallback", () => {
  assert.equal(formatFeeRate(2), "2 sat/vB");
  assert.equal(formatFeeRate(2.5), "2.5 sat/vB");
  assert.equal(formatFeeRate(2.555), "2.56 sat/vB");
  assert.equal(formatFeeRate(null), "N/A");
  assert.equal(formatFeeRate(undefined, "-"), "-");
});

test("formats dollar values with a fallback", () => {
  assert.equal(formatUsd(1_234.5), "$1,234.50 USD");
  assert.equal(formatUsd(null), "N/A");
  assert.equal(formatUsd(undefined, "-"), "-");
});
