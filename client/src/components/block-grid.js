import { blockGridLoadingDelayMs, maxBlockWeight } from "../const";
import { clamp } from "../lib/math";

const GRID_LENGTH = 15;
const LOADING_GRID_LENGTH = 5;

const drawBlockGrid = (canvas, blockWeight, weightLimit) => {
  if (
    typeof HTMLCanvasElement === "undefined" ||
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const width = rect.width;
  const height = rect.height;
  const gap = 2;
  const cellWidth = (width - gap * (GRID_LENGTH - 1)) / GRID_LENGTH;
  const cellHeight = (height - gap * (GRID_LENGTH - 1)) / GRID_LENGTH;
  const hasUtilization =
    Number.isFinite(blockWeight) &&
    Number.isFinite(weightLimit) &&
    weightLimit > 0;
  const fillRatio = hasUtilization
    ? clamp(blockWeight / weightLimit, 0, 1)
    : 0;
  const filledCells = Math.round(fillRatio * GRID_LENGTH * GRID_LENGTH);
  const styles = window.getComputedStyle(canvas);
  const emptyColor =
    styles.getPropertyValue("--block-grid-empty-color").trim() || "#141414";
  const filledColor = styles
    .getPropertyValue("--block-grid-filled-color")
    .trim() || "#FA8A00";

  canvas.width = Math.max(1, Math.round(width * dpr));
  canvas.height = Math.max(1, Math.round(height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, width, height);

  for (let index = 0; index < GRID_LENGTH * GRID_LENGTH; index += 1) {
    const row = Math.floor(index / GRID_LENGTH);
    const column = index % GRID_LENGTH;

    ctx.fillStyle = index < filledCells ? filledColor : emptyColor;
    ctx.fillRect(
      column * (cellWidth + gap),
      row * (cellHeight + gap),
      cellWidth,
      cellHeight,
    );
  }
};

const drawGrid = (vnode, blockWeight, weightLimit) => {
  const draw = () => drawBlockGrid(vnode.elm, blockWeight, weightLimit);

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(draw);
    return;
  }

  draw();
};

const BlockGridLoading = ({ label, loadingDelayMs }) => (
  <div
    className="block-details-card-grid-loading"
    role="status"
    aria-label={label}
    style={{ animationDelay: `${loadingDelayMs}ms` }}
  >
    <div className="pending-block-grid-loading-wave" aria-hidden="true">
      {Array.from({
        length: LOADING_GRID_LENGTH * LOADING_GRID_LENGTH,
      }).map((_, index) => {
        const row = Math.floor(index / LOADING_GRID_LENGTH);
        const column = index % LOADING_GRID_LENGTH;

        return (
          <span
            key={index}
            style={{ animationDelay: `${(row + column) * 70}ms` }}
          ></span>
        );
      })}
    </div>
  </div>
);

export const BlockGrid = ({
  formatAriaLabel = (percentage) =>
    `Block is ${percentage}% full`,
  blockWeight,
  loading = true,
  loadingLabel = "Loading block utilization",
  loadingDelayMs = blockGridLoadingDelayMs,
  unavailableLabel = "Block utilization unavailable",
  weightLimit = maxBlockWeight,
} = {}) => {
  const hasBlockWeightLimit = Number.isFinite(weightLimit) && weightLimit > 0;
  const hasBlockWeight = Number.isFinite(blockWeight) && hasBlockWeightLimit;
  const percentage = hasBlockWeight
    ? clamp(
        Math.round((blockWeight / weightLimit) * 10_000) / 100,
        0,
        100,
      )
    : 0;

  return (
    <div className="block-details-card-grid">
      <canvas
        aria-label={
          hasBlockWeight
            ? formatAriaLabel(percentage)
            : loading
              ? loadingLabel
              : unavailableLabel
        }
        role="img"
        hook-insert={(vnode) => drawGrid(vnode, blockWeight, weightLimit)}
        hook-postpatch={(_, vnode) =>
          drawGrid(vnode, blockWeight, weightLimit)
        }
      ></canvas>
      {!hasBlockWeight && loading ? (
        <BlockGridLoading
          label={loadingLabel}
          loadingDelayMs={loadingDelayMs}
        />
      ) : null}
      {!hasBlockWeight && !loading ? (
        <div className="block-details-card-grid-unavailable" role="status">
          {unavailableLabel}
        </div>
      ) : null}
    </div>
  );
};
