import { CurrencyDollarIcon } from "./icons";
import { Tooltip } from "./tooltip";
import { highValueAssetDefinitions as assets, staticRoot } from "../const";
import {
  calculateCirculatingDollarAmount,
  formatDollarAmount,
} from "../lib/high-value-assets";

export const highValueAssets = (t, assetData = {}) => {
  const rows = assets
    .map((asset, index) => {
      const data = assetData[asset.asset_id] || {};

      return {
        asset,
        dollarAmount: calculateCirculatingDollarAmount(data.asset, data.price),
        index,
      };
    })
    .sort((left, right) => {
      if (left.dollarAmount == null) {
        return right.dollarAmount == null ? left.index - right.index : 1;
      }
      if (right.dollarAmount == null) return -1;

      return right.dollarAmount - left.dollarAmount || left.index - right.index;
    });

  return (
    <div className="high-value-assets-table">
      <div className="table-header">
        <div className="table-header-icon-container">
          <CurrencyDollarIcon />
        </div>
        <h1 className="table-header-title">{t`High-Value Assets`}</h1>
        <Tooltip
          iconSrc={`${staticRoot}img/icons/tooltip.svg`}
          text={t`This panel shows the circulating value of high-value assets on Liquid.`}
        />
      </div>

      <div className="high-value-assets-body">
        {rows.map(({ asset, dollarAmount }) => {
          return (
            <a
              className="high-value-assets-listing"
              href={`asset/${asset.asset_id}`}
              key={asset.asset_id}
            >
              <div className="high-value-assets-icon">
                <img
                  src={`${staticRoot}img/icons/${asset.icon || "hva-default.svg"}`}
                  alt=""
                />
              </div>
              <p className="high-value-assets-listing-name">{asset.name}</p>
              <p className="high-value-assets-circulating-dollar-amount">
                {formatDollarAmount(dollarAmount)}
              </p>
            </a>
          );
        })}
      </div>
      <a className="view-more font-link-semibold" href="assets">
        <span>{t`See More`}</span>
        <div>
          <img alt="" src={`${staticRoot}img/icons/arrow-right-blue.svg`} />
        </div>
      </a>
    </div>
  );
};
