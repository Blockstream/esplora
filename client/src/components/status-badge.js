export const StatusBadge = (
  { variant, className } = {},
  children,
) => (
  <span
    className={["status-badge", variant, className].filter(Boolean).join(" ")}
  >
    {children}
  </span>
);

export const ConfidentialBadge = ({ t }) => (
  <StatusBadge variant="success">{t`Confidential`}</StatusBadge>
);
