import {
  blockGridTransactionSelectEvent,
  maxBlockWeight,
} from "../const";
import { clamp } from "../lib/math";

const DEFAULT_CELLS_PER_SIDE = 75;
const DEFAULT_BACKGROUND_COLOR = "#1c1c1c";
const DEFAULT_PLACEHOLDER_COLOR = "#262626";
const TILE_GUTTER = 1;
const EXIT_DURATION = 320;
const REENTRY_GAP = 25;
const ENTER_DURATION = 420;
const ENTER_START = EXIT_DURATION + REENTRY_GAP;
const TRANSITION_DURATION = ENTER_START + ENTER_DURATION;
const ENTER_SCALE = 0.28;
const MOVING_OPACITY = 0.72;
const TOOLTIP_HIDE_DELAY = 120;
const mountedInstances = new WeakMap();
const staticRoot = process.env.STATIC_ROOT || "";
const DEFAULT_LABELS = {
  allTransactionsShown: "All selected transactions are shown individually.",
  fee: "fee",
  feeRate: "fee rate",
  individuallyRendered: "Individually rendered transactions",
  keyboardInstructions:
    "Use the arrow keys to inspect transactions and Enter to open one.",
  omittedTransactions:
    "Lower-fee transactions are summarized in the metrics because they do not fit at this resolution.",
  transaction: "transaction",
  transactionGrid: "Pending block transaction grid",
  virtualSize: "virtual size"
};

function assertOpaqueColor(color, colorLabel) {
  if (
    typeof color !== "string" ||
    !color.trim() ||
    (window.CSS && !window.CSS.supports("color", color))
  ) {
    throw new TypeError(`${colorLabel} must be a valid CSS color.`);
  }

  const probe = document.createElement("canvas");
  probe.width = 1;
  probe.height = 1;
  const probeContext = probe.getContext("2d", { willReadFrequently: true });
  probeContext.clearRect(0, 0, 1, 1);
  probeContext.fillStyle = color;
  probeContext.fillRect(0, 0, 1, 1);

  if (probeContext.getImageData(0, 0, 1, 1).data[3] !== 255) {
    throw new TypeError(`${colorLabel} must be opaque.`);
  }
}

function normalizeFeeTiers(feeTiers) {
  if (!feeTiers || typeof feeTiers !== "object") {
    throw new TypeError("Fee tiers must define low, medium, and high tiers.");
  }

  const normalized = {};

  ["low", "medium", "high"].forEach(tierName => {
    const tier = feeTiers[tierName];
    if (!tier || typeof tier !== "object") {
      throw new TypeError(`Fee tier "${tierName}" is required.`);
    }

    const threshold = Number(tier.threshold);
    if (!Number.isFinite(threshold)) {
      throw new TypeError(`Fee tier "${tierName}" threshold must be finite.`);
    }

    assertOpaqueColor(tier.color, `Fee tier "${tierName}" color`);
    normalized[tierName] = {
      threshold,
      color: tier.color.trim()
    };
  });

  if (
    normalized.low.threshold >= normalized.medium.threshold ||
    normalized.medium.threshold >= normalized.high.threshold
  ) {
    throw new RangeError(
      "Fee tier thresholds must be strictly ascending from low to medium to high."
    );
  }

  return normalized;
}

function normalizeOptions(options) {
  if (
    options !== undefined &&
    (!options || typeof options !== "object" || Array.isArray(options))
  ) {
    throw new TypeError("Block grid options must be an object.");
  }

  const cellsPerSide = options?.cellsPerSide ?? DEFAULT_CELLS_PER_SIDE;
  const backgroundColor = options?.backgroundColor ?? DEFAULT_BACKGROUND_COLOR;
  const placeholderColor = options?.placeholderColor ?? DEFAULT_PLACEHOLDER_COLOR;
  const weightLimit = options?.weightLimit ?? maxBlockWeight;
  const labels = { ...DEFAULT_LABELS, ...(options?.labels || {}) };

  if (!Number.isInteger(cellsPerSide) || cellsPerSide <= 0) {
    throw new RangeError("options.cellsPerSide must be a positive integer.");
  }

  if (!Number.isFinite(weightLimit) || weightLimit <= 0) {
    throw new RangeError("options.weightLimit must be a positive finite number.");
  }

  Object.entries(labels).forEach(([name, value]) => {
    if (typeof value !== "string" || !value.trim()) {
      throw new TypeError(`options.labels.${name} must be a non-empty string.`);
    }
  });

  assertOpaqueColor(backgroundColor, "options.backgroundColor");
  assertOpaqueColor(placeholderColor, "options.placeholderColor");

  return {
    cellsPerSide,
    backgroundColor: backgroundColor.trim(),
    placeholderColor: placeholderColor.trim(),
    weightLimit,
    labels
  };
}

