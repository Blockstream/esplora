import layout from "./layout";
import { blks } from "./blocks";
import { transactions } from "./transactions";
import { pegInfo } from "./peg-info";
import { overview } from "./overview";
import { feeMarket } from "./fee-market";
import difficultyAdjustment from "./difficulty-adjustment";
import { isBitcoinNetwork } from "../lib/network";
import { showHighValueAssets, showPegData } from "../const";
import { highValueAssets } from "../components/high-value-assets";

const isTouch = process.browser && "ontouchstart" in window;

const homeLayout = (body, { t, activeTab, ...S }) =>
  layout(body, { t, isTouch, activeTab, ...S });

export const dashBoard = ({ t, blocks, dashboardState, loading, ...S }) => {
  const { dashblocks, dashTxs, peg = {}, highValueAssets: highValueAssetData } = dashboardState || {};

  return homeLayout(
    <div className="home-page" key="dashBoard">
      {overview({ blocks: dashblocks, t, ...S })}
      {blks(dashblocks, true, { t, ...S })}
      {isBitcoinNetwork ? feeMarket({ t, ...S }) : ""}
      <div className="dashboard-transaction-section">
        {transactions(dashTxs, true, { t, ...S })}
        {showPegData
          ? pegInfo(peg.asset, peg.txs, { t, ...S, error: peg.error })
          : ""}
      </div>
      {!isBitcoinNetwork ? feeMarket({ t, ...S }) : ""}
      {isBitcoinNetwork
        ? difficultyAdjustment({ blocks: dashblocks, t, ...S })
        : ""}
      {showHighValueAssets ? highValueAssets(t, highValueAssetData) : ""}
    </div>,
    { ...S, t, activeTab: "dashBoard" },
  );
};
