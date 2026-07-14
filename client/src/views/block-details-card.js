import { BlockGrid } from "../components/block-grid";
import { InfoStat } from "../components/info-stat";
import { StatusBadge } from "../components/status-badge";
import { ElapsedTime } from "../components/elapsed-time";
import {
  formatTime,
  formatVMB,
  getBlockPercentageUsed,
} from "./util";

const formatInteger = (value) =>
  Number.isFinite(value) ? value.toLocaleString() : "N/A";

const BlockDetailsCard = ({ className, block, confirmed }) => {
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
                <span>
                  <ElapsedTime timestamp={block.timestamp} /> ago
                </span>
              ) : (
                "Loading block..."
              )}
            </p>

            {confirmed ? (
              <StatusBadge variant="success">Confirmed</StatusBadge>
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
          </div>

          <div className="block-details-card-progress">
            <div className="block-details-card-progress-header">
              <p>BLOCK FILLING</p>
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
