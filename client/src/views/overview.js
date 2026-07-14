import {
  averageNativeSegwitTransactionSize,
  satoshisPerBitcoin,
} from "../const";
import { ElapsedTime } from "../components/elapsed-time";
import { InfoCard } from "../components/info-card";
import { ReferenceLineChart } from "../components/reference-line-chart";

const staticRoot = process.env.STATIC_ROOT || "";
const DEFAULT_MEMPOOL_LIMIT_BYTES = 300 * 1000 * 1000;

const getBitcoinPrices = (marketChart) =>
  ((marketChart && marketChart.prices) || [])
    .map((price) => price && price[1])
    .filter(Number.isFinite);

const getChartPrices = (marketChart) =>
  getBitcoinPrices(marketChart).slice(-24);

const formatUsd = (value) =>
  Number.isFinite(value)
    ? `$${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} USD`
    : "";

const formatRecommendedFee = (feeEst) =>
  feeEst && Number.isFinite(feeEst[3]) ? `${feeEst[3].toFixed(1)} sat/vB` : "";

const estimateNativeSegwitFeeUsd = (bitcoinPrice, feeEst) =>
  Number.isFinite(bitcoinPrice) && feeEst && Number.isFinite(feeEst[3])
    ? formatUsd(
        (bitcoinPrice / satoshisPerBitcoin) *
          feeEst[3] *
          averageNativeSegwitTransactionSize,
      )
    : "";

const getMempoolUsage = (mempool) =>
  mempool && Number.isFinite(mempool.vsize)
    ? Math.max(0, Math.min(1, mempool.vsize / DEFAULT_MEMPOOL_LIMIT_BYTES))
    : 0;

const MEMPOOL_CONGESTION_LEVEL = {
  LOW: "Low",
  MODERATE: "Moderate",
  HIGH: "High",
};

const getMempoolCongestionLevel = (usage) => {
  if (usage < 1 / 3) {
    return MEMPOOL_CONGESTION_LEVEL.LOW;
  }

  if (usage < 2 / 3) {
    return MEMPOOL_CONGESTION_LEVEL.MODERATE;
  }

  return MEMPOOL_CONGESTION_LEVEL.HIGH;
};

const CONGESTION_CLASS_BY_LEVEL = {
  [MEMPOOL_CONGESTION_LEVEL.LOW]: "success",
  [MEMPOOL_CONGESTION_LEVEL.MODERATE]: "warning",
  [MEMPOOL_CONGESTION_LEVEL.HIGH]: "danger",
};

const getMempoolCongestionClass = (level) =>
  CONGESTION_CLASS_BY_LEVEL[level] || "";

const getLatestPrice = (marketChart) => {
  const prices = getBitcoinPrices(marketChart);
  return prices.length ? prices[prices.length - 1] : null;
};

export const overview = ({
  blocks,
  feeEst,
  mempool,
  bitcoinMarketChart,
} = {}) => {
  const latestBlock = blocks && blocks[0];
  const chartPrices = getChartPrices(bitcoinMarketChart);
  const currentBitcoinPrice = getLatestPrice(bitcoinMarketChart);
  const recommendedFeeUsd = estimateNativeSegwitFeeUsd(
    currentBitcoinPrice,
    feeEst,
  );
  const mempoolUsage = getMempoolUsage(mempool);
  const mempoolUsagePercent = Math.round(mempoolUsage * 10000) / 100;
  const mempoolCongestionLevel = mempool
    ? getMempoolCongestionLevel(mempoolUsage)
    : "";
  const mempoolCongestionClass = getMempoolCongestionClass(
    mempoolCongestionLevel,
  );

  return (
    <div className="overview">
      <p className="overview-title">Overview</p>
      <div className="overview-body">
        <InfoCard
          title="Time since last block"
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: "Elapsed time since the last block confirmed. Bitcoin targets one every ~10 minutes.",
          }}
          value={
            latestBlock ? (
              <ElapsedTime timestamp={latestBlock.timestamp} compact />
            ) : (
              ""
            )
          }
          footer={
            latestBlock ? `BLOCK #${latestBlock.height.toLocaleString()}` : ""
          }
        />

        <InfoCard
          title="Recommended Fee"
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: "Suggested rate (sat/vB) to confirm in the next block or two.",
          }}
          value={formatRecommendedFee(feeEst)}
          footer={recommendedFeeUsd}
        />

        <InfoCard
          title="Mempool Congestion"
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: "How busy mempool activity is. More congestion means higher fees for quick confirmation.",
          }}
          body={
            <div className="mempool-congestion">
              <div
                className={`mempool-congestion-badge ${mempoolCongestionClass}`}
              >
                {mempoolCongestionLevel}
              </div>
              <div className="mempool-congestion-bar">
                <div
                  className={`mempool-congestion-fill ${mempoolCongestionClass}`}
                  style={{ width: `${mempoolUsagePercent}%` }}
                ></div>
              </div>
              <div className="mempool-congestion-labels">
                <p>LOW</p>
                <p>HIGH</p>
              </div>
            </div>
          }
        />

        <InfoCard
          title="Bitcoin"
          iconSrc={`${staticRoot}img/icons/Bitcoin-menu-logo.svg`}
          headerValue={formatUsd(currentBitcoinPrice)}
          body={
            <ReferenceLineChart
              className="overview-bitcoin-price-chart"
              id="lineChart"
              ariaLabel="Bitcoin price line chart"
              values={chartPrices}
            />
          }
        />
      </div>
    </div>
  );
};
