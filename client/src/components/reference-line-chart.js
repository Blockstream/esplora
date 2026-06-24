const REQUIRED_POINT_COUNT = 24;

const drawReferenceLine = (canvas, numbers) => {
  if (
    typeof HTMLCanvasElement === "undefined" ||
    !(canvas instanceof HTMLCanvasElement)
  ) {
    return;
  }

  const ctx = canvas.getContext("2d");
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, rect.width, rect.height);

  const width = rect.width;
  const height = rect.height;
  const shortestSide = Math.min(width, height);
  const clamp = (value, minValue, maxValue) =>
    Math.min(Math.max(value, minValue), maxValue);
  const lineWidth = Math.min(
    clamp(shortestSide * 0.012, 1.5, 4),
    Math.max(1, shortestSide * 0.05),
  );
  const glowRadius = Math.min(
    clamp(shortestSide * 0.12, 8, 34),
    Math.max(2, shortestSide * 0.18),
  );
  const ringRadius = Math.min(
    clamp(shortestSide * 0.045, 4, 13),
    Math.max(2, shortestSide * 0.08),
  );
  const markerInset = glowRadius + lineWidth;
  const topPad = Math.max(height * 0.17, markerInset);
  const bottomPad = Math.max(height * 0.2, markerInset);
  const leftPad = Math.max(width * 0.02, lineWidth);
  const rightPad = Math.max(width * 0.02, markerInset);
  const chartWidth = Math.max(1, width - leftPad - rightPad);
  const chartHeight = Math.max(1, height - topPad - bottomPad);
  const min = Math.min(...numbers);
  const max = Math.max(...numbers);
  const range = max - min || 1;
  const points = numbers.map((value, index) => {
    const x = leftPad + (chartWidth * index) / (numbers.length - 1);
    const normalized = (value - min) / range;
    const y = topPad + chartHeight * (1 - normalized);
    return { x, y };
  });

  const baseline = height - bottomPad;
  const line = new Path2D();
  line.moveTo(points[0].x, points[0].y);

  for (let i = 0; i < points.length - 1; i += 1) {
    const current = points[i];
    const next = points[i + 1];
    const midpointX = (current.x + next.x) / 2;
    line.bezierCurveTo(midpointX, current.y, midpointX, next.y, next.x, next.y);
  }

  const fill = new Path2D(line);
  fill.lineTo(points[points.length - 1].x, baseline);
  fill.lineTo(points[0].x, baseline);
  fill.closePath();

  const gradient = ctx.createLinearGradient(0, topPad, 0, baseline);
  gradient.addColorStop(0, "rgba(255, 148, 24, 0.48)");
  gradient.addColorStop(0.45, "rgba(255, 148, 24, 0.18)");
  gradient.addColorStop(1, "rgba(255, 148, 24, 0.00)");

  ctx.fillStyle = gradient;
  ctx.fill(fill);

  ctx.lineWidth = lineWidth;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ff9418";
  ctx.shadowBlur = Math.max(6, width * 0.01);
  ctx.shadowColor = "rgba(255, 148, 24, 0.18)";
  ctx.stroke(line);
  ctx.shadowBlur = 0;

  const last = points[points.length - 1];

  ctx.beginPath();
  ctx.arc(last.x, last.y, glowRadius, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 148, 24, 0.42)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(last.x, last.y, ringRadius, 0, Math.PI * 2);
  ctx.fillStyle = "#1b1b1b";
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = "#ff9418";
  ctx.stroke();
};

const drawChart = (vnode, values) => {
  if (
    !Array.isArray(values) ||
    values.length !== REQUIRED_POINT_COUNT ||
    values.some((value) => !Number.isFinite(value))
  ) {
    return;
  }

  const draw = () => drawReferenceLine(vnode.elm, values);

  if (typeof window !== "undefined" && window.requestAnimationFrame) {
    window.requestAnimationFrame(draw);
    return;
  }

  draw();
};

export const ReferenceLineChart = ({
  values,
  className,
  id,
  ariaLabel = "Line chart",
} = {}) => {
  const drawChartOnInsert = (vnode) => drawChart(vnode, values);
  const drawChartOnPatch = (_, vnode) => drawChart(vnode, values);

  return (
    <div className={className}>
      <canvas
        id={id}
        aria-label={ariaLabel}
        role="img"
        hook-insert={drawChartOnInsert}
        hook-postpatch={drawChartOnPatch}
      ></canvas>
    </div>
  );
};