function normalizeTransactions(transactions) {
  if (!Array.isArray(transactions)) {
    throw new TypeError("Block grid transactions must be an array.");
  }

  return transactions.map((transaction, index) => {
    if (!transaction || typeof transaction !== "object") {
      throw new TypeError(`Transaction at index ${index} must be an object.`);
    }

    if (typeof transaction.txid !== "string" || !transaction.txid.trim()) {
      throw new TypeError(`Transaction at index ${index} must have a non-empty txid.`);
    }

    const fee = transaction.fee;
    const weight = transaction.weight;

    if (!Number.isFinite(fee) || fee < 0) {
      throw new RangeError(
        `Transaction "${transaction.txid}" must have a non-negative finite fee.`
      );
    }

    if (!Number.isFinite(weight) || weight <= 0) {
      throw new RangeError(
        `Transaction "${transaction.txid}" must have a positive finite weight.`
      );
    }

    const virtualSize = Math.ceil(weight / 4);
    return {
      txid: transaction.txid,
      fee,
      weight,
      virtualSize,
      feeRate: fee / virtualSize,
      inputIndex: index
    };
  });
}

function intersects(first, second) {
  return (
    first.x < second.x + second.width &&
    first.x + first.width > second.x &&
    first.y < second.y + second.height &&
    first.y + first.height > second.y
  );
}

