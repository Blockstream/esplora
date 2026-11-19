const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const render = require("snabbdom-to-html");

process.env.MENU_ACTIVE = "Bitcoin";

const { buildApiDocs, buildLlmsFiles, checkLlmsLinks } = require("../scripts/build-api-docs");
const { buildDocsSearchIndex, docsPages, searchDocs } = require("../client/src/lib/api-docs-search");
const docsView = require("../client/src/views/docs").default;
const t = require("../client/src/l10n").default.en;

const source = `# Reference

## Overview

### Getting started

#### Introduction {#introduction}

<!-- keywords: tiers pricing -->

Read the [authentication guide](#authentication).

#### Authentication {#authentication}

Use a token.

## REST API {#proto-rest}

### Transactions

#### GET /tx/:txid {#rest-tx}

**Get Transaction** · Free and Enterprise

Returns the transaction.

Fields: \`txid\`, \`fee\`

| Param | In | Type | Description |
|---|---|---|---|
| \`txid\` | path | hex (64) | Transaction id. |

> Liquid adds \`discount_vsize\`.

Example (cURL, Free):
\`\`\`bash
curl "https://blockstream.info/api/tx/abc123"
\`\`\`

Example (cURL, Enterprise):
\`\`\`bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" "https://enterprise.blockstream.info/api/tx/abc123"
\`\`\`

Example response (200, application/json):
\`\`\`json
{"txid": "abc123"}
\`\`\`

Response (error) (400, text/plain):
\`\`\`
bad request
\`\`\`

## QuickSync (Waterfalls) {#proto-quicksync}

### Wallet scan

#### GET /api/waterfalls/v2/waterfalls {#wf-v2}

**Scan Wallet (v2)**

Returns wallet history.

## Libraries & References

### Libraries

#### Libraries {#libraries}

Code Example:
\`\`\`rust
fn main() {}
\`\`\`

Code Example:
\`\`\`python
print("hi")
\`\`\`
`;

const withSource = (markdown, translations, fn, llms = "") => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "api-docs-"));
  const i18n = path.join(dir, "i18n");
  fs.writeFileSync(path.join(dir, "api.md"), markdown);
  fs.writeFileSync(path.join(dir, "llms.txt"), llms);
  fs.mkdirSync(i18n);
  Object.entries(translations).forEach(([locale, entries]) =>
    fs.writeFileSync(path.join(i18n, `${locale}.json`), JSON.stringify(entries)));
  try {
    return fn(path.join(dir, "api.md"), i18n);
  } finally {
    fs.rmSync(dir, { recursive: true });
  }
};

test("separates locale-independent structure from prose messages", () => {
  const { structure, messages } = withSource(source, {}, buildApiDocs);
  const page = docsPages(structure).find(({ page }) => page.id == "rest-tx").page;

  assert.equal(page.method, "GET");
  assert.equal(page.path, "/tx/:txid");
  assert.deepEqual(page.blocks.map(block => block.type), ["prose", "fields", "params", "note", "examples", "response", "response"]);
  assert.equal(page.blocks[3].liquidOnly, true);
  assert.match(page.blocks[4].items[0].html, /<span class="hljs-string">/);
  assert.equal(page.blocks[4].items[0].code, undefined);
  assert.equal(messages.en[page.blocks[6].labelMsg], "Response (error)");
  assert.equal(page.blocks[6].status, 400);
  assert.equal(structure.groups.find(group => group.id == "proto-quicksync").enterpriseOnly, true);
  assert.deepEqual(page.blocks[4].items.map(item => item.tier), ["free", "enterprise"]);
  assert.equal(page.tryPath, "/tx/:txid");
  assert.deepEqual(page.tryParams, { Bitcoin: { txid: "abc123" } });
  assert.equal(JSON.stringify(structure).includes("Returns the transaction"), false);

  assert.equal(messages.en["rest-tx.title"], "Get Transaction");
  assert.equal(messages.en["rest-tx.param.txid"], "<p>Transaction id.</p>");
  assert.equal(structure.anchors["rest-tx"], "rest-api/transactions#rest-tx");
  assert.equal(structure.anchors["proto-rest"], "rest-api/transactions");
  assert.match(messages.en["introduction.p0"], /href="docs\/overview\/getting-started#authentication"/);
  assert.equal(messages.en["introduction.keywords"], "tiers pricing");
});

test("prefills Try Code per network and skips binary endpoints", () => {
  const markdown = source.replace('Example (cURL, Enterprise):', `Example (cURL, Free):
\`\`\`bash
curl "https://blockstream.info/liquid/api/tx/def456"
\`\`\`

Example (cURL, Enterprise):
\`\`\`bash
curl -H "Authorization: Bearer $ACCESS_TOKEN" "https://enterprise.blockstream.info/testnet/api/tx/fed789"
\`\`\`

Example (cURL, Enterprise):`).replace("## QuickSync", `#### GET /tx/:txid/raw {#rest-tx-raw}

Example response (200, application/octet-stream):
\`\`\`
00
\`\`\`

## QuickSync`);
  const { structure } = withSource(markdown, {}, buildApiDocs);
  const pages = docsPages(structure);
  const page = pages.find(({ page }) => page.id == "rest-tx").page;
  const raw = pages.find(({ page }) => page.id == "rest-tx-raw").page;

  assert.deepEqual(page.tryParams, {
    Bitcoin: { txid: "abc123" },
    Liquid: { txid: "def456" },
    "Bitcoin Testnet": { txid: "fed789" },
  });
  assert.equal(raw.tryPath, undefined);
});

