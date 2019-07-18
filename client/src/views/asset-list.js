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
        : <div className="transactions-table">
              <div className="transactions-table-row header">
                <div className="transactions-table-cell">{t`Asset ID`}</div>
                <div className="transactions-table-cell">{t`Name`}</div>
              </div>
              {assets.map(asset =>
                <div className="transactions-table-link-row">
                  <a className="transactions-table-row transaction-data" href={`asset/${asset.asset_id}`}>
                    <div className="transactions-table-cell highlighted-text" data-label={t`Asset ID`}>{asset.asset_id}</div>
                    <div className="transactions-table-cell" data-label={t`Name`}>{asset.name}</div>
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
