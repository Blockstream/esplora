import { BlockGrid } from "./block-grid";
import { InfoCard } from "./info-card";
import { InfoStat } from "./info-stat";
import { MinusIcon, PlusIcon } from "./icons";
import { MetricBar } from "./metric-bar";
import { StatusBadge } from "./status-badge";
import { ElapsedTime, formatDuration } from "./elapsed-time";
import { Tooltip } from "./tooltip";
import { maxBlockWeight } from "../const";
import {
  formatHex,
  formatTime,
  formatVMB,
  getBlockPercentageUsed,
} from "../views/util";

// Require behind env conditional so it gets removed by `envify` on non-elements builds
const BlockSignatures =
  process.env.IS_ELEMENTS &&
  require("./block-signatures").default;

const staticRoot = process.env.STATIC_ROOT || "";

const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : "N/A";

const formatScaledValue = (value, divisor, suffix) => {
  if (!Number.isFinite(value)) return "N/A";

  return `${(value / divisor).toFixed(2).replace(/\.00$/, "")} ${suffix}`;
};

const formatVirtualSize = (weight) => {
  if (!Number.isFinite(weight)) return "N/A";

  const virtualSize = Math.ceil(weight / 4);
  if (virtualSize < 1_000) return `${virtualSize.toLocaleString()} vB`;
  if (virtualSize < 1_000_000) {
    return formatScaledValue(virtualSize, 1_000, "vKB");
  }

  return formatScaledValue(virtualSize, 1_000_000, "vMB");
};

const formatBlockInterval = (block, previousBlock) => {
  if (
    !block ||
    !previousBlock ||
    previousBlock.id !== block.previousblockhash ||
    !Number.isFinite(block.timestamp) ||
    !Number.isFinite(previousBlock.timestamp)
  ) {
    return "N/A";
  }

  return formatDuration(
    (block.timestamp - previousBlock.timestamp) * 1000,
    true,
  );
};

const ExpandedBlockDetails = ({ block, previousBlock, t }) => {
  const weightPercentage = getBlockPercentageUsed(block.weight);
  const blockInterval = formatBlockInterval(block, previousBlock);

  return (
    <div id="expanded-block-details" className="expanded-block-details">
      <InfoCard
        className="block-detail-time-panel"
        title={t`Time Since Last Block`}
        tooltip={t`Time elapsed between this block and the previous block.`}
        value={blockInterval}
        footer={t`Block #${block.height.toLocaleString()}`}
      />
      <InfoCard
        className="block-detail-transactions-panel"
        title={t`Transactions`}
        tooltip={t`Number of transactions included in this block.`}
        value={formatInteger(block.tx_count)}
        footer={t`In block`}
      />
      <InfoCard
        className="block-detail-panel-full block-detail-weight-panel"
        title={t`Block Weight`}
        tooltip={t`How full the block is.`}
        body={
          <div className="block-detail-bars">
            <MetricBar
              title={t`Weight`}
              headerValue={`${formatScaledValue(
                block.weight,
                1_000_000,
                "MWU",
              )} / ${formatScaledValue(
                maxBlockWeight,
                1_000_000,
                "MWU",
              )}`}
              fillPercentage={weightPercentage}
              fillClass="block-weight-weight-bar"
            />
          </div>
        }
      />
      <InfoCard
        title={t`Virtual size`}
        tooltip={t`Block weight divided by four.`}
        value={formatVirtualSize(block.weight)}
      />
      <InfoCard
        title={t`Version`}
        tooltip={t`Version bits recorded in the block header.`}
        value={Number.isFinite(block.version) ? formatHex(block.version) : "N/A"}
      />
      <InfoCard
        className="block-detail-panel-full"
        title={t`Block hash`}
        tooltip={t`Unique identifier for this block.`}
        value={block.id || "N/A"}
      />
      {BlockSignatures ? (
        <InfoCard
          className="block-detail-panel-full block-detail-signatures-panel"
          title={t`Block Signatures`}
          tooltip={t`Signatures authorizing this Elements block.`}
          body={<BlockSignatures block={block} />}
        />
      ) : (
        <InfoCard
          className="block-detail-panel-full"
          title={t`Nonce`}
          tooltip={t`Nonce recorded in the block header.`}
          value={Number.isFinite(block.nonce) ? formatHex(block.nonce) : "N/A"}
        />
      )}
      <InfoCard
        className="block-detail-panel-full"
        title={t`Merkle root`}
        tooltip={t`Commitment to all transactions included in the block.`}
        value={block.merkle_root || "N/A"}
      />
    </div>
  );
};

const BlockDetailsCard = ({
  className,
  block,
  detailsOpen = false,
  previousBlock,
  statusText,
  statusVariant = "success",
  t,
}) => {
  const percentage = block
    ? Math.min(Math.max(getBlockPercentageUsed(block.weight), 0), 100)
    : 0;
  const blockInterval = formatBlockInterval(block, previousBlock);

  return (
    <div
      className={
        className
          ? `block-details-card-body ${className}`
          : "block-details-card-body"
      }
    >
      <div className="block-details-card-summary">
        <BlockGrid
          blockWeight={block && block.weight}
          formatAriaLabel={(percentage) => t`Block is ${percentage}% full`}
          loading={!block}
          loadingLabel={t`Loading block utilization`}
          unavailableLabel={t`Block utilization unavailable`}
        />

        <div className="block-details-card-content">
          <div className="block-details-card-header">
            <p className="block-number">
              {block ? (
                <a href={`block/${block.id}`}>
                  #{block.height.toLocaleString()}
                </a>
              ) : (
                "-"
              )}
            </p>

            <p
              className="block-details-card-timestamp"
              title={block ? formatTime(block.timestamp) : ""}
            >
              {block ? (
                <ElapsedTime timestamp={block.timestamp} />
              ) : (
                t`Loading block...`
              )}
            </p>

            {statusText ? (
              <StatusBadge variant={statusVariant}>{statusText}</StatusBadge>
            ) : null}

            <button
              aria-controls="expanded-block-details"
              aria-expanded={detailsOpen ? "true" : "false"}
              className="block-details-card-details-button"
              disabled={!block}
              type="button"
              data-toggleBlock={block ? block.id : ""}
            >
              {detailsOpen ? <MinusIcon /> : <PlusIcon />}
              {t`Details`}
            </button>
          </div>

          <div className="block-details-card-stats">
            <InfoStat
              title={t`Time Since Last Block`}
              value={blockInterval}
            />
            <InfoStat
              title={t`Transactions`}
              value={block ? formatInteger(block.tx_count) : "N/A"}
            />
            <InfoStat
              title={t`Size`}
              value={block ? formatVMB(block.size, "MB") : "N/A"}
            />
          </div>

          <div className="block-details-card-progress">
            <div className="block-details-card-progress-header">
              <div className="block-details-card-progress-title">
                <p>{t`BLOCK FILLING`}</p>
                <Tooltip
                  iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                  text={t`How full the block is.`}
                />
              </div>
              <p className="usage-number">
                {block ? `${percentage}%` : "N/A"}
              </p>
            </div>

            <div className="block-details-card-usage-bar">
              <div
                className="block-details-card-usage-bar-fill"
                style={{
                  width: `${percentage}%`,
                  backgroundSize: percentage
                    ? `${10_000 / percentage}% 100%`
                    : "100% 100%",
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {detailsOpen && block ? (
        <ExpandedBlockDetails
          block={block}
          previousBlock={previousBlock}
          t={t}
        />
      ) : null}
    </div>
  );
};

export default BlockDetailsCard;
