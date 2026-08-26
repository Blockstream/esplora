import { feeEstimateTargets } from "../const";
import { ElapsedTime } from "../components/elapsed-time";
import { InfoCard } from "../components/info-card";
import { MempoolCongestion } from "../components/mempool-congestion";
import { ReferenceLineChart } from "../components/reference-line-chart";
import { estimateTypicalTransactionFeeUsd } from "../lib/fees";
import { isBitcoinNetwork } from "../lib/network";
import {
  getBitcoinPrices,
  getLatestBitcoinPrice,
} from "../lib/market";
import { formatFeeRate, formatUsd } from "./util";

const staticRoot = process.env.STATIC_ROOT || "";

const getPercentDelta = (chartPrices, unavailable = "N/A") => {
  if (!Array.isArray(chartPrices) || chartPrices.length < 2) {
    return unavailable;
  }

  const startingPrice = chartPrices[0];
  const endingPrice = chartPrices[chartPrices.length - 1];

  if (
    !Number.isFinite(startingPrice) ||
    startingPrice === 0 ||
    !Number.isFinite(endingPrice)
  ) {
    return unavailable;
  }

  const priceDeltaPercentage =
    ((endingPrice - startingPrice) / startingPrice) * 100;

  if (!Number.isFinite(priceDeltaPercentage)) {
    return unavailable;
  }

  const formattedPercentage = priceDeltaPercentage.toFixed(2);

  if (priceDeltaPercentage < 0) {
    return <span className="text-danger">{`${formattedPercentage}%`}</span>;
  }

  return <span className="text-success">{`+${formattedPercentage}%`}</span>;
};

const getChartPrices = (marketChart) =>
  getBitcoinPrices(marketChart).slice(-24);

export const overview = ({
  blocks,
  feeEst,
  mempool,
  bitcoinMarketChart,
  t,
} = {}) => {
  const latestBlock = blocks && blocks[0];
  const chartPrices = getChartPrices(bitcoinMarketChart);
  const currentBitcoinPrice = getLatestBitcoinPrice(bitcoinMarketChart);
  const recommendedFeerate =
    feeEst && feeEst[feeEstimateTargets.average];
  const recommendedFeeUsd = estimateTypicalTransactionFeeUsd(
    currentBitcoinPrice,
    recommendedFeerate,
  );
  return (
    <div className="overview">
      <p className="section-title">{t`Overview`}</p>
      <div className="overview-body">
        <InfoCard
          title={t`Time Since Last Block`}
          tooltip={
            isBitcoinNetwork
              ? t`Elapsed time since the last block confirmed. Bitcoin targets one every ~10 minutes.`
              : t`Elapsed time since the last block confirmed. Liquid targets one every ~1 minute.`
          }
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
          title={t`Recommended Fee`}
          tooltip={t`Suggested rate (sat/vB) to confirm in the next block or two.`}
          value={formatFeeRate(recommendedFeerate, t`N/A`)}
          footer={formatUsd(recommendedFeeUsd, t`N/A`)}
        />

        <InfoCard
          title={t`Mempool Congestion`}
          tooltip={t`How busy mempool activity is. More congestion means higher fees for quick confirmation.`}
          body={
            <MempoolCongestion
              mempool={mempool}
              t={t}
            />
          }
        />

        <InfoCard
          title={t`Bitcoin`}
          iconSrc={`${staticRoot}img/icons/Bitcoin-menu-logo.svg`}
          headerValue={
            <span className="overview-bitcoin-price-chart-header-value">
              <span>{formatUsd(currentBitcoinPrice, t`N/A`)}</span>
              {getPercentDelta(chartPrices, t`N/A`)}
            </span>
          }
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
