const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");

const { resolveRequestUrl } = require("../client/src/lib/request-url");

const apiBase = "https://blockstream.info/liquid/api";

test("prefixes API paths and keeps absolute URLs", () => {
  assert.equal(resolveRequestUrl("/blocks/tip/height", apiBase), `${apiBase}/blocks/tip/height`);
  assert.equal(resolveRequestUrl("https://example.com/prices", apiBase), "https://example.com/prices");
});

test("keeps the relative asset map URLs configured by flavors", () => {
  const flavors = path.join(__dirname, "../flavors");
  const assetMapUrls = fs.readdirSync(flavors)
    .map(flavor => path.join(flavors, flavor, "config.env"))
    .filter(file => fs.existsSync(file))
    .flatMap(file => [...fs.readFileSync(file, "utf8").matchAll(/^export ASSET_MAP_URL=(\S+)/gm)].map(m => m[1]));

  assert.ok(assetMapUrls.includes("./_data/assets.minimal.json"));
  assetMapUrls.forEach(url => assert.equal(resolveRequestUrl(url, apiBase), url));
});