test("merges translations over English and falls back per message", () => {
  const { structure, messages } = withSource(source, {
    de: { "rest-tx.title": { message: "Transaktion abrufen", source: "stale" } }
  }, buildApiDocs);

  assert.deepEqual(structure.locales, ["en", "de"]);
  assert.equal(messages.de["rest-tx.title"], "Transaktion abrufen");
  assert.equal(messages.de["rest-tx.param.txid"], messages.en["rest-tx.param.txid"]);
});

test("ranks title and path matches ahead of keyword matches", () => {
  const { structure, messages } = withSource(source, {}, buildApiDocs);
  const index = buildDocsSearchIndex(structure, messages.en);

  assert.deepEqual(searchDocs(index, "transaction"), ["rest-tx"]);
  assert.deepEqual(searchDocs(index, "pricing"), ["introduction"]);
  assert.deepEqual(searchDocs(index, "tx txid"), ["rest-tx"]);
  assert.deepEqual(searchDocs(index, "nothing-matches"), []);
  assert.equal(searchDocs(index, "  "), null);
});

test("renders the selected tier, the current section only, and filters the sidebar", () => {
  const { structure, messages } = withSource(source, {}, buildApiDocs);
  const html = render(docsView({
    t, docs: structure, docsMessages: messages.en, docsTier: "enterprise", docsFilter: "pricing",
    docsHits: ["introduction"], docsActiveHit: "introduction", docsActiveId: "rest-tx", docsTry: {}, docsSectionPath: "rest-api/transactions",
    page: { pathname: "/docs", query: {} }
  }));

  assert.match(html, /enterprise\.blockstream\.info\/api\/tx\/abc123/);
  assert.doesNotMatch(html, /discount_vsize/);
  assert.match(html, /data-clipboardCopy="curl -H &quot;Authorization: Bearer \$ACCESS_TOKEN&quot; &quot;https:\/\/enterprise\.blockstream\.info\/api\/tx\/abc123&quot;"/);
  assert.match(html, /<h4 class="code-block-title">Response \(error\)<\/h4>/);
  assert.doesNotMatch(html, /curl &quot;https:\/\/blockstream\.info/);
  assert.match(html, /class="docs-nav-link highlighted"[^>]*>Introduction</);
  assert.doesNotMatch(html, /docs-nav-link[^>]*>Get Transaction</);
  assert.match(html, /<h1 class="docs-section-title font-h3">Transactions<\/h1>/);
  assert.doesNotMatch(html, /Use a token/);
  assert.match(html, /class="docs-pager-prev" href="docs\/overview\/getting-started"/);
});

test("compiles the checked-in API docs", () => {
  const { structure, messages } = buildApiDocs(path.join(__dirname, "../docs/api.md"), path.join(__dirname, "../docs/i18n"));
  const pages = docsPages(structure).map(({ page }) => page);

  assert.equal(pages.length, 85);
  assert.equal(structure.groups.flatMap(group => group.sections).length, 20);
  pages.forEach(page => assert.ok(page.titleMsg ? messages.en[page.titleMsg] : page.rpc, page.id));
});

test("hides enterprise-only sections on the Free tier", () => {
  const { structure, messages } = withSource(source, {}, buildApiDocs);
  const state = {
    t, docs: structure, docsMessages: messages.en, docsFilter: "", docsHits: null, docsTry: {},
    docsSectionPath: "quicksync-waterfalls/wallet-scan", page: { pathname: "/docs/quicksync-waterfalls/wallet-scan", query: {} }
  };
  const noscript = render(docsView({ ...state, docsTier: "free" }));
  process.browser = true;
  try {
    const free = render(docsView({ ...state, docsTier: "free" }));
    const enterprise = render(docsView({ ...state, docsTier: "enterprise" }));

    assert.match(free, /available on the Enterprise tier/);
    assert.doesNotMatch(free, /docs-nav-group-title[^>]*>QuickSync/);
    assert.doesNotMatch(free, /Returns wallet history/);
    assert.match(enterprise, /Returns wallet history/);
    assert.match(enterprise, /docs-nav-group-title[^>]*>QuickSync/);
  } finally {
    delete process.browser;
  }
  // The pre-rendered noscript page can't switch tiers, so it shows Enterprise-only sections
  assert.match(noscript, /Returns wallet history/);
  assert.match(noscript, /docs-nav-group-title[^>]*>QuickSync/);
});

