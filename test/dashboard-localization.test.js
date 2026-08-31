const test = require("node:test");
const assert = require("node:assert/strict");
const render = require("snabbdom-to-html");

const l10n = require("../client/src/l10n").default;
const { blks } = require("../client/src/views/blocks");
const {
  ElapsedTime,
  formatDuration,
} = require("../client/src/components/elapsed-time");
const {
  highValueAssets,
} = require("../client/src/components/high-value-assets");
const difficultyAdjustment =
  require("../client/src/views/difficulty-adjustment").default;
const { overview } = require("../client/src/views/overview");
const { transactions } = require("../client/src/views/transactions");
const portuguese = require("../lang/pt-pt.json");

const t = l10n["pt-pt"];

test("localizes overview and recent block copy in Portuguese", () => {
  const block = {
    height: 123,
    id: "block-id",
    size: 1_000_000,
    timestamp: Math.floor(Date.now() / 1000),
    tx_count: 456,
    weight: 2_000_000,
  };
  const overviewHtml = render(overview({
    blocks: [block],
    mempool: { vsize: 0 },
    t,
  }));
  const blocksHtml = render(blks([block], false, { t }));

  assert.match(overviewHtml, /Visão Geral/);
  assert.match(overviewHtml, /Tempo Desde o Último Bloco/);
  assert.match(overviewHtml, /BLOCO #123/);
  assert.match(
    overviewHtml,
    /aria-label="Gráfico de linhas do preço do Bitcoin"/,
  );
  assert.match(blocksHtml, /Blocos Mais Recentes/);
  assert.match(blocksHtml, /Mais Recente/);
  assert.match(blocksHtml, /AGORA MESMO/);
  assert.match(blocksHtml, /TRANSAÇÕES/);
  assert.match(blocksHtml, /TAMANHO/);
  assert.match(blocksHtml, /aria-label="Ver bloco 123"/);
  assert.match(blocksHtml, /aria-label="Copiar número do bloco 123"/);
});

test("localizes recent transaction and difficulty copy in Portuguese", () => {
  const txid = "a".repeat(64);
  const transactionsHtml = render(transactions([{
    fee: 100,
    txid,
    value: 100_000_000,
    vsize: 100,
  }], false, { t }));
  const difficultyHtml = render(difficultyAdjustment({ blocks: [], t }));

  assert.match(transactionsHtml, /Transações Mais Recentes/);
  assert.match(transactionsHtml, /ID DA TRANSAÇÃO/);
  assert.match(transactionsHtml, /VALOR/);
  assert.match(transactionsHtml, /TAMANHO/);
  assert.match(transactionsHtml, /TAXA/);
  assert.match(
    transactionsHtml,
    new RegExp(`aria-label="Copiar ID da transação ${txid}"`),
  );
  assert.match(difficultyHtml, /Ajuste de Dificuldade/);
  assert.match(difficultyHtml, /TEMPO MÉDIO DO BLOCO/);
  assert.match(difficultyHtml, /AJUSTE ESPERADO/);
  assert.match(difficultyHtml, /AJUSTE ANTERIOR/);
  assert.match(difficultyHtml, /DATA DO AJUSTE ESPERADO/);
  assert.match(difficultyHtml, /Taxa de Hash/);
  assert.match(difficultyHtml, /Dificuldade/);
  assert.match(difficultyHtml, /Próximo ajuste indisponível/);
  assert.match(difficultyHtml, /N\/D/);
});

test("localizes elapsed times and formatter-owned fallbacks", () => {
  const oneYear = 365 * 24 * 60 * 60 * 1000;
  const elapsedHtml = render(ElapsedTime({
    timestamp: Date.now() - 90 * 1000,
    t,
  }));
  const highValueAssetsHtml = render(highValueAssets(t));

  assert.equal(formatDuration(0, false, t), "< 1 MINUTO");
  assert.equal(formatDuration(oneYear, false, t), "1 ANO");
  assert.match(elapsedHtml, /HÁ 1 MINUTO/);
  assert.match(highValueAssetsHtml, /N\/D/);
});

test("preserves all-caps dashboard label casing in Portuguese", () => {
  [
    "AMOUNT",
    "AVERAGE BLOCK TIME",
    "AVG FEE",
    "%s AGO",
    "BLOCK",
    "BLOCK #%s",
    "BLOCK FILLING",
    "DAY",
    "DAYS",
    "EXPECTED ADJ",
    "EXPECTED ADJ DATE",
    "FEE",
    "HIGH",
    "HOUR",
    "HOURS",
    "IN MEMPOOL",
    "LOW",
    "MINUTE",
    "MINUTES",
    "MONTH",
    "MONTHS",
    "PEG-IN",
    "PEG-OUT",
    "PREVIOUS ADJ",
    "SIZE",
    "TOTAL FEE COLLECTED",
    "TRANSACTION ID",
    "TRANSACTIONS",
    "TX ID",
    "TXID",
    "TYPE",
    "VALUE",
    "VOLUME IN",
    "VOLUME OUT",
    "YEAR",
    "YEARS",
  ].forEach((key) => {
    const translated = portuguese[key] || key;
    assert.equal(translated, translated.toUpperCase(), key);
  });
});
