import { ArrowsInSimpleIcon } from "../components/icons";
import { InfoCard } from "../components/info-card";
import { Tooltip } from "../components/tooltip";
import { difficultyPeriod } from "../const";

const staticRoot = process.env.STATIC_ROOT || "";

const TARGET_BLOCK_SECONDS = 10 * 60;
const HASHES_PER_DIFFICULTY = 2 ** 32;

const getHashrateUnits = (t) => [
  [1e24, "YH/s", t`Yottahashes per second`],
  [1e21, "ZH/s", t`Zettahashes per second`],
  [1e18, "EH/s", t`Exahashes per second`],
  [1e15, "PH/s", t`Petahashes per second`],
  [1e12, "TH/s", t`Terahashes per second`],
  [1e9, "GH/s", t`Gigahashes per second`],
  [1e6, "MH/s", t`Megahashes per second`],
  [1e3, "kH/s", t`Kilohashes per second`],
  [1, "H/s", t`Hashes per second`],
];

const DIFFICULTY_UNITS = [
  [1e15, "Q"],
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
  [1, ""],
];

const formatAdjustment = (value, unavailable) => {
  if (!Number.isFinite(value)) return unavailable;
  if (value === 0) return "0.00%";

  return `${value > 0 ? "+" : ""}${value.toFixed(2)}%`;
};

const adjustmentClass = (value) =>
  value > 0 ? "success" : value < 0 ? "danger" : "";

const getEpochStartHeight = (block) =>
  block && Number.isFinite(block.height)
    ? block.height - (block.height % difficultyPeriod)
    : null;

const getEpochTiming = (latestBlock, epochStartBlock) => {
  const epochStartHeight = getEpochStartHeight(latestBlock);

  if (
    !latestBlock ||
    !epochStartBlock ||
    epochStartBlock.requestedHeight !== epochStartHeight ||
    !Number.isFinite(epochStartBlock.height) ||
    !Number.isFinite(latestBlock.timestamp) ||
    !Number.isFinite(epochStartBlock.timestamp)
  ) {
    return null;
  }

  const blocksMined = latestBlock.height - epochStartBlock.height;
  const actualSeconds = latestBlock.timestamp - epochStartBlock.timestamp;

  if (blocksMined < 0 || actualSeconds < 0) return null;

  const averageBlockSeconds = blocksMined
    ? Math.max(actualSeconds, 1) / blocksMined
    : TARGET_BLOCK_SECONDS;
  const blocksUntilAdjustment =
    difficultyPeriod - (latestBlock.height % difficultyPeriod);
  const secondsUntilAdjustment = blocksUntilAdjustment * averageBlockSeconds;

  return {
    averageBlockSeconds,
    estimatedAdjustmentTimestamp:
      latestBlock.timestamp + secondsUntilAdjustment,
  };
};

const expectedAdjustment = (epochTiming) =>
  epochTiming
    ? (TARGET_BLOCK_SECONDS / epochTiming.averageBlockSeconds - 1) * 100
    : null;

const previousAdjustment = (latestBlock, previousBlock) => {
  const epochStartHeight = getEpochStartHeight(latestBlock);

  if (
    !latestBlock ||
    !previousBlock ||
    !Number.isFinite(epochStartHeight) ||
    previousBlock.requestedHeight !== epochStartHeight - difficultyPeriod ||
    !Number.isFinite(latestBlock.difficulty) ||
    !Number.isFinite(previousBlock.difficulty) ||
    previousBlock.difficulty === 0
  ) {
    return null;
  }

  return (latestBlock.difficulty / previousBlock.difficulty - 1) * 100;
};

const formatBlockTime = (seconds, unavailable, t) => {
  if (!Number.isFinite(seconds)) return unavailable;

  const totalSeconds = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (!minutes) return `${remainingSeconds}${t`s`}`;
  if (remainingSeconds) {
    return `${minutes}${t`m`} ${remainingSeconds}${t`s`}`;
  }

  return `${minutes}${t`m`}`;
};

const formatHashrate = (difficulty, averageBlockSeconds, t, unavailable) => {
  if (
    !Number.isFinite(difficulty) ||
    difficulty < 0 ||
    !Number.isFinite(averageBlockSeconds) ||
    averageBlockSeconds <= 0
  ) {
    return { value: unavailable, footer: t`Hashes per second` };
  }

  const hashrate = (difficulty * HASHES_PER_DIFFICULTY) / averageBlockSeconds;
  const hashrateUnits = getHashrateUnits(t);
  const unit =
    hashrateUnits.find(([threshold]) => hashrate >= threshold) ||
    hashrateUnits[hashrateUnits.length - 1];
  const [divisor, symbol, footer] = unit;
  const value = (hashrate / divisor).toLocaleString("en-US", {
    maximumSignificantDigits: 3,
  });

  return { value: `${value} ${symbol}`, footer };
};

const formatDifficulty = (difficulty, unavailable) => {
  if (!Number.isFinite(difficulty) || difficulty < 0) return unavailable;

  const unit =
    DIFFICULTY_UNITS.find(([threshold]) => difficulty >= threshold) ||
    DIFFICULTY_UNITS[DIFFICULTY_UNITS.length - 1];
  const [divisor, suffix] = unit;
  const scaledDifficulty = difficulty / divisor;

  if (scaledDifficulty < 0.01 && scaledDifficulty !== 0) {
    return scaledDifficulty.toLocaleString("en-US", {
      maximumSignificantDigits: 3,
    });
  }

  return `${scaledDifficulty.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${suffix}`;
};

