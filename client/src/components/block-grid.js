import { maxBlockWeight } from "../const";

const GRID_LENGTH = 15;

const drawBlockGrid = (canvas, blockWeight) => {
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
  const fillRatio = Number.isFinite(blockWeight)
    ? Math.min(Math.max(blockWeight / maxBlockWeight, 0), 1)
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

const drawGrid = (vnode, blockWeight) => {
  const draw = () => drawBlockGrid(vnode.elm, blockWeight);

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(draw);
    return;
  }

  draw();
};

export const BlockGrid = ({ blockWeight } = {}) => {
  const hasBlockWeight = Number.isFinite(blockWeight);
  const percentage = hasBlockWeight
    ? Math.min(
        Math.max(
          Math.round((blockWeight / maxBlockWeight) * 10_000) / 100,
          0,
        ),
        100,
      )
    : 0;

  return (
    <div className="block-details-card-grid">
      <canvas
        aria-label={
          hasBlockWeight
            ? `Block is ${percentage}% full`
            : "Block utilization unavailable"
        }
        role="img"
        hook-insert={(vnode) => drawGrid(vnode, blockWeight)}
        hook-postpatch={(_, vnode) => drawGrid(vnode, blockWeight)}
      ></canvas>
    </div>
  );
};
