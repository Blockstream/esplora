export const StatusBadge = (
  { variant, className } = {},
  children,
) => (
  <span
    class={["status-badge", variant, className]
      .filter(Boolean)
      .reduce((classes, name) => ({ ...classes, [name]: true }), {})}
  >
    {children}
  </span>
);

export const StatusDot = () => (
  <span className="confirmation-status-dot" aria-hidden="true">
    <span className="confirmation-status-dot-back"></span>
    <span className="confirmation-status-dot-middle"></span>
    <span className="confirmation-status-dot-front"></span>
  </span>
);

export const ConfidentialBadge = ({ t }) => (
  <StatusBadge variant="success">{t`Confidential`}</StatusBadge>
);
