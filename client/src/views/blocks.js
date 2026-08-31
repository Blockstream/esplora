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
import PendingBlockDetailsCard from "./pending-block-details-card";

const staticRoot = process.env.STATIC_ROOT || "";

export const blockTemplateStateForTip = (block, state) =>
  block &&
  state &&
  state.template &&
  state.template.previousblockhash === block.id
    ? state
    : null;

export const blks = (blocks, viewMore, { t, ...S }) => {
  const blockTemplateState = blockTemplateStateForTip(
    blocks && blocks[0],
    S.blockTemplateState,
  );

  return (
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
          <h1 className="table-header-title">{t`Latest Blocks`}</h1>
        </div>

        {viewMore ? (
          <PendingBlockDetailsCard
            bitcoinMarketChart={S.bitcoinMarketChart}
            block={blocks[0]}
            blockTemplate={
              blockTemplateState && blockTemplateState.template
            }
            detailsOpen={S.pendingBlockDetailsOpen}
            feeEst={S.feeEst}
            mempool={S.mempool}
            metrics={
              blockTemplateState && blockTemplateState.metrics
            }
            t={t}
            transactionDelta={
              blockTemplateState && blockTemplateState.delta
            }
          />
        ) : (
          ""
        )}

        {viewMore ? (
          <p className="blocks-section-title">{t`Blocks History`}</p>
        ) : ""}

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
                    aria-label={t`View block ${b.height}`}
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
                          aria-label={t`Copy block number ${b.height}`}
                        >
                          <CopyIcon />
                        </button>
                        {index === 0 ? (
                          <div className="latest-block-badge">{t`Latest`}</div>
                        ) : (
                          ""
                        )}
                      </div>

                      <p
                        className="block-timestamp"
                        title={new Date(b.timestamp * 1000)}
                      >
                        <ClockIcon className="block-timestamp-icon" />
                        {formatRelativeTime(b.timestamp, t)?.toUpperCase()}
                      </p>
                    </div>
                    <div className="block-card-body">
                      <InfoStat
                        title={t`TRANSACTIONS`}
                        value={formatNumber(b.tx_count).toLocaleString()}
                      />
                      <InfoStat title={t`SIZE`} value={formatVMB(b.size, "MB")} />
                    </div>

                    <div className="block-usage">
                      <div className="usage-and-tooltip">
                        <p className="usage-number">
                          {getBlockPercentageUsed(b.weight)}%
                        </p>
                        <Tooltip
                          iconSrc={`${staticRoot}img/icons/tooltip.svg`}
                          text={t`How full this block is.`}
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
            <span>{t`See More`}</span>
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
};
