import { ArrowsInSimpleIcon } from "../components/icons";
import { InfoCard } from "../components/info-card";
import { Tooltip } from "../components/tooltip";
import { difficultyPeriod } from "../const";

const staticRoot = process.env.STATIC_ROOT || "";

const TARGET_BLOCK_SECONDS = 10 * 60;
const HASHES_PER_DIFFICULTY = 2 ** 32;

const HASHRATE_UNITS = [
  [1e24, "YH/s", "Yottahashes per second"],
  [1e21, "ZH/s", "Zettahashes per second"],
  [1e18, "EH/s", "Exahashes per second"],
  [1e15, "PH/s", "Petahashes per second"],
  [1e12, "TH/s", "Terahashes per second"],
  [1e9, "GH/s", "Gigahashes per second"],
  [1e6, "MH/s", "Megahashes per second"],
  [1e3, "kH/s", "Kilohashes per second"],
  [1, "H/s", "Hashes per second"],
];

const DIFFICULTY_UNITS = [
  [1e15, "Q"],
  [1e12, "T"],
  [1e9, "B"],
  [1e6, "M"],
  [1e3, "K"],
  [1, ""],
];

const formatAdjustment = (value) => {
  if (!Number.isFinite(value)) return "N/A";
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

const formatBlockTime = (seconds) => {
  if (!Number.isFinite(seconds)) return "N/A";

  const totalSeconds = Math.max(1, Math.round(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;

  if (!minutes) return `${remainingSeconds}s`;
  if (remainingSeconds) return `${minutes}m ${remainingSeconds}s`;

  return `${minutes}m`;
};

const formatHashrate = (difficulty, averageBlockSeconds) => {
  if (
    !Number.isFinite(difficulty) ||
    difficulty < 0 ||
    !Number.isFinite(averageBlockSeconds) ||
    averageBlockSeconds <= 0
  ) {
    return { value: "N/A", footer: "Hashes per second" };
  }

  const hashrate = (difficulty * HASHES_PER_DIFFICULTY) / averageBlockSeconds;
  const unit =
    HASHRATE_UNITS.find(([threshold]) => hashrate >= threshold) ||
    HASHRATE_UNITS[HASHRATE_UNITS.length - 1];
  const [divisor, symbol, footer] = unit;
  const value = (hashrate / divisor).toLocaleString("en-US", {
    maximumSignificantDigits: 3,
  });

  return { value: `${value} ${symbol}`, footer };
};

const formatDifficulty = (difficulty) => {
  if (!Number.isFinite(difficulty) || difficulty < 0) return "N/A";

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

const formatAdjustmentDate = (timestamp) => {
  if (!Number.isFinite(timestamp)) return "N/A";

  const date = new Date(timestamp * 1000);
  const month = date.toLocaleString("en-US", { month: "long" });
  const day = date.getDate();
  const minute = String(date.getMinutes()).padStart(2, "0");
  const period = date.getHours() >= 12 ? "pm" : "am";
  const hour = String(date.getHours() % 12 || 12).padStart(2, "0");

  return `${month} ${day} - ${hour}:${minute} ${period}`;
};

const formatTimeUntil = (timestamp) => {
  if (!Number.isFinite(timestamp)) return "N/A";

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
    return remainingDays ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
  }

  if (days) return `${days}d ${hours}h`;
  if (hours) return `${hours}h ${minutes}m`;

  return totalMinutes ? `${totalMinutes}m` : "< 1m";
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
}) => {
  const latestBlock = blocks && blocks[0];
  const epochTiming = getEpochTiming(latestBlock, dashboardEpochStartBlock);
  const expected = expectedAdjustment(epochTiming);
  const previous = previousAdjustment(
    latestBlock,
    dashboardPreviousDifficultyBlock,
  );
  const averageBlockTime = formatBlockTime(
    epochTiming && epochTiming.averageBlockSeconds,
  );
  const hashrate = formatHashrate(
    latestBlock && latestBlock.difficulty,
    epochTiming && epochTiming.averageBlockSeconds,
  );
  const estimatedAdjustmentTimestamp =
    epochTiming && epochTiming.estimatedAdjustmentTimestamp;
  const nextAdjustment = formatTimeUntil(estimatedAdjustmentTimestamp);
  const nextAdjustmentFooter = Number.isFinite(estimatedAdjustmentTimestamp)
    ? `Next adj. in ${nextAdjustment}`
    : "Next adjustment unavailable";

  return (
    <div className="difficulty-adjustment-section">
      <div className="difficulty-adjustment-panel">
        <div className="table-header">
          <div className="table-header-icon-container">
            <ArrowsInSimpleIcon />
          </div>
          <h1 className="table-header-title">Difficulty Adjustment</h1>
          <Tooltip
            iconSrc={`${staticRoot}img/icons/tooltip.svg`}
            text="How hard it is to mine new blocks. Bitcoin retargets mining difficulty every 2,016 blocks to keep blocks near 10 minutes. Current is the projected next change; Previous was the last change."
          />
        </div>
        <div className="difficulty-adjustment-stats">
          {adjustmentStat("AVERAGE BLOCK TIME", averageBlockTime)}

          {statDivider()}
          {adjustmentStat(
            "EXPECTED ADJ",
            formatAdjustment(expected),
            adjustmentClass(expected),
          )}

          {statDivider("difficulty-adjustment-stat-divider-middle")}
          {adjustmentStat(
            "PREVIOUS ADJ",
            formatAdjustment(previous),
            adjustmentClass(previous),
          )}

          {statDivider()}
          {adjustmentStat(
            "EXPECTED ADJ DATE",
            formatAdjustmentDate(estimatedAdjustmentTimestamp),
          )}
        </div>
      </div>

      <div className="difficulty-adjustment-metrics">
        <InfoCard
          className="difficulty-adjustment-metric-card"
          title="Hashrate"
          value={hashrate.value}
          footer={hashrate.footer}
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: "Estimated computing power securing the network.",
          }}
        />

        <InfoCard
          className="difficulty-adjustment-metric-card"
          title="Difficulty"
          value={formatDifficulty(latestBlock && latestBlock.difficulty)}
          footer={nextAdjustmentFooter}
          tooltip={{
            iconSrc: `${staticRoot}img/icons/tooltip.svg`,
            text: "How hard it is to find a valid block. Tracks hashrate.",
          }}
        />
      </div>
    </div>
  );
};
