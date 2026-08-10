import {
  formatNumber,
  formatRelativeTime,
  getBlockPercentageUsed,
  formatVMB,
} from "./util";
import loader from "../components/loading";
import { BlockIcon, ClockIcon, CopyIcon } from "../components/icons";
import { InfoStat } from "../components/info-stat";
import { Tooltip } from "../components/tooltip";

const staticRoot = process.env.STATIC_ROOT || "";

export const blks = (blocks, viewMore, { t, ...S }) => (
  <div className="blocks-page">
    {!blocks ? (
      loader()
    ) : !blocks.length ? (
      <p>{t`No recent blocks`}</p>
    ) : (
      <div className="blocks-table">
        <div className="table-header">
          <div className="table-header-icon-container">
            <BlockIcon />
          </div>
          <h1 className="table-header-title">Latest Blocks</h1>
        </div>
        <div className="blocks-table-body">
          {blocks &&
            blocks.map((b, index) => (
              <div className="blocks-table-link-row">
                <div
                  className={`blocks-table-card ${S.newBlockEntries && S.newBlockEntries[b.id] ? "new-table-entry" : ""}`}
                >
                  <a
                    className="blocks-table-card-link"
                    href={`block/${b.id}`}
                    aria-label={`View block ${b.height}`}
                  ></a>
                  <div className="block-icon-container">
                    <BlockIcon className="block-table-entry-icon" />
                  </div>
                  <div className="block-details">
                    <div className="block-card-header">
                      <div className="block-card-top-header">
                        <div className="mobile-block-icon-container">
                          <BlockIcon />
                        </div>
                        <p className="block-number">
                          #{b.height.toLocaleString()}
                        </p>
                        <button
                          className="table-copy-button code-button-btn"
                          type="button"
                          data-clipboardCopy={"" + b.height}
                          aria-label={`Copy block number ${b.height}`}
                        >
                          <CopyIcon />
                        </button>
                        {index === 0 ? (
                          <div className="latest-block-badge">Latest</div>
                        ) : (
                          ""
                        )}
                      </div>

                      <p
                        className="block-timestamp"
                        title={new Date(b.timestamp * 1000)}
                      >
                        <ClockIcon className="block-timestamp-icon" />
                        {formatRelativeTime(b.timestamp)?.toUpperCase()}
                      </p>
                    </div>
                    <div className="block-card-body">
                      <InfoStat
                        title="TRANSACTIONS"
                        value={formatNumber(b.tx_count).toLocaleString()}
                      />
                      <InfoStat title="SIZE" value={formatVMB(b.size, "MB")} />
                    </div>

                    <div className="block-usage">
                      <div className="usage-and-tooltip">
                        <p className="usage-number">
                          {getBlockPercentageUsed(b.weight)}%
                        </p>
                        <Tooltip
                          iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                          text="How full this block is."
                        />
                      </div>
                      <div className="usage-bar">
                        <div
                          className="usage-bar-fill"
                          style={{
                            width: `${getBlockPercentageUsed(b.weight)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {blocks && viewMore ? (
          <a className="view-more font-link-semibold" href="blocks/recent">
            <span>{t`See more`}</span>
            <div>
              <img alt="" src={`${staticRoot}img/icons/arrow-right-blue.svg`} />
            </div>
          </a>
        ) : (
          ""
        )}
      </div>
    )}
  </div>
);
