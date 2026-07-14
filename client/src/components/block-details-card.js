import { BlockGrid } from "./block-grid";
import { InfoStat } from "./info-stat";
import { StatusBadge } from "./status-badge";
import { ElapsedTime } from "./elapsed-time";
import { Tooltip } from "./tooltip";
import {
  formatTime,
  formatVMB,
  getBlockPercentageUsed,
} from "../views/util";

const staticRoot = process.env.STATIC_ROOT || "";

const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : "N/A";

const BlockDetailsCard = ({
  className,
  block,
  statusText,
  statusVariant = "success",
}) => {
  const percentage = block
    ? Math.min(Math.max(getBlockPercentageUsed(block.weight), 0), 100)
    : 0;

  return (
    <span className={className}>
      <div className="block-details-card-summary">
        <BlockGrid blockWeight={block && block.weight} />

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
                "Loading block..."
              )}
            </p>

            {statusText ? (
              <StatusBadge variant={statusVariant}>{statusText}</StatusBadge>
            ) : null}
          </div>

          <div className="block-details-card-stats">
            <InfoStat
              title="TRANSACTIONS"
              value={block ? formatInteger(block.tx_count) : "N/A"}
            />
            <InfoStat
              title="SIZE"
              value={block ? formatVMB(block.size, "MB") : "N/A"}
            />
            <InfoStat
              title="VIRTUAL SIZE"
              value={
                block && Number.isFinite(block.weight)
                  ? `${Math.ceil(block.weight / 4 / 1000)} vKB`
                  : "N/A"
              }
            />
          </div>

          <div className="block-details-card-progress">
            <div className="block-details-card-progress-header">
              <div className="block-details-card-progress-title">
                <p>BLOCK FILLING</p>
                <Tooltip
                  iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                  text="How full the block is."
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
    </span>
  );
};

export default BlockDetailsCard;
