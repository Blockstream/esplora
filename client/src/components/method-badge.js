export const MethodBadge = ({ method, label = method }) =>
  <span className={`method-badge method-badge-${method.toLowerCase()}`}>{label}</span>