function contains(outer, inner) {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

function splitFreeRect(freeRect, usedRect) {
  if (!intersects(freeRect, usedRect)) return [freeRect];

  const nextRects = [];
  const freeRight = freeRect.x + freeRect.width;
  const freeBottom = freeRect.y + freeRect.height;
  const usedRight = usedRect.x + usedRect.width;
  const usedBottom = usedRect.y + usedRect.height;

  if (usedRect.y > freeRect.y) {
    nextRects.push({
      x: freeRect.x,
      y: freeRect.y,
      width: freeRect.width,
      height: usedRect.y - freeRect.y
    });
  }

  if (usedBottom < freeBottom) {
    nextRects.push({
      x: freeRect.x,
      y: usedBottom,
      width: freeRect.width,
      height: freeBottom - usedBottom
    });
  }

  if (usedRect.x > freeRect.x) {
    nextRects.push({
      x: freeRect.x,
      y: freeRect.y,
      width: usedRect.x - freeRect.x,
      height: freeRect.height
    });
  }

  if (usedRight < freeRight) {
    nextRects.push({
      x: usedRight,
      y: freeRect.y,
      width: freeRight - usedRight,
      height: freeRect.height
    });
  }

  return nextRects.filter(rect => rect.width > 0 && rect.height > 0);
}

function pruneFreeRects(freeRects) {
  return freeRects.filter((rect, index) => {
    return !freeRects.some((other, otherIndex) => {
      return otherIndex !== index && contains(other, rect);
    });
  });
}

function scorePlacement(freeRect, sideCells) {
  return {
    x: freeRect.x + freeRect.width - sideCells,
    y: freeRect.y,
    areaFit: freeRect.width * freeRect.height - sideCells * sideCells,
    shortSideFit: Math.min(
      freeRect.width - sideCells,
      freeRect.height - sideCells
    ),
    longSideFit: Math.max(
      freeRect.width - sideCells,
      freeRect.height - sideCells
    )
  };
}

function findPlacement(item, freeRects) {
  let best = null;

  freeRects.forEach(freeRect => {
    if (item.sideCells > freeRect.width || item.sideCells > freeRect.height) return;

    const placement = {
      ...scorePlacement(freeRect, item.sideCells),
      width: item.sideCells,
      height: item.sideCells
    };

    if (
      !best ||
      placement.x > best.x ||
      (placement.x === best.x && placement.y < best.y) ||
      (
        placement.x === best.x &&
        placement.y === best.y &&
        placement.shortSideFit < best.shortSideFit
      ) ||
      (
        placement.x === best.x &&
        placement.y === best.y &&
        placement.shortSideFit === best.shortSideFit &&
        placement.areaFit < best.areaFit
      ) ||
      (
        placement.x === best.x &&
        placement.y === best.y &&
        placement.shortSideFit === best.shortSideFit &&
        placement.areaFit === best.areaFit &&
        placement.longSideFit < best.longSideFit
      )
    ) {
      best = placement;
    }
  });

  return best;
}

function packItems(items, gridDimensions) {
  // Approximate the square packing problem with a MaxRects-style free-space
  // search: https://en.wikipedia.org/wiki/Square_packing
  let freeRects = [{
    x: 0,
    y: 0,
    width: gridDimensions.columns,
    height: gridDimensions.rows
  }];
  const rects = [];
  const sortedItems = [...items].sort((first, second) => {
    return compareTransactionsByFeeRate(first.tx, second.tx);
  });

  for (const item of sortedItems) {
    const placement = findPlacement(item, freeRects);
    if (!placement) return null;

    rects.push({
      tx: item.tx,
      x: placement.x,
      y: placement.y,
      width: placement.width,
      height: placement.height
    });

    freeRects = pruneFreeRects(
      freeRects.flatMap(freeRect => splitFreeRect(freeRect, placement))
    );
  }

  return rects;
}

function quantizeTransactions(transactions, gridDimensions, weightLimit) {
  const cellWeight = weightLimit / (
    gridDimensions.columns * gridDimensions.rows
  );
  return transactions.map(transaction => ({
    tx: transaction,
    sideCells: Math.max(
      1,
      Math.round(Math.sqrt(transaction.weight / cellWeight))
    )
  }));
}

function compareTransactionsByFeeRate(first, second) {
  if (second.feeRate !== first.feeRate) return second.feeRate - first.feeRate;
  if (second.fee !== first.fee) return second.fee - first.fee;
  return first.inputIndex - second.inputIndex;
}

function rankTransactions(transactions) {
  return [...transactions].sort(compareTransactionsByFeeRate);
}

function createPlaceholderCells(rects, gridDimensions) {
  const occupiedCells = new Uint8Array(
    gridDimensions.columns * gridDimensions.rows
  );

  rects.forEach(rect => {
    for (let y = rect.y; y < rect.y + rect.height; y += 1) {
      for (let x = rect.x; x < rect.x + rect.width; x += 1) {
        occupiedCells[y * gridDimensions.columns + x] = 1;
      }
    }
  });

  const placeholderCells = [];
  occupiedCells.forEach((isOccupied, index) => {
    if (isOccupied) return;
    placeholderCells.push({
      x: index % gridDimensions.columns,
      y: Math.floor(index / gridDimensions.columns),
      width: 1,
      height: 1
    });
  });
  return placeholderCells;
}

function buildScene(rects, transactions, renderedCount, gridDimensions) {
  return {
    rects,
    placeholderCells: createPlaceholderCells(rects, gridDimensions),
    transactions,
    inputCount: transactions.length,
    renderedCount,
    gridDimensions
  };
}

function createScene(transactions, gridDimensions, weightLimit) {
  const rankedTransactions = rankTransactions(transactions);
  const completeRects = packItems(
    quantizeTransactions(rankedTransactions, gridDimensions, weightLimit),
    gridDimensions
  );

  if (completeRects) {
    return buildScene(
      completeRects,
      transactions,
      transactions.length,
      gridDimensions
    );
  }

  let smallestCandidate = 0;
  let largestCandidate = Math.max(0, rankedTransactions.length - 1);
  let bestRects = [];
  let bestCount = 0;

  while (smallestCandidate <= largestCandidate) {
    const candidateCount = Math.floor(
      (smallestCandidate + largestCandidate) / 2
    );
    const candidateRects = packItems(
      quantizeTransactions(
        rankedTransactions.slice(0, candidateCount),
        gridDimensions,
        weightLimit
      ),
      gridDimensions
    );

    if (candidateRects) {
      bestRects = candidateRects;
      bestCount = candidateCount;
      smallestCandidate = candidateCount + 1;
    } else {
      largestCandidate = candidateCount - 1;
    }
  }

  return buildScene(
    bestRects,
    transactions,
    bestCount,
    gridDimensions
  );
}

function feeTierFor(transaction, feeTiers) {
  if (transaction.feeRate >= feeTiers.high.threshold) return feeTiers.high;
  if (transaction.feeRate >= feeTiers.medium.threshold) return feeTiers.medium;
  return feeTiers.low;
}

function easeOutCubic(progress) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeInOutCubic(progress) {
  return progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
}

function clampProgress(elapsed, duration) {
  return clamp(elapsed / duration, 0, 1);
}

function outgoingOpacity(progress) {
  if (progress < 0.2) {
    return 1 - (1 - MOVING_OPACITY) * easeOutCubic(progress / 0.2);
  }
  if (progress < 0.65) return MOVING_OPACITY;
  return MOVING_OPACITY * (
    1 - easeInOutCubic((progress - 0.65) / 0.35)
  );
}

function incomingOpacity(progress) {
  if (progress < 0.75) {
    return MOVING_OPACITY * easeOutCubic(progress / 0.75);
  }
  return MOVING_OPACITY + (
    1 - MOVING_OPACITY
  ) * easeOutCubic((progress - 0.75) / 0.25);
}

function outgoingRectState(elapsed) {
  const progress = clampProgress(elapsed, EXIT_DURATION);
  return {
    scale: 1 - easeInOutCubic(progress),
    opacity: outgoingOpacity(progress)
  };
}

function incomingRectState(elapsed) {
  const progress = clampProgress(elapsed, ENTER_DURATION);
  return {
    scale: ENTER_SCALE + (1 - ENTER_SCALE) * easeOutCubic(progress),
    opacity: incomingOpacity(progress)
  };
}

function formatNumber(value, fractionDigits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: fractionDigits,
    minimumFractionDigits: fractionDigits
  }).format(value);
}

