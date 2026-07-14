import { formatSat, formatNumber, formatTime, truncateTxid } from "./util";
import loader from "../components/loading";
import { InfoCard } from "../components/info-card";
import { ArrowsInSimpleIcon } from "../components/icons";
import { StatusBadge } from "../components/status-badge";
import { InfoStat } from "../components/info-stat";
import { Tooltip } from "../components/tooltip";
import { getConfEstimate } from "../lib/fees";
import { getPegAccounting } from "../lib/peg";
import { calculateFeerates } from "../util";
import {
  nativeAssetId,
  satoshisPerBitcoin,
  targetBlockIntervalSeconds,
} from "../const";

const staticRoot = process.env.STATIC_ROOT || "";
const ratioMiddleBound = 100;
const minimumRatioHalfRange = 0.1;
const ratioScaleIncrement = 0.1;
const ratioScaleHeadroom = 0.05;
const recentPegTransactionLimit = 4;

const getPegTypes = (tx) => {
  const pegTypes = [];
  if (tx.vin && tx.vin.some((vin) => vin.is_pegin)) pegTypes.push("peg-in");
  if (tx.vout && tx.vout.some((vout) => vout.pegout)) pegTypes.push("peg-out");
  return pegTypes;
};

const sumValues = (outputs) =>
  outputs.length && outputs.every((output) => Number.isFinite(output.value))
    ? outputs.reduce((sum, output) => sum + output.value, 0)
    : null;

const getPegInAmount = (tx) => {
  const outputs = tx.vout || [];
  const regularInputs = (tx.vin || []).filter((vin) => !vin.is_pegin);
  const hasUnknownOutputAsset = outputs.some(
    (output) => output.assetcommitment && !output.asset,
  );
  const hasUnknownInput = regularInputs.some(
    (vin) =>
      !vin.prevout ||
      (vin.prevout.assetcommitment && !vin.prevout.asset) ||
      (vin.prevout.asset == nativeAssetId &&
        !Number.isFinite(vin.prevout.value)),
  );
  if (hasUnknownOutputAsset || hasUnknownInput) return null;

  const nativeOutputAmount = sumValues(
    outputs.filter((output) => output.asset == nativeAssetId),
  );
  const nativeInputAmount = regularInputs
    .map((vin) => vin.prevout)
    .filter((output) => output.asset == nativeAssetId)
    .reduce((sum, output) => sum + output.value, 0);

  return Number.isFinite(nativeOutputAmount) && nativeOutputAmount >= nativeInputAmount
    ? nativeOutputAmount - nativeInputAmount
    : null;
};

const getPegAmount = (tx, pegType) => {
  const outputs = tx.vout || [];
  return pegType == "peg-in"
    ? getPegInAmount(tx)
    : sumValues(outputs.filter((output) => output.pegout));
};

const getRatioScale = (ratio) => {
  const ratioDistance = Number.isFinite(ratio)
    ? Math.abs(ratio - ratioMiddleBound)
    : 0;
  const halfRange = Math.max(
    minimumRatioHalfRange,
    Math.ceil(
      (ratioDistance + ratioScaleHeadroom) / ratioScaleIncrement,
    ) * ratioScaleIncrement,
  );
  const lowerBound = ratioMiddleBound - halfRange;
  const upperBound = ratioMiddleBound + halfRange;
  const fill = Number.isFinite(ratio)
    ? Math.min(
        100,
        Math.max(0, ((ratio - lowerBound) / (upperBound - lowerBound)) * 100),
      )
    : 0;

  return { lowerBound, upperBound, fill };
};

const formatRatioBound = (ratio) => `${ratio.toFixed(1)}%`;

const getLastConfirmationTime = (txs) =>
  txs.reduce(
    (latest, tx) =>
      tx.status && Number.isFinite(tx.status.block_time)
        ? Math.max(latest, tx.status.block_time)
        : latest,
    0,
  );

const formatStatAmount = (value, t) =>
  Number.isFinite(value) ? formatSat(value) : t`N/A`;

const formatFederationAssets = (value, t) =>
  Number.isFinite(value) ? formatSat(value, "BTC") : t`N/A`;

