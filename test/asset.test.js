const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

const assetView = require("../client/src/views/asset").default;
const t = require("../client/src/l10n").default.en;

const issuerPubkey = `02${"a".repeat(64)}`;
const initialIssuerPubkey = `03${"b".repeat(64)}`;

const makeAsset = (overrides = {}) => ({
  asset_id: "c".repeat(64),
  issuance_txin: { txid: "d".repeat(64), vin: 0 },
  name: "Example asset",
  precision: 0,
  chain_stats: {},
  mempool_stats: {},
  contract: {
    version: 1,
    name: "Example asset",
    precision: 0,
    entity: { domain: "example.com" },
    // Distinct keys catch selecting the wrong field by property presence alone.
    issuer_pubkey: issuerPubkey,
    initial_issuer_pubkey: initialIssuerPubkey,
  },
  ...overrides,
});

const viewAsset = (asset) => assetView({
  asset,
  assetTxs: [],
  goAsset: { last_txids: [], est_chain_seen_count: 0 },
  page: { pathname: `/asset/${asset.asset_id}`, query: {} },
  t,
});

const findVNode = (vnode, predicate) => {
  if (!vnode) return null;
  if (predicate(vnode)) return vnode;
  for (const child of vnode.children || []) {
    const match = findVNode(child, predicate);
    if (match) return match;
  }
  return null;
};

const hasClass = (vnode, className) => vnode.data && vnode.data.props &&
  (vnode.data.props.className || "").split(/\s+/).includes(className);

for (const version of [0, 1, 2]) {
  test(`renders and copies the correct contract issuer key for version ${version}`, () => {
    const asset = makeAsset();
    asset.contract.version = version;
    const contract = findVNode(viewAsset(asset), vnode => hasClass(vnode, "asset-contract-table"));
    assert.ok(contract);

    const label = version === 2 ? "INITIAL ISSUER PUBKEY" : "ISSUER PUBKEY";
    const expected = version === 2 ? initialIssuerPubkey : issuerPubkey;
    const other = version === 2 ? issuerPubkey : initialIssuerPubkey;
    const html = render(contract);
    const shortKey = key => `${key.slice(0, 10)}...${key.slice(-10)}`;
    assert.ok(html.includes(`>${label}</p>`));
    assert.ok(html.includes(shortKey(expected)));
    assert.ok(!html.includes(shortKey(other)));
    assert.ok(!html.includes(other));

    const copy = findVNode(contract, vnode => vnode.data && vnode.data.attrs &&
      vnode.data.attrs["aria-label"] === `Copy ${label.toLowerCase()}`);
    assert.ok(copy);
    assert.equal(copy.data.dataset.clipboardCopy, expected);
  });
}

test("does not substitute a legacy issuer key when a v2 contract's initial key is missing", () => {
  const asset = makeAsset();
  asset.contract.version = 2;
  delete asset.contract.initial_issuer_pubkey;
  const contract = findVNode(viewAsset(asset), vnode => hasClass(vnode, "asset-contract-table"));
  const html = render(contract);

  assert.match(html, /INITIAL ISSUER PUBKEY[\s\S]*?N\/A/);
  assert.ok(!html.includes(issuerPubkey));
  assert.doesNotMatch(html, /Copy initial issuer pubkey/);
});

test("renders the asset image URL supplied by the registry response", () => {
  const href = "https://registry.example.com/v2/assets/icon.png";
  const vnode = viewAsset(makeAsset({ registry: { icon: { href } } }));
  const icon = findVNode(vnode, node => hasClass(node, "asset-icon-container"));
  assert.ok(icon);
  const image = findVNode(icon, node => node.sel === "img");

  assert.ok(image);
  assert.equal(image.data.props.src, href);
});

test("renders the default asset icon when the response has no image", () => {
  const icon = findVNode(viewAsset(makeAsset()), vnode => hasClass(vnode, "asset-icon-container"));

  assert.ok(icon);
  assert.equal(findVNode(icon, vnode => vnode.sel === "img"), null);
  assert.ok(findVNode(icon, vnode => vnode.sel === "svg"));
  assert.equal(icon.data.attrs["aria-busy"], "false");
});