test("renders tile lists and tabbed tables from layout comments", () => {
  const markdown = source.replace("Use a token.", `<!-- tiles -->

- \`REST\` **[REST](#proto-rest)**: Serves JSON.
- \`RPC\` **Electrum**: Speaks JSON-RPC.

<!-- tabs -->

##### REST

| Network | URL |
|---|---|
| Bitcoin | \`https://blockstream.info/api\` |

##### Electrum

| Network | Host |
|---|---|
| Bitcoin | \`bitcoin-mainnet.blockstream.info:50002\` |

Use a token.`);
  const { structure, messages } = withSource(markdown, {}, buildApiDocs);
  const page = docsPages(structure).find(({ page }) => page.id == "authentication").page;
  const [tiles, tabs] = page.blocks;

  assert.deepEqual(page.blocks.map(block => block.type), ["tiles", "tabs", "prose"]);
  assert.match(messages.en[tiles.items[0].titleMsg], /<a href="docs\/rest-api\/transactions">REST<\/a>/);
  assert.equal(messages.en[tiles.items[1].msg], "<p>Speaks JSON-RPC.</p>");
  assert.deepEqual(tiles.items.map(item => [item.badge, item.method]), [["REST", "GET"], ["RPC", "RPC"]]);
  assert.deepEqual(tabs.items.map(item => messages.en[item.labelMsg]), ["REST", "Electrum"]);
  assert.match(messages.en[tabs.items[1].msg], /<table>[\s\S]*bitcoin-mainnet/);

  const html = render(docsView({
    t, docs: structure, docsMessages: messages.en, docsFilter: "", docsHits: null, docsTry: {}, docsTier: "free",
    docsSectionPath: "overview/getting-started", page: { pathname: "/docs/overview/getting-started", query: {} }
  }));
  assert.match(html, /class="docs-tile docs-tile-get"><span class="method-badge method-badge-get">REST<\/span>/);
  assert.match(html, /class="docs-tile docs-tile-rpc"><span class="method-badge method-badge-rpc">RPC<\/span>/);
  assert.equal((html.match(/type="radio"/g) || []).length, 2);
  assert.equal((html.match(/checked="true"/g) || []).length, 1);
});

test("wraps endpoints in cards and expands only the current nav section", () => {
  const { structure, messages } = withSource(source, {}, buildApiDocs);
  const html = render(docsView({
    t, docs: structure, docsMessages: messages.en, docsFilter: "", docsHits: null, docsTry: {}, docsTier: "free",
    docsSectionPath: "rest-api/transactions", page: { pathname: "/docs/rest-api/transactions", query: {} }
  }));

  assert.match(html, /id="rest-tx" class="docs-page docs-endpoint"/);
  assert.match(html, /<details class="docs-nav-section" open="true"><summary class="active">Transactions/);
  assert.match(html, /<details class="docs-nav-section"><summary>Getting started/);
  assert.doesNotMatch(html, /open="false"/);
});

test("groups consecutive library examples in different languages into tabs", () => {
  const { structure } = withSource(source, {}, buildApiDocs);
  const page = docsPages(structure).find(({ page }) => page.id == "libraries").page;

  assert.deepEqual(page.blocks.map(block => block.type), ["examples"]);
  assert.equal(page.blocks[0].untiered, true);
  assert.deepEqual(page.blocks[0].items.map(item => item.lang), ["Rust", "Python"]);
  assert.ok(page.blocks[0].items.every(item => item.html));
});

test("publishes the docs Markdown for LLMs without build annotations", () => {
  const llms = "- [Transactions](https://blockstream.info/docs/rest-api/transactions#rest-tx)";
  const { full, llms: published } = withSource(source, {}, (sourcePath, i18n) =>
    buildLlmsFiles(sourcePath, buildApiDocs(sourcePath, i18n).structure), llms);

  assert.equal(published, llms);
  assert.doesNotMatch(full, /\{#|<!-- keywords/);
  assert.match(full, /\[authentication guide\]\(overview\/getting-started#authentication\)/);
  assert.match(full, /^#### GET \/tx\/:txid$/m);
});

test("rejects llms.txt links that don't resolve to a docs page", () => {
  const build = llms => () => withSource(source, {}, (sourcePath, i18n) =>
    buildLlmsFiles(sourcePath, buildApiDocs(sourcePath, i18n).structure), llms);

  assert.throws(build("[x](https://blockstream.info/docs/rest-api/nope)"), /broken docs link/);
  assert.throws(build("[x](https://blockstream.info/docs/rest-api/transactions#introduction)"), /broken docs link/);
  assert.doesNotThrow(build("[x](https://blockstream.info/docs/llms-full.md)"));
});

test("checked-in llms.txt links resolve", () => {
  const sourcePath = path.join(__dirname, "../docs/api.md");
  const { structure } = buildApiDocs(sourcePath);
  assert.doesNotThrow(() => buildLlmsFiles(sourcePath, structure));
  assert.doesNotThrow(() => checkLlmsLinks(fs.readFileSync(path.join(__dirname, "../www/llms.txt"), "utf8"), structure));
});
