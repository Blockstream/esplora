import Snabbdom from 'snabbdom-pragma'
import { formatAmount } from './util'
import layout from './layout'
import search from './search'

export default ({ t, mempool, feeEst, ...S }) => mempool && feeEst && layout(
  <div>
    <div className="jumbotron jumbotron-fluid">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div>
          <h1 className="block-header-title">{t`Mempool`}</h1>
        </div>
        <div className="stats-table">
          <div>
            <div>{t`Total transactions`}</div>
            <div>{mempool.count}</div>
          </div>
          <div>
            <div>{t`Total fees`}</div>
            <div>{formatAmount({ value: mempool.total_fee })}</div>
          </div>
          <div>
            <div>{t`Total size (vKB)`}</div>
            <div>{(mempool.vsize / 1000).toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
, { ...S, t, mempool, feeEst })
