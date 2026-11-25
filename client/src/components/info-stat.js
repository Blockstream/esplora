export const InfoStat = ({ title, value, valueTitle } = {}) => (
  <div className="info-stat">
    <div className="info-stat-title">{title}</div>
    <div className="info-stat-value" attrs={valueTitle ? { title: valueTitle } : {}}>{value}</div>
  </div>
);
