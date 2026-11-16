import layout from "./layout";
import loader from "../components/loading";
import { CurrencyDollarIcon } from "../components/icons";
import { highValueAssets } from "../components/high-value-assets";
import { showHighValueAssets, staticRoot } from "../const";
import { assetRow } from "./asset-list";

export default ({ recentAssets, highValueAssets: highValueAssetData, t, ...S }) =>
  layout(
    <div key="assets">
      <div className="container assets-page">
        {showHighValueAssets
          ? highValueAssets(t, highValueAssetData, { showViewMore: false })
          : ""}
        {!recentAssets ? (
          <div className="load-more-container">{loader()}</div>
        ) : !recentAssets.length ? (
          <div className="asset-container">
            <p>{t`No registered assets`}</p>
          </div>
        ) : (
          <div className="asset-container recent-assets-table">
            <div className="table-header">
              <div className="table-header-icon-container">
                <CurrencyDollarIcon />
              </div>
              <h1 className="table-header-title">{t`Recently Registered Assets`}</h1>
            </div>

            <div className="table-title-row">
              <p className="asset-list-name">NAME</p>
              <p className="asset-list-ticker">TICKER</p>
              <p className="asset-list-total-supply">TOTAL SUPPLY</p>
              <p className="asset-list-issuer-domain">ISSUER DOMAIN</p>
            </div>

            <div className="asset-list-body">
              {recentAssets.map(asset => assetRow(asset, t))}
            </div>
            <a className="view-more font-link-semibold" href="assets/all">
              <span>{t`See All Assets`}</span>
              <div>
                <img alt="" src={`${staticRoot}img/icons/arrow-right-blue.svg`} />
              </div>
            </a>
          </div>
        )}
      </div>
    </div>,
    { activeTab: "assets", t, ...S },
  );
