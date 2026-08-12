import { InfoCard } from "../components/info-card";
import { feeEstimateTargets } from "../const";
import { estimateTypicalTransactionFeeUsd } from "../lib/fees";
import { getLatestBitcoinPrice } from "../lib/market";
import { formatFeeRate, formatUsd } from "./util";

const getFeeMarketLevels = (t) => [
  {
    key: "low",
    title: t`Low`,
    tooltip: t`A lower-priority fee rate estimated to confirm within ${feeEstimateTargets.low} blocks.`,
  },
  {
    key: "average",
    title: t`Average`,
    tooltip: t`A balanced fee rate estimated to confirm within ${feeEstimateTargets.average} blocks.`,
  },
  {
    key: "high",
    title: t`High`,
    tooltip: t`A higher-priority fee rate estimated to confirm in the next block.`,
  },
];

export const feeMarket = ({ feeEst, bitcoinMarketChart, t } = {}) => {
  const bitcoinPrice = getLatestBitcoinPrice(bitcoinMarketChart);
  const unavailable = t`N/A`;

  return (
    <div className="fee-market">
      <p className="section-title">{t`Fee Market`}</p>
      <div className="fee-market-body">
        {getFeeMarketLevels(t).map(({ key, title, tooltip }) => {
          const feerate = feeEst && feeEst[feeEstimateTargets[key]];
          const feeUsd = estimateTypicalTransactionFeeUsd(
            bitcoinPrice,
            feerate,
          );

          return (
            <InfoCard
              className={`fee-market-${key}`}
              title={title}
              tooltip={tooltip}
              value={formatFeeRate(feerate, unavailable)}
              footer={formatUsd(feeUsd, unavailable)}
            />
          );
        })}
      </div>
    </div>
  );
};
