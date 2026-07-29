import { clamp } from "../lib/math";

const clampPercentage = (value) =>
  Number.isFinite(value) ? clamp(value, 0, 100) : 0;

export const MetricBar = ({
  title,
  headerValue,
  fillPercentage,
  fillClass,
}) => (
  <div className="metric-bar-container">
    <div className="metric-bar-header">
      <div className="metric-bar-title">{title}</div>
      <div className="metric-bar-header-value">{headerValue}</div>
    </div>
    <div className="metric-bar-outline">
      <div
        className={
          fillClass
            ? `metric-bar-fill ${fillClass}`
            : "metric-bar-fill"
        }
        style={{ width: `${clampPercentage(fillPercentage)}%` }}
      ></div>
    </div>
  </div>
);
