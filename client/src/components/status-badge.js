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

export const ConfidentialBadge = ({ t }) => (
  <StatusBadge variant="success">{t`Confidential`}</StatusBadge>
);
