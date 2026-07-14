import { Tooltip } from "./tooltip";

export const InfoCard = ({
  title,
  tooltip,
  iconSrc,
  headerValue,
  value,
  footer,
  body,
  className,
} = {}) => (
  <div
    className={
      className ? `info-card-container ${className}` : "info-card-container"
    }
  >
    <div className="info-card-header">
      {iconSrc ? <img className="menu-logo" alt="" src={iconSrc} /> : null}
      <p className="info-card-title">{title}</p>
      {tooltip ? <Tooltip iconSrc={tooltip.iconSrc} text={tooltip.text} /> : null}
      {headerValue !== undefined ? (
        <p className="info-card-header-value">{headerValue}</p>
      ) : null}
    </div>
    {value !== undefined ? <p className="info-card-value">{value}</p> : null}
    {footer !== undefined ? <p className="info-card-footer">{footer}</p> : null}
    {body}
  </div>
);
