import { getSupply } from "../lib/elements.js";
import layout from "./layout";
import loader from "../components/loading";
import {
  CurrencyDollarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from "../components/icons";

const staticRoot = process.env.STATIC_ROOT || "";
export default ({ assetList, goAssetList, loading, t, ...S }) => {
  const { assets, total } = assetList || {};
  const { start_index, sort_dir, sort_field, limit } = goAssetList;
  const pageLink = `assets?sort_field=${encodeURIComponent(sort_field)}&sort_dir=${encodeURIComponent(sort_dir)}`;
  const reverseSortDir = encodeURIComponent(
    sort_dir === "asc" ? "desc" : "asc",
  );

  return layout(
    <div key="assets">
      <div className="container">
        {!assets ? (
          <div className="load-more-container">{loader()}</div>
        ) : !assets.length ? (
          <div className="asset-container">
            <p>{t`No registered assets`}</p>
          </div>
        ) : (
          <div className="asset-container">
            <div className="table-header">
              <div className="table-header-icon-container">
                <CurrencyDollarIcon />
              </div>
              <h1 className="table-header-title">All Assets</h1>
            </div>

            <div className="table-title-row">
              {sortHeader("NAME", "name", "asset-list-name", { sort_field, sort_dir, reverseSortDir })}
              {sortHeader("TICKER", "ticker", "asset-list-ticker", { sort_field, sort_dir, reverseSortDir })}
              {sortHeader("TOTAL SUPPLY", null, "asset-list-total-supply", { sort_field, sort_dir, reverseSortDir })}
              {sortHeader("ISSUER DOMAIN", "domain", "asset-list-issuer-domain", { sort_field, sort_dir, reverseSortDir })}
            </div>

            <div className={`asset-list-body ${loading ? "asset-list-body-loading" : ""}`}>
              {assets.map((asset) => (
                <a href={`asset/${asset.asset_id}`}>
                <div className="assets-table-link-row">
                  <div className="assets-table-row">
                    <div className="asset-list-name" data-label={t`Name`}>
                      <CurrencyDollarIcon className="currency-dollar" />
                      {asset.name}
                    </div>
                    <div className="asset-list-ticker" data-label={t`Ticker`}>
                      {asset.ticker || <em>None</em>}
                    </div>
                    <div className="asset-list-total-supply" data-label={t`Total Supply`}>
                      {getSupply(asset, t)}
                    </div>
                    <div className="asset-list-issuer-domain" data-label={t`Issuer domain`}>
                      {asset.entity.domain}
                    </div>
                  </div>
                </div>
                </a>
              ))}
            </div>
            <div className="asset-list-footer">
              {paginationControls(total, start_index, limit, pageLink)}
            </div>
          </div>
        )}
      </div>
    </div>,
    { assetList, activeTab: "assets", t, ...S },
  );
};

const sortHeader = (label, field, className, { sort_field, sort_dir, reverseSortDir }) => {
  if (!field) {
    return <p className={className}>{label}</p>;
  }

  const isActive = sort_field === field;
  const sortIcon = <span className={`asset-sort-icon ${!isActive ? "asset-sort-icon-inactive" : ""}`} aria-hidden="true">
    <ChevronUpIcon className={sort_field === field && sort_dir === "desc" ? "asset-sort-chevron-muted" : ""} />
    <ChevronDownIcon className={sort_field === field && sort_dir === "asc" ? "asset-sort-chevron-muted" : ""} />
  </span>;

  return <a className={className} href={`assets?sort_field=${field}&sort_dir=${reverseSortDir}`}>{label} {sortIcon}</a>;
};

const paginationControls = (total, startIndex, limit, pageLink) => {
  const maxVisibleButtons = 5,
    totalPage = Math.ceil(total / limit),
    curPage = startIndex / limit + 1,
    lastPage = limit * (totalPage - 1),
    currentStart = startIndex + 1,
    currentEnd = Math.min(startIndex + limit, total);

  let maxLeft = curPage - Math.floor(maxVisibleButtons / 2);
  let maxRight = curPage + Math.floor(maxVisibleButtons / 2);

  if (maxLeft < 1) {
    maxLeft = 1;
    maxRight = maxVisibleButtons;
  }

  if (maxRight > totalPage) {
    maxLeft = totalPage - (maxVisibleButtons - 1);
    maxRight = totalPage;

    if (maxLeft < 1) {
      maxLeft = 1;
    }
  }

  const visiblePages = [];
  for (let pageNum = maxLeft; pageNum <= maxRight; pageNum++) {
    visiblePages.push(pageNum);
  }

  const pageRanges = [];
  for (let page = 0; page < totalPage; page++) {
    const pageStartIndex = page * limit,
      start = pageStartIndex + 1,
      end = Math.min(pageStartIndex + limit, total);

    pageRanges.push({ pageStartIndex, start, end });
  }

  const pagination = {
    total,
    limit,
    pageLink,
    startIndex,
    totalPage,
    lastPage,
    curPage,
    currentStart,
    currentEnd,
    pageRanges,
    visiblePages,
    prevDisabled: startIndex === 0,
    nextDisabled: startIndex + limit >= total,
  };

  return (
    <div className="asset-list-pagination">
      {paginationDropdown(pagination)}
      {paginationButtons(pagination)}
    </div>
  );
};

const paginationDropdown = ({
  total,
  pageLink,
  startIndex,
  currentStart,
  currentEnd,
  pageRanges,
}) => (
  <div className="pagination-dropdown-container">
    <p>Showing</p>
    <div className="pagination-dropdown" tabindex="0">
      <div className="pagination-dropdown-current">
        <span>{currentStart} - {currentEnd}</span>
        <ChevronDownIcon />
      </div>
      <div className="pagination-dropdown-options">
        {pageRanges.map(({ pageStartIndex, start, end }) => (
          <a
            className={`pagination-dropdown-option ${pageStartIndex === startIndex ? "current" : ""}`}
            href={`${pageLink}&start_index=${pageStartIndex}`}
          >
            {start} - {end}
          </a>
        ))}
      </div>
    </div>
    <p>of {total} results</p>
  </div>
);

const paginationButtons = ({
  limit,
  pageLink,
  startIndex,
  visiblePages,
  prevDisabled,
  nextDisabled,
}) => {

  return (
    <div className="pagination">
      <a
        className={`prev pagelink ${prevDisabled ? "prev-disabled" : ""}`}
        href={
          prevDisabled ? "#" : `${pageLink}&start_index=${startIndex - limit}`
        }
      >
        <ChevronLeftIcon />
        <p>Previous</p>
      </a>
      <div className="numbers">
        {visiblePages.map((pgNum) => {
          const pageStartIndex = limit * (pgNum - 1);
          return (
            <a
              href={`${pageLink}&start_index=${pageStartIndex}`}
              className={`pagelink ${pageStartIndex === startIndex ? "current" : ""} number`}
            >
              {pgNum}
            </a>
          );
        })}
      </div>
      <a
        className={`next pagelink ${nextDisabled ? "next-disabled" : ""}`}
        href={
          nextDisabled ? "#" : `${pageLink}&start_index=${startIndex + limit}`
        }
      >
        <p>Next</p>
        <ChevronRightIcon />
      </a>
    </div>
  );
};
