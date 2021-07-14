import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { transactions } from './transactions'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
    <div>
       { body }
     </div>
   , { t, isTouch, activeTab, ...S })

export const recentTxs = ({ mempoolRecent, t, ...S }) => homeLayout(
    <div className="container">
      {transactions( mempoolRecent, false, { t, ...S })}
    </div>
  , { ...S, t, activeTab: 'recentTxs' })
  