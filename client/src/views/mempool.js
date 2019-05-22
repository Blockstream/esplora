import Snabbdom from 'snabbdom-pragma'
import { getMempoolDepth, squashFeeHistogram, feerateCutoff } from '../lib/fees'
import { formatSat, formatVMB } from './util'
import layout from './layout'
import search from './search'

let squashed

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
            <div>{formatSat(mempool.total_fee)}</div>
          </div>
          <div>
            <div>{t`Total size`}</div>
            <div>{formatVMB(mempool.vsize)}</div>
          </div>
        </div>
      </div>
    </div>
    <div className="container">
      <div className="row">
        { mempool.fee_histogram.length > 0 &&
          <dl className="mempool-histogram col-md-8 col-sm-6">
            <h4 className="text-center mb-3">Fee rate distribution</h4>
            { squashed = squashFeeHistogram(mempool.fee_histogram), squashed.map(([ rangeStart, binSize ], i) => binSize > 0 &&
              <dd>
                <span className="text">{`${rangeStart.toFixed(1)}${i == 0 ? '+' : ' - '+squashed[i-1][0].toFixed(1)}`}</span>
                <span className="bar" style={{width: `${binSize/mempool.vsize*100}%`}}>{formatVMB(binSize)}</span>
              </dd>
            )}
            <span className="label">{t`sat/vbyte`}</span>
          </dl>
        }

        { !!Object.keys(feeEst).length &&
          <div className="fee-estimates col-md-4 col-sm-6 text-center">
            <h4 className="mb-3">Fee rate estimates</h4>
            <table className="table table-sm">
                <thead><tr><th>Target</th><th>sat/vB</th><th>Mempool depth</th></tr></thead>
                { sortEst(feeEst).map(([ target, feerate ]) =>
                  <tr><td>{t`${target} blocks`}</td><td>{feerate.toFixed(2)}</td><td>{t`${formatVMB(getMempoolDepth(mempool.fee_histogram, feerate))} from tip`}</td></tr>
                )}
            </table>
          </div>
        }
      </div>

    </div>
  </div>
, { ...S, t, mempool, feeEst })

const sortEst = feeEst => Object.entries(feeEst).sort((a, b) => a[0]-b[0])
