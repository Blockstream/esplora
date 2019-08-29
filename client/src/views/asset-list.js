import Snabbdom from 'snabbdom-pragma'

import layout from './layout'

export default ({ assetMap, t, ...S }) => {

  const assets = Object.entries(assetMap)
    .map(([ asset_id, [ domain, ticker, name ] ]) => ({ asset_id, domain, ticker, name  }))
    .sort((a, b) => a.name.localeCompare(b.name))

  return layout(
    <div>
      <div className="jumbotron jumbotron-fluid h-auto">
        <div className="container">
          <h1>{t`Registered assets`}</h1>
        </div>
      </div>

      <div className="container">
        { !assets.length ? <p>{t`No registered assets`}</p>
        : <div className="assets-table">
              <div className="assets-table-row header">
                <div className="assets-table-cell">{t`Name`}</div>
                <div className="assets-table-cell ticker">{t`Ticker`}</div>
                <div className="assets-table-cell">{t`Issuer domain`}</div>
                <div className="assets-table-cell">{t`Asset ID`}</div>
              </div>
              {assets.map(asset =>
                <div className="assets-table-link-row">
                  <a className="assets-table-row asset-data" href={`asset/${asset.asset_id}`}>
                    <div className="assets-table-cell" data-label={t`Name`}>{asset.name}</div>
                    <div className="assets-table-cell ticker" data-label={t`Ticker`}>{asset.ticker || <em>None</em>}</div>
                    <div className="assets-table-cell" data-label={t`Issuer domain`}>{asset.domain}</div>
                    <div className="assets-table-cell asset-id highlighted-text" data-label={t`Asset ID`}>{asset.asset_id}</div>
                  </a>
                </div>
              )}
          </div>
        }
      </div>
    </div>
  , { assetMap, t, ...S }
  )
}
