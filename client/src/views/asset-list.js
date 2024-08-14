import Snabbdom from 'snabbdom-pragma'
import { getSupply } from './util'
import layout from './layout'
import loader from '../components/loading'

const staticRoot = process.env.STATIC_ROOT || ''
export default ({ assetList, goAssetList, loading, t, ...S }) => {

  const { assets, total } = assetList || {}
  const { start_index, sort_dir, sort_field, limit } = goAssetList
  const pageLink = `assets?sort_field=${encodeURIComponent(sort_field)}&sort_dir=${encodeURIComponent(sort_dir)}`
  const reverseSortDir = encodeURIComponent(sort_dir === 'asc' ? 'desc' : 'asc')

  return layout(
    <div>
      <div className="container">
        { !assets ? <div className="load-more-container">{loader()}</div>
          : !assets.length ? <p>{t`No registered assets`}</p>
          : <div className="assets-table">
            <h3 className="table-title font-h3">{t`All Assets`}</h3>
              <div className="assets-table-row header">
                <a href={`assets?sort_field=name&sort_dir=${reverseSortDir}`}
                  className={`assets-table-cell sortable ${sort_field === "name" ? sort_dir : ""}`}>{t`Name`}
                </a>
                <a href={`assets?sort_field=ticker&sort_dir=${reverseSortDir}`}
                    className={`assets-table-cell ticker right-align sortable ${sort_field === "ticker" ? sort_dir : ""}`}>{t`Ticker`}
                </a>
                <div className="assets-table-cell supply right-align">{t`Total Supply`}</div>
                <a href={`assets?sort_field=domain&sort_dir=${reverseSortDir}`}
                    className={`assets-table-cell domain right-align sortable ${sort_field === "domain" ? sort_dir : ""}`}>{t`Issuer Domain`}
                </a>
              </div>
              {assets.map(asset =>
                <div className="assets-table-link-row">
                  <a className="assets-table-row asset-data" href={`asset/${asset.asset_id}`}>
                    <div className="assets-table-cell" data-label={t`Name`}>
                      <div className="assets-table-name">
                          <span>{asset.name}</span>
                      </div>
                    </div>
                    <div className="assets-table-cell ticker right-align" data-label={t`Ticker`}>{asset.ticker || <em>None</em>}</div>
                    <div className="assets-table-cell asset-id right-align" data-label={t`Total Supply`}>{getSupply(asset, t)}</div>
                    <div className="assets-table-cell right-align" data-label={t`Issuer domain`}>{asset.entity.domain}</div>
                  </a>
                </div>
              )}
                <div className="load-more-container">
                { paginationButtons(total, start_index, limit, pageLink) }
                </div>
          </div>
        }
      </div>
    </div>
  , { assetList, activeTab: 'assets', t, ...S }
  )

}


const paginationButtons = (total, start_index, limit, pageLink) => {
  // Assets Per Page
  const maxVisibleButtons = 5
    , totalPage = Math.ceil(total / limit)
    , lastPage = limit * (totalPage - 1)
    , curPage = (start_index / limit) + 1
    
  // Returns Array of Page Numbers
  const updateButtons = () => {
    let buttonsArray = []
    const { maxLeft, maxRight } = calculateMaxVisible()
    for(let pageNum = maxLeft; pageNum <= maxRight; pageNum++){
      buttonsArray.push(pageNum)
    }
    return buttonsArray
  }
  // Move current Page Button to the Middle
  const calculateMaxVisible = () => {
    let maxLeft = (curPage - Math.floor(maxVisibleButtons / 2))
    let maxRight = (curPage + Math.floor(maxVisibleButtons / 2))
      
    if(maxLeft < 1){
      maxLeft = 1
      maxRight = maxVisibleButtons
    }
      
    if(maxRight > totalPage){
      maxLeft = totalPage - (maxVisibleButtons - 1)
      maxRight = totalPage
    
      if(maxLeft < 1){ maxLeft = 1}
    }
    return { maxLeft, maxRight }
  }

  return (
    <div className="pagination">
       {(start_index - limit) < 0 ? "" :
        <div className="prev-first control">
            <a href={`${pageLink}&start_index=0`}
                className="firstpage pagelink">&#10218;&#10218;
            </a>
            <a className="pagelink prev" 
                href={`${pageLink}&start_index=${start_index - limit}`}>
              <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
            </a>
        </div>}
        <div className="numbers">
          {updateButtons().map(pgNum => {
            const pageStartIndex = limit * (pgNum - 1)
            return <a href={`${pageLink}&start_index=${pageStartIndex}`}
                      className={`pagelink ${pageStartIndex === start_index ? 'current' : ""}`}>{pgNum}</a>
          })}
        </div>
        {(start_index + limit) >= total ? "" :
        <div className="next-last control">
            <a className="pagelink next" href={`${pageLink}&start_index=${start_index + limit}`}>
              <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
            </a>
            <a href={`${pageLink}&start_index=${lastPage}`} className="lastpage pagelink">&#10219;&#10219;</a>
        </div>}
    </div>
  )
}