const formatVolumeAmount = (value, t) => {
  if (!Number.isFinite(value)) return t`N/A`;

  const amount = (value / satoshisPerBitcoin).toFixed(2);
  return `~${formatNumber(amount)}`;
};

const getConfirmationEta = (tx, feeEst, t) => {
  if (!tx.status) return t`N/A`;
  if (tx.status.confirmed) return t`Confirmed`;
  if (!feeEst) return t`N/A`;

  const { effectiveFeerate } = calculateFeerates(tx, null, feeEst);
  if (effectiveFeerate == null) return t`N/A`;

  const confirmationBlocks = getConfEstimate(feeEst, effectiveFeerate);
  if (confirmationBlocks == -1) return t`Unknown`;

  const confirmationMinutes =
    Number(confirmationBlocks) * targetBlockIntervalSeconds / 60;
  return confirmationMinutes < 1
    ? t`< 1 min`
    : t`~${Math.ceil(confirmationMinutes)} min`;
};

export const pegInfo = (asset, txs, { t, feeEst, error }) => {
  if (error && (!asset || !txs)) {
    return (
      <div className="tx-container">
        <div className="table peg-info-unavailable">
          <div className="table-header">
            <div className="table-header-icon-container">
              <ArrowsInSimpleIcon />
            </div>
            <h1 className="table-header-title">{t`Peg Information`}</h1>
          </div>
          <p>{t`Peg data is currently unavailable.`}</p>
        </div>
      </div>
    );
  }
  if (!asset || !txs) return <div className="tx-container">{loader()}</div>;

  const chainStats = asset.chain_stats || {};
  const {
    pegInAmount,
    pegOutAmount,
    federationAssets,
    assetsVsLiabilitiesRatio,
  } = getPegAccounting(chainStats);
  const ratioScale = getRatioScale(assetsVsLiabilitiesRatio);
  const allPegTransactions = txs
    .reduce(
      (entries, tx) => entries.concat(
        getPegTypes(tx).map((pegType) => ({ tx, pegType })),
      ),
      [],
    )
    .sort((a, b) => {
      const aConfirmed = a.tx.status && a.tx.status.confirmed;
      const bConfirmed = b.tx.status && b.tx.status.confirmed;
      return aConfirmed != bConfirmed
        ? aConfirmed ? 1 : -1
        : ((b.tx.status && b.tx.status.block_time) || 0) -
          ((a.tx.status && a.tx.status.block_time) || 0);
    });
  const pegTransactions = allPegTransactions.slice(0, recentPegTransactionLimit);
  const lastConfirmationTime = getLastConfirmationTime(
    allPegTransactions.map(({ tx }) => tx),
  );

  return (
    <div>
      <p className="section-title">{t`Proof of Reserves`}</p>
      <div className="peg-info">
        {error ? (
          <p className="peg-info-stale" role="status">
            {t`Unable to refresh — showing previous data.`}
          </p>
        ) : null}
        <InfoCard
          title={t`Federation BTC Holdings`}
          className="federation-btc-holdings"
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: t`Confirmed peg-ins minus confirmed peg-outs.`,
          }}
          value={formatFederationAssets(federationAssets, t)}
          footer={
            lastConfirmationTime
              ? t`Last change on ${formatTime(lastConfirmationTime, false)}`
              : t`Last change N/A`
          }
        />

        <InfoCard
          title={t`Assets vs Liabilities`}
          className="assets-vs-liabilities"
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: t`Confirmed federation BTC holdings divided by circulating L-BTC supply.`,
          }}
          body={
            <div className="assets-vs-liabilities-body">
              <div className="assets-vs-liabilities-scale">
                <p>{formatRatioBound(ratioScale.lowerBound)}</p>
                <p>{formatRatioBound(ratioMiddleBound)}</p>
                <p>{formatRatioBound(ratioScale.upperBound)}</p>
              </div>
              <div className="assets-vs-liabilities-bar">
                <div
                  className="assets-vs-liabilities-fill"
                  style={{ width: `${ratioScale.fill}%` }}
                ></div>
              </div>
              <p className="assets-vs-liabilities-ratio">
                {Number.isFinite(assetsVsLiabilitiesRatio)
                  ? `${assetsVsLiabilitiesRatio.toFixed(3)}%`
                  : t`N/A`}
              </p>
            </div>
          }
        />

        <div className="table peg-transaction-table">
          <div className="table-header">
            <div className="table-header-icon-container">
              <ArrowsInSimpleIcon />
            </div>
            <h1 className="table-header-title">{t`Recent Peg-Ins/Outs`}</h1>
          </div>

          <div className="info-stats-row">
            <InfoStat
              title={t`PEG-IN`}
              value={
                Number.isFinite(chainStats.peg_in_count)
                  ? <span className="text-success">
                      {formatNumber(chainStats.peg_in_count)}
                    </span>
                  : t`N/A`
              }
            />
            <InfoStat
              title={t`PEG-OUT`}
              value={
                Number.isFinite(chainStats.peg_out_count)
                  ? <span className="text-danger">
                      {formatNumber(chainStats.peg_out_count)}
                    </span>
                  : t`N/A`
              }
            />
            <InfoStat title={t`VOLUME IN`} value={formatVolumeAmount(pegInAmount, t)} />
            <InfoStat title={t`VOLUME OUT`} value={formatVolumeAmount(pegOutAmount, t)} />
          </div>

          <div className="table-title-row">
            <div className="peg-transaction-table-transaction-type">{t`TYPE`}</div>
            <div className="peg-transaction-table-transaction-txid">{t`TXID`}</div>
            <div className="peg-transaction-table-transaction-amount">{t`AMOUNT`}</div>
            <div className="peg-transaction-table-transaction-block">{t`BLOCK`}</div>
            <div className="peg-transaction-table-transaction-eta">
              <span>{t`ETA`}</span>
              <Tooltip
                iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                text={t`Estimated time until the peg transaction is confirmed.`}
              />
            </div>
          </div>

          <div className="peg-transaction-table-body">
            {!pegTransactions.length ? (
              <p>{t`No recent transactions`}</p>
            ) : (
              pegTransactions.map(({ tx, pegType }) => (
                <a key={`${tx.txid}-${pegType}`} href={`tx/${tx.txid}`}>
                  <div className="transaction-table-row">
                    <div className="transaction-table-field peg-transaction-table-transaction-type">
                      <div className="transaction-table-field-label">{t`TYPE`}</div>
                      <div className="transaction-table-field-value">
                        <StatusBadge
                          variant={pegType == "peg-in" ? "success" : "danger"}
                          className={
                            pegType == "peg-in"
                              ? "peg-transaction-table-pegin-badge"
                              : null
                          }
                        >
                          {pegType == "peg-in" ? t`Peg-in` : t`Peg-out`}
                        </StatusBadge>
                      </div>
                    </div>
                    <div className="transaction-table-field peg-transaction-table-transaction-txid">
                      <div className="transaction-table-field-label">{t`TXID`}</div>
                      <div className="transaction-table-field-value">
                        <p>{truncateTxid(tx.txid)}</p>
                      </div>
                    </div>
                    <div className="transaction-table-field peg-transaction-table-transaction-amount">
                      <div className="transaction-table-field-label">{t`AMOUNT`}</div>
                      <div className="transaction-table-field-value">
                        {formatStatAmount(getPegAmount(tx, pegType), t)}
                      </div>
                    </div>
                    <div className="transaction-table-field peg-transaction-table-transaction-block">
                      <div className="transaction-table-field-label">{t`BLOCK`}</div>
                      <div className="transaction-table-field-value">
                        {tx.status && Number.isFinite(tx.status.block_height)
                          ? `#${formatNumber(tx.status.block_height)}`
                          : t`N/A`}
                      </div>
                    </div>
                    <div className="transaction-table-field peg-transaction-table-transaction-eta">
                      <div className="transaction-table-field-label">{t`ETA`}</div>
                      <div className="transaction-table-field-value peg-transaction-eta-badge">
                        {getConfirmationEta(tx, feeEst, t)}
                      </div>
                    </div>
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
