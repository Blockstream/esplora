import { getMempoolCongestion } from "../lib/mempool";

export const MempoolCongestion = ({
  mempool,
  fallback = "",
  t,
} = {}) => {
  const congestion = getMempoolCongestion(mempool);
  const fillPercentage = Math.min(
    Math.max(congestion.percentage, 0),
    100,
  );
  const localizedLevel = {
    Low: t`Low`,
    Moderate: t`Moderate`,
    High: t`High`,
  }[congestion.level];

  return (
    <div className="mempool-congestion">
      <div
        className={[
          "mempool-congestion-badge",
          congestion.className,
        ].join(" ").trim()}
      >
        {localizedLevel || fallback}
      </div>
      <div className="mempool-congestion-bar">
        <div
          className={[
            "mempool-congestion-fill",
            congestion.className,
          ].join(" ").trim()}
          style={{ width: `${fillPercentage}%` }}
        ></div>
      </div>
      <div className="mempool-congestion-labels">
        <p>{t`LOW`}</p>
        <p>{t`HIGH`}</p>
      </div>
    </div>
  );
};