const formatAdjustmentDate = (timestamp, locale, t, fallback = t`N/A`) => {
  if (!Number.isFinite(timestamp)) return fallback;

  const date = new Date(timestamp * 1000);
  const month = date.toLocaleString(locale, { month: "long" });
  const day = date.getDate();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? t`pm` : t`am`;
  const hour = String(date.getHours() % 12 || 12).padStart(2, "0");

  return `${month} ${day} - ${hour}:${minute} ${period}`;
};

const formatTimeUntil = (timestamp, unavailable, t) => {
  if (!Number.isFinite(timestamp)) return unavailable;

  const totalMinutes = Math.max(
    0,
    Math.floor((timestamp * 1000 - Date.now()) / (60 * 1000)),
  );
  const days = Math.floor(totalMinutes / (24 * 60));
  const hours = Math.floor((totalMinutes % (24 * 60)) / 60);
  const minutes = totalMinutes % 60;

  if (days >= 14) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    return remainingDays
      ? `${weeks}${t`w`} ${remainingDays}${t`d`}`
      : `${weeks}${t`w`}`;
  }

  if (days) return `${days}${t`d`} ${hours}${t`h`}`;
  if (hours) return `${hours}${t`h`} ${minutes}${t`m`}`;

  return totalMinutes ? `${totalMinutes}${t`m`}` : t`< 1m`;
};

const adjustmentStat = (title, value, className = "") => (
  <div className="difficulty-adjustment-stat">
    <p className="difficulty-adjustment-stat-title">{title}</p>
    <p className={`difficulty-adjustment-stat-value ${className}`}>{value}</p>
  </div>
);

const statDivider = (className) => (
  <div className={["difficulty-adjustment-stat-divider", className || ""].join(" ")}></div>
);

export default ({
  blocks,
  dashboardEpochStartBlock,
  dashboardPreviousDifficultyBlock,
  t,
}) => {
  const unavailable = t`N/A`;
  const latestBlock = blocks && blocks[0];
  const epochTiming = getEpochTiming(latestBlock, dashboardEpochStartBlock);
  const expected = expectedAdjustment(epochTiming);
  const previous = previousAdjustment(
    latestBlock,
    dashboardPreviousDifficultyBlock,
  );
  const averageBlockTime = formatBlockTime(
    epochTiming && epochTiming.averageBlockSeconds,
    unavailable,
    t,
  );
  const hashrate = formatHashrate(
    latestBlock && latestBlock.difficulty,
    epochTiming && epochTiming.averageBlockSeconds,
    t,
    unavailable,
  );
  const estimatedAdjustmentTimestamp =
    epochTiming && epochTiming.estimatedAdjustmentTimestamp;
  const nextAdjustment = formatTimeUntil(
    estimatedAdjustmentTimestamp,
    unavailable,
    t,
  );
  const nextAdjustmentFooter = Number.isFinite(estimatedAdjustmentTimestamp)
    ? t`Next adj. in ${nextAdjustment}`
    : t`Next adjustment unavailable`;

  return (
    <div className="difficulty-adjustment-section">
      <div className="difficulty-adjustment-panel">
        <div className="table-header">
          <div className="table-header-icon-container">
            <ArrowsInSimpleIcon />
          </div>
          <h1 className="table-header-title">{t`Difficulty Adjustment`}</h1>
          <Tooltip
            iconSrc={`${staticRoot}img/icons/tooltip.svg`}
            text={t`How hard it is to mine new blocks. Bitcoin retargets mining difficulty every 2,016 blocks to keep blocks near 10 minutes. Current is the projected next change; Previous was the last change.`}
          />
        </div>
        <div className="difficulty-adjustment-stats">
          {adjustmentStat(t`AVERAGE BLOCK TIME`, averageBlockTime)}

          {statDivider()}
          {adjustmentStat(
            t`EXPECTED ADJ`,
            formatAdjustment(expected, unavailable),
            adjustmentClass(expected),
          )}

          {statDivider("difficulty-adjustment-stat-divider-middle")}
          {adjustmentStat(
            t`PREVIOUS ADJ`,
            formatAdjustment(previous, unavailable),
            adjustmentClass(previous),
          )}

          {statDivider()}
          {adjustmentStat(
            t`EXPECTED ADJ DATE`,
            formatAdjustmentDate(
              estimatedAdjustmentTimestamp,
              t.lang_id || "en-US",
              t,
            ),
          )}
        </div>
      </div>

      <div className="difficulty-adjustment-metrics">
        <InfoCard
          className="difficulty-adjustment-metric-card"
          title={t`Hashrate`}
          value={hashrate.value}
          footer={hashrate.footer}
          tooltip={t`Estimated computing power securing the network.`}
        />

        <InfoCard
          className="difficulty-adjustment-metric-card"
          title={t`Difficulty`}
          value={formatDifficulty(
            latestBlock && latestBlock.difficulty,
            unavailable,
          )}
          footer={nextAdjustmentFooter}
          tooltip={t`How hard it is to find a valid block. Tracks hashrate.`}
        />
      </div>
    </div>
  );
};
