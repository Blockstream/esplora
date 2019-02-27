import Snabbdom from 'snabbdom-pragma'
import { getMempoolDepth, squashFeeHistogram, lowestFeerateInLimit } from '../util'
import { formatAmount } from './util'
import layout from './layout'
import search from './search'

export default ({ t, mempool, feeEst, ...S }) => mempool && feeEst && layout(
  <div>
    <div className="jumbotron jumbotron-fluid">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div>
          <h1 className="transaction-header-title">{t`Mempool`}</h1>
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
            <div>{t`Total size`}</div>
            <div>{mempool.vsize > 10000 ? `${(mempool.vsize / 1000000).toFixed(2)} vMB` : `< 0.01 MB`}</div>
          </div>
        </div>
      </div>
    </div>
    <div className="container">
      <div className="row">
        <dl className="mempool-histogram col-md-8 col-sm-6">
          <h4 className="text-center mb-3">Fee rate distribution</h4>
          { mempool.fee_histogram.map(([ rangeStart, binSize ], i) => binSize > 0 &&
            <dd>
              <span className="text">{`${rangeStart.toFixed(1)}${i == 0 ? '+' : ' - '+mempool.fee_histogram[i-1][0].toFixed(1)}`}</span>
              <span className="bar" style={`width: ${binSize/mempool.vsize*100}%`}>{`${(binSize/1000000).toFixed(2)} vMB`}</span>
            </dd>
          )}
          <dd className="label"><span className="text">{t`sat/vbyte`}</span></dd>
        </dl>

        <div className="fee-estimates col-md-4 col-sm-6 text-center">
          <h4 className="mb-3">Fee rate estimates</h4>
          <table className="table table-sm">
              <thead><tr><th>Target</th><th>sat/vB</th><th>Mempool depth</th></tr></thead>
              { Object.entries(feeEst).map(([ target, feerate ]) =>
                <tr><td>{t`${target} blocks`}</td><td>{feerate.toFixed(2)}</td><td>{t`${(getMempoolDepth(mempool.fee_histogram, feerate)/1000000).toFixed(2)} vMB from tip`}</td></tr>
              )}
          </table>
        </div>
      </div>
    </div>
  </div>
, { ...S, t, mempool, feeEst })