function shortenTxid(txid) {
  return `${txid.slice(0, 8)}...${txid.slice(-8)}`;
}

function gridDimensionsForSize(width, height, cellsPerSide) {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const aspectRatio = safeWidth / safeHeight;
  const aspectScale = Math.sqrt(aspectRatio);

  return {
    columns: Math.max(1, Math.round(cellsPerSide * aspectScale)),
    rows: Math.max(1, Math.round(cellsPerSide / aspectScale))
  };
}

function sameGridDimensions(first, second) {
  return (
    first.columns === second.columns &&
    first.rows === second.rows
  );
}

export function findHorizontalNeighborIndex(rects, currentIndex, direction) {
  if (!Array.isArray(rects) || !rects.length || ![-1, 1].includes(direction)) {
    return currentIndex;
  }
  if (currentIndex < 0 || currentIndex >= rects.length) return 0;

  const current = rects[currentIndex];
  const currentBottom = current.y + current.height;
  const currentEdge = direction < 0
    ? current.x
    : current.x + current.width;
  const candidates = rects
    .map((rect, index) => {
      if (index === currentIndex) return null;

      const candidateEdge = direction < 0
        ? rect.x + rect.width
        : rect.x;
      const horizontalGap = direction * (candidateEdge - currentEdge);
      if (horizontalGap < 0) return null;

      const candidateBottom = rect.y + rect.height;
      const verticalGap = Math.max(
        current.y - candidateBottom,
        rect.y - currentBottom,
        0
      );
      const verticalCenterDistance = Math.abs(
        rect.y + rect.height / 2 - (current.y + current.height / 2)
      );

      return { index, horizontalGap, verticalGap, verticalCenterDistance };
    })
    .filter(Boolean)
    .sort((first, second) =>
      first.verticalGap - second.verticalGap ||
      first.horizontalGap - second.horizontalGap ||
      first.verticalCenterDistance - second.verticalCenterDistance ||
      first.index - second.index
    );

  return candidates.length ? candidates[0].index : currentIndex;
}

