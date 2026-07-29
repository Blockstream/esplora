import {
  averageNativeSegwitTransactionSize,
  satoshisPerBitcoin,
} from "../const";
import { ElapsedTime } from "../components/elapsed-time";
import { InfoCard } from "../components/info-card";
import { MempoolCongestion } from "../components/mempool-congestion";
import { ReferenceLineChart } from "../components/reference-line-chart";

const staticRoot = process.env.STATIC_ROOT || "";

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

const getLatestPrice = (marketChart) => {
  const prices = getBitcoinPrices(marketChart);
  return prices.length ? prices[prices.length - 1] : null;
};

export const overview = ({
  blocks,
  feeEst,
  mempool,
  bitcoinMarketChart,
  t,
} = {}) => {
  const latestBlock = blocks && blocks[0];
  const chartPrices = getChartPrices(bitcoinMarketChart);
  const currentBitcoinPrice = getLatestPrice(bitcoinMarketChart);
  const recommendedFeeUsd = estimateNativeSegwitFeeUsd(
    currentBitcoinPrice,
    feeEst,
  );
  return (
    <div className="overview">
      <p className="section-title">{t`Overview`}</p>
      <div className="overview-body">
        <InfoCard
          title={t`Time since last block`}
          tooltip={t`Elapsed time since the last block confirmed. Bitcoin targets one every ~10 minutes.`}
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
          value={formatRecommendedFee(feeEst)}
          footer={recommendedFeeUsd}
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
