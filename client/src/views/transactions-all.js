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
    transactions( mempoolRecent, false, { t, ...S })
  , { ...S, t, activeTab: 'recentTxs' })
