import layout from "./layout";
import { blks } from "./blocks";
import { transactions } from "./transactions";
import { overview } from "./overview";
import difficultyAdjustment from "./difficulty-adjustment";
import { isBitcoinNetwork } from "../lib/network";

const isTouch = process.browser && "ontouchstart" in window;

const homeLayout = (body, { t, activeTab, ...S }) =>
  layout(body, { t, isTouch, activeTab, ...S });

export const dashBoard = ({ t, blocks, dashboardState, loading, ...S }) => {
  const { dashblocks, dashTxs } = dashboardState || {};

  return homeLayout(
    <div key="dashBoard">
      {overview({ blocks: dashblocks, ...S })}
      {blks(dashblocks, true, { t, ...S })}
      {transactions(dashTxs, true, { t, ...S })}
      {isBitcoinNetwork
        ? difficultyAdjustment({ blocks: dashblocks, ...S })
        : ""}
    </div>,
    { ...S, t, activeTab: "dashBoard" },
  );
};