export function renderBlockGrid(
  elementId,
  transactions,
  baseUrl = "",
  feeTiers,
  options
) {
  if (typeof elementId !== "string" || !elementId.trim()) {
    throw new TypeError("renderBlockGrid requires a non-empty element ID.");
  }

  const container = document.getElementById(elementId);
  if (!container) {
    throw new Error(`Block grid container "#${elementId}" was not found.`);
  }

  if (baseUrl !== undefined && baseUrl !== null && typeof baseUrl !== "string") {
    throw new TypeError("Block grid baseUrl must be a string.");
  }

  const initialTransactions = normalizeTransactions(transactions);
  const normalizedFeeTiers = normalizeFeeTiers(feeTiers);
  const normalizedOptions = normalizeOptions(options);
  const normalizedBaseUrl = (baseUrl || "").trim().replace(/\/+$/, "");
  const previousInstance = mountedInstances.get(container);
  if (previousInstance) previousInstance.destroy();

  const canvas = document.createElement("canvas");
  canvas.className = "block-grid__canvas";
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "application");
  canvas.setAttribute(
    "aria-keyshortcuts",
    "ArrowLeft ArrowRight ArrowUp ArrowDown Home End Enter Space"
  );
  canvas.style.borderColor = normalizedOptions.backgroundColor;

  const tooltip = document.createElement("div");
  tooltip.className = "block-grid__tooltip";
  tooltip.id = `${elementId}-tooltip`;
  tooltip.setAttribute("aria-live", "polite");
  tooltip.setAttribute("role", "tooltip");
  tooltip.hidden = true;

  const summary = document.createElement("button");
  const summaryIcon = document.createElement("img");
  const summaryDialogue = document.createElement("span");
  summary.type = "button";
  summary.className = "tooltip block-grid__summary";
  summary.id = `${elementId}-summary`;
  summary.hidden = true;
  summaryIcon.alt = "";
  summaryIcon.src = `${staticRoot}img/icons/tooltip.svg`;
  summaryDialogue.className = "tooltip-dialogue";
  summaryDialogue.setAttribute("role", "tooltip");
  summary.append(summaryIcon, summaryDialogue);
  canvas.setAttribute("aria-describedby", tooltip.id);

  const hadComponentClass = container.classList.contains("block-grid");
  container.classList.add("block-grid");
  container.replaceChildren(canvas, tooltip, summary);

  const context = canvas.getContext("2d");
  if (!context) {
    container.replaceChildren();
    if (!hadComponentClass) container.classList.remove("block-grid");
    throw new Error("This browser does not support the 2D canvas API.");
  }

  const initialBounds = canvas.getBoundingClientRect();
  let canvasCssWidth = Math.max(
    1,
    canvas.clientWidth || initialBounds.width || container.clientWidth
  );
  let canvasCssHeight = Math.max(
    1,
    canvas.clientHeight ||
      initialBounds.height ||
      container.clientHeight ||
      canvasCssWidth
  );
  let gridDimensions = gridDimensionsForSize(
    canvasCssWidth,
    canvasCssHeight,
    normalizedOptions.cellsPerSide
  );
  let settledScene = createScene(
    initialTransactions,
    gridDimensions,
    normalizedOptions.weightLimit
  );
  let hoveredTransaction = null;
  let activeTransition = null;
  let transitionFrameId = null;
  let queuedTransactions = null;
  let tooltipHideTimer = null;
  let destroyed = false;

  function updateSceneSummary() {
    const { labels } = normalizedOptions;
    const countSummary = [
      `${labels.individuallyRendered}:`,
      settledScene.renderedCount.toLocaleString(),
      "/",
      `${settledScene.inputCount.toLocaleString()}.`
    ].join(" ");
    const detail = settledScene.renderedCount === settledScene.inputCount
      ? labels.allTransactionsShown
      : labels.omittedTransactions;

    const summaryText = `${countSummary} ${detail}`;
    summary.setAttribute("aria-label", summaryText);
    summaryDialogue.textContent = summaryText;
    summary.hidden = settledScene.renderedCount >= settledScene.inputCount;
    canvas.setAttribute(
      "aria-label",
      `${labels.transactionGrid}. ${countSummary} ${labels.keyboardInstructions}`
    );
  }

  function gridMetrics() {
    const cellSize = Math.min(
      canvasCssWidth / gridDimensions.columns,
      canvasCssHeight / gridDimensions.rows
    );
    return {
      cellSize,
      offsetX: (
        canvasCssWidth - gridDimensions.columns * cellSize
      ) / 2,
      offsetY: (
        canvasCssHeight - gridDimensions.rows * cellSize
      ) / 2
    };
  }

  function gridFace(rect, metrics = gridMetrics()) {
    const bounds = {
      x: metrics.offsetX + rect.x * metrics.cellSize,
      y: metrics.offsetY + rect.y * metrics.cellSize,
      width: rect.width * metrics.cellSize,
      height: rect.height * metrics.cellSize
    };
    const inset = Math.min(
      TILE_GUTTER / 2,
      bounds.width / 4,
      bounds.height / 4
    );
    return {
      x: bounds.x + inset,
      y: bounds.y + inset,
      width: Math.max(0, bounds.width - inset * 2),
      height: Math.max(0, bounds.height - inset * 2)
    };
  }

  function scaledBounds(bounds, scale) {
    const width = bounds.width * scale;
    const height = bounds.height * scale;
    return {
      x: bounds.x + (bounds.width - width) / 2,
      y: bounds.y + (bounds.height - height) / 2,
      width,
      height
    };
  }

  function clearCanvas() {
    context.clearRect(0, 0, canvasCssWidth, canvasCssHeight);
    context.fillStyle = normalizedOptions.backgroundColor;
    context.fillRect(0, 0, canvasCssWidth, canvasCssHeight);
  }

  function drawPlaceholderFaces(scene) {
    context.save();
    context.fillStyle = normalizedOptions.placeholderColor;
    const metrics = gridMetrics();

    scene.placeholderCells.forEach(cell => {
      const bounds = gridFace(cell, metrics);
      context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    });

    context.restore();
  }

  function drawSceneFaces(scene, rectState, allowHover = false) {
    context.save();
    const metrics = gridMetrics();

    scene.rects.forEach(rect => {
      const state = rectState(rect);
      if (state.scale <= 0 || state.opacity <= 0) return;

      const bounds = scaledBounds(gridFace(rect, metrics), state.scale);
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const isHovered = allowHover && rect.tx === hoveredTransaction;
      context.globalAlpha = state.opacity * (isHovered ? 1 : 0.5);
      context.fillStyle = feeTierFor(rect.tx, normalizedFeeTiers).color;
      context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    });

    context.restore();
  }

  function drawSettledScene() {
    clearCanvas();
    drawPlaceholderFaces(settledScene);
    drawSceneFaces(
      settledScene,
      () => ({ scale: 1, opacity: 1 }),
      true
    );
  }

  function clearTooltipHideTimer() {
    if (tooltipHideTimer !== null) window.clearTimeout(tooltipHideTimer);
    tooltipHideTimer = null;
  }

  function hideTooltip() {
    clearTooltipHideTimer();
    tooltip.hidden = true;
    if (hoveredTransaction) {
      hoveredTransaction = null;
      if (!activeTransition) drawSettledScene();
      updateSceneSummary();
    }
  }

  function scheduleTooltipHide() {
    clearTooltipHideTimer();
    tooltipHideTimer = window.setTimeout(hideTooltip, TOOLTIP_HIDE_DELAY);
  }

  function moveTooltip(event) {
    const offset = 14;
    const bounds = tooltip.getBoundingClientRect();
    const left = Math.min(
      event.clientX + offset,
      window.innerWidth - bounds.width - 8
    );
    const top = Math.min(
      event.clientY + offset,
      window.innerHeight - bounds.height - 8
    );
    tooltip.style.left = `${Math.max(8, left)}px`;
    tooltip.style.top = `${Math.max(8, top)}px`;
  }

  function showTooltip(event, transaction) {
    clearTooltipHideTimer();
    tooltip.replaceChildren();

    const { labels } = normalizedOptions;
    const definitionList = document.createElement("dl");
    const fields = [
      [labels.fee, `${formatNumber(transaction.fee)} sats`],
      [labels.feeRate, `${formatNumber(transaction.feeRate, 2)} sat/vB`],
      [labels.virtualSize, `${formatNumber(transaction.virtualSize)} vB`]
    ];
    const txidTerm = document.createElement("dt");
    const txidDefinition = document.createElement("dd");
    txidTerm.textContent = labels.transaction;

    if (normalizedBaseUrl) {
      const link = document.createElement("a");
      link.href = `${normalizedBaseUrl}/${transaction.txid}`;
      link.textContent = shortenTxid(transaction.txid);
      txidDefinition.append(link);
    } else {
      txidDefinition.textContent = shortenTxid(transaction.txid);
    }

    definitionList.append(txidTerm, txidDefinition);

    fields.forEach(([label, value]) => {
      const term = document.createElement("dt");
      const definition = document.createElement("dd");
      term.textContent = label;
      definition.textContent = value;
      definitionList.append(term, definition);
    });

    tooltip.append(definitionList);
    tooltip.hidden = false;
    moveTooltip(event);
  }

  function showKeyboardTooltip(transaction) {
    const rect = settledScene.rects.find(item => item.tx === transaction);
    if (!rect) return;

    const metrics = gridMetrics();
    const face = gridFace(rect, metrics);
    const canvasBounds = canvas.getBoundingClientRect();
    showTooltip({
      clientX: canvasBounds.left + face.x + face.width / 2,
      clientY: canvasBounds.top + face.y + face.height / 2
    }, transaction);
  }

  function focusTransaction(index) {
    if (!settledScene.rects.length) return;

    const normalizedIndex = (
      index + settledScene.rects.length
    ) % settledScene.rects.length;
    hoveredTransaction = settledScene.rects[normalizedIndex].tx;
    drawSettledScene();
    showKeyboardTooltip(hoveredTransaction);
    canvas.setAttribute(
      "aria-label",
      [
        `${normalizedOptions.labels.transactionGrid}.`,
        `${normalizedOptions.labels.transaction}:`,
        `${shortenTxid(hoveredTransaction.txid)}.`,
        normalizedOptions.labels.keyboardInstructions
      ].join(" ")
    );
  }

  function canvasPointFromEvent(event) {
    const bounds = canvas.getBoundingClientRect();
    const metrics = gridMetrics();
    const localX = (
      (event.clientX - bounds.left) *
      canvasCssWidth /
      bounds.width
    );
    const localY = (
      (event.clientY - bounds.top) *
      canvasCssHeight /
      bounds.height
    );
    return {
      x: (localX - metrics.offsetX) / metrics.cellSize,
      y: (localY - metrics.offsetY) / metrics.cellSize
    };
  }

  function hitTest(x, y) {
    for (let index = settledScene.rects.length - 1; index >= 0; index -= 1) {
      const rect = settledScene.rects[index];
      if (
        x >= rect.x &&
        x <= rect.x + rect.width &&
        y >= rect.y &&
        y <= rect.y + rect.height
      ) {
        return rect.tx;
      }
    }
    return null;
  }

  function handleCanvasPointerMove(event) {
    if (activeTransition) {
      canvas.style.cursor = "default";
      hideTooltip();
      return;
    }

    const point = canvasPointFromEvent(event);
    const transaction = hitTest(point.x, point.y);
    canvas.style.cursor = transaction ? "pointer" : "default";

    if (transaction !== hoveredTransaction) {
      hoveredTransaction = transaction;
      drawSettledScene();
    }

    if (transaction) {
      showTooltip(event, transaction);
    } else {
      hideTooltip();
    }
  }

  function handleCanvasPointerLeave(event) {
    canvas.style.cursor = "default";
    if (event.relatedTarget && tooltip.contains(event.relatedTarget)) return;
    scheduleTooltipHide();
  }

  function selectTransaction(transaction, event) {
    if (!transaction || !normalizedBaseUrl) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey) {
      window.open(
        `${normalizedBaseUrl}/${transaction.txid}`,
        "_blank",
        "noopener,noreferrer"
      );
      return;
    }

    canvas.dispatchEvent(new CustomEvent(blockGridTransactionSelectEvent, {
      bubbles: true,
      detail: { txid: transaction.txid }
    }));
  }

  function handleCanvasClick(event) {
    if (activeTransition) return;

    const point = canvasPointFromEvent(event);
    selectTransaction(hitTest(point.x, point.y), event);
  }

  function handleCanvasFocus() {
    if (!activeTransition && !hoveredTransaction) focusTransaction(0);
  }

  function handleCanvasBlur(event) {
    if (event.relatedTarget && tooltip.contains(event.relatedTarget)) return;
    hideTooltip();
    updateSceneSummary();
  }

  function handleCanvasKeyDown(event) {
    if (activeTransition || !settledScene.rects.length) return;

    const selectedIndex = settledScene.rects.findIndex(
      rect => rect.tx === hoveredTransaction
    );
    const forwardIndex = selectedIndex < 0 ? 0 : selectedIndex + 1;
    const backwardIndex = selectedIndex < 0
      ? settledScene.rects.length - 1
      : selectedIndex - 1;
    const nextIndexByKey = {
      ArrowDown: forwardIndex,
      ArrowLeft: findHorizontalNeighborIndex(
        settledScene.rects,
        selectedIndex,
        -1
      ),
      ArrowRight: findHorizontalNeighborIndex(
        settledScene.rects,
        selectedIndex,
        1
      ),
      ArrowUp: backwardIndex,
      End: settledScene.rects.length - 1,
      Home: 0
    };

    if (Object.prototype.hasOwnProperty.call(nextIndexByKey, event.key)) {
      event.preventDefault();
      focusTransaction(nextIndexByKey[event.key]);
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectTransaction(
        hoveredTransaction || settledScene.rects[0].tx,
        event
      );
    }
  }

  function handleTooltipPointerEnter() {
    clearTooltipHideTimer();
  }

  function handleTooltipPointerLeave(event) {
    if (event.relatedTarget === canvas) return;
    hideTooltip();
  }

  function handleTooltipFocusOut(event) {
    if (event.relatedTarget === canvas) return;
    if (event.relatedTarget && tooltip.contains(event.relatedTarget)) return;
    hideTooltip();
    updateSceneSummary();
  }

  function resizeCanvas() {
    const bounds = canvas.getBoundingClientRect();
    const nextCssWidth = Math.max(
      1,
      canvas.clientWidth || bounds.width || container.clientWidth
    );
    const nextCssHeight = Math.max(
      1,
      canvas.clientHeight ||
        bounds.height ||
        container.clientHeight ||
        nextCssWidth
    );
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    const pixelWidth = Math.max(1, Math.round(nextCssWidth * pixelRatio));
    const pixelHeight = Math.max(1, Math.round(nextCssHeight * pixelRatio));
    const nextGridDimensions = gridDimensionsForSize(
      nextCssWidth,
      nextCssHeight,
      normalizedOptions.cellsPerSide
    );
    const gridDimensionsChanged = !sameGridDimensions(
      gridDimensions,
      nextGridDimensions
    );

    canvasCssWidth = nextCssWidth;
    canvasCssHeight = nextCssHeight;
    gridDimensions = nextGridDimensions;
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    return gridDimensionsChanged;
  }

  function repackForGridDimensions() {
    clearTooltipHideTimer();
    tooltip.hidden = true;
    hoveredTransaction = null;
    canvas.style.cursor = "default";

    if (activeTransition) {
      activeTransition.from = createScene(
        activeTransition.from.transactions,
        gridDimensions,
        normalizedOptions.weightLimit
      );
      activeTransition.to = createScene(
        activeTransition.to.transactions,
        gridDimensions,
        normalizedOptions.weightLimit
      );
      settledScene = activeTransition.from;
      updateSceneSummary();
      return;
    }

    settledScene = createScene(
      settledScene.transactions,
      gridDimensions,
      normalizedOptions.weightLimit
    );
    updateSceneSummary();
  }

  function drawTransition(timestamp) {
    if (!activeTransition) return false;
    if (activeTransition.startedAt === null) {
      activeTransition.startedAt = timestamp;
    }

    const elapsed = Math.min(
      timestamp - activeTransition.startedAt,
      TRANSITION_DURATION
    );
    clearCanvas();

    if (elapsed < EXIT_DURATION) {
      drawPlaceholderFaces(activeTransition.from);
      drawSceneFaces(
        activeTransition.from,
        () => outgoingRectState(elapsed)
      );
    } else {
      drawPlaceholderFaces(activeTransition.to);
    }

    if (elapsed >= ENTER_START) {
      drawSceneFaces(
        activeTransition.to,
        () => incomingRectState(elapsed - ENTER_START)
      );
    }

    return elapsed >= TRANSITION_DURATION;
  }

  function cancelTransition() {
    if (transitionFrameId !== null) {
      window.cancelAnimationFrame(transitionFrameId);
    }
    transitionFrameId = null;
    activeTransition = null;
    queuedTransactions = null;
  }

  function startTransition(nextScene) {
    hideTooltip();
    canvas.style.cursor = "default";
    activeTransition = {
      from: settledScene,
      to: nextScene,
      startedAt: null
    };
    transitionFrameId = window.requestAnimationFrame(stepTransition);
  }

  function finishTransition() {
    settledScene = activeTransition.to;
    activeTransition = null;
    transitionFrameId = null;
    updateSceneSummary();
    drawSettledScene();

    if (queuedTransactions) {
      const nextTransactions = queuedTransactions;
      queuedTransactions = null;
      startTransition(
        createScene(
          nextTransactions,
          gridDimensions,
          normalizedOptions.weightLimit
        )
      );
    }
  }

  function stepTransition(timestamp) {
    if (!activeTransition) return;
    if (drawTransition(timestamp)) {
      finishTransition();
      return;
    }
    transitionFrameId = window.requestAnimationFrame(stepTransition);
  }

  function handleResize() {
    if (destroyed) return;
    const gridDimensionsChanged = resizeCanvas();
    if (gridDimensionsChanged) repackForGridDimensions();
    if (activeTransition) {
      drawTransition(window.performance.now());
    } else {
      drawSettledScene();
    }
  }

  canvas.addEventListener("pointermove", handleCanvasPointerMove);
  canvas.addEventListener("pointerleave", handleCanvasPointerLeave);
  canvas.addEventListener("click", handleCanvasClick);
  canvas.addEventListener("focus", handleCanvasFocus);
  canvas.addEventListener("blur", handleCanvasBlur);
  canvas.addEventListener("keydown", handleCanvasKeyDown);
  tooltip.addEventListener("pointerenter", handleTooltipPointerEnter);
  tooltip.addEventListener("pointerleave", handleTooltipPointerLeave);
  tooltip.addEventListener("focusout", handleTooltipFocusOut);
  window.addEventListener("resize", handleResize);

  const resizeObserver = typeof ResizeObserver === "function"
    ? new ResizeObserver(handleResize)
    : null;
  if (resizeObserver) resizeObserver.observe(container);

  const handle = {
    update(nextTransactions) {
      if (destroyed) {
        throw new Error("Cannot update a destroyed block grid.");
      }

      const normalizedTransactions = normalizeTransactions(nextTransactions);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        cancelTransition();
        hideTooltip();
        settledScene = createScene(
          normalizedTransactions,
          gridDimensions,
          normalizedOptions.weightLimit
        );
        updateSceneSummary();
        drawSettledScene();
        return;
      }

      if (activeTransition) {
        queuedTransactions = normalizedTransactions;
        return;
      }

      startTransition(
        createScene(
          normalizedTransactions,
          gridDimensions,
          normalizedOptions.weightLimit
        )
      );
    },

    destroy() {
      if (destroyed) return;
      destroyed = true;
      cancelTransition();
      clearTooltipHideTimer();
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      canvas.removeEventListener("pointermove", handleCanvasPointerMove);
      canvas.removeEventListener("pointerleave", handleCanvasPointerLeave);
      canvas.removeEventListener("click", handleCanvasClick);
      canvas.removeEventListener("focus", handleCanvasFocus);
      canvas.removeEventListener("blur", handleCanvasBlur);
      canvas.removeEventListener("keydown", handleCanvasKeyDown);
      tooltip.removeEventListener("pointerenter", handleTooltipPointerEnter);
      tooltip.removeEventListener("pointerleave", handleTooltipPointerLeave);
      tooltip.removeEventListener("focusout", handleTooltipFocusOut);

      if (mountedInstances.get(container) === handle) {
        mountedInstances.delete(container);
        container.replaceChildren();
        if (!hadComponentClass) container.classList.remove("block-grid");
      }
    }
  };

  mountedInstances.set(container, handle);
  updateSceneSummary();
  handleResize();
  return handle;
}
