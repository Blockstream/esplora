import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { blks } from './blocks'
import { transactions } from './transactions'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
 <div>
    { body }
  </div>
, { t, isTouch, activeTab, ...S })

export const dashBoard = ({ t, blocks, dashboardState, loading, ...S }) => {
  const { dashblocks, dashTxs } = dashboardState || {}

return (homeLayout(
  <div className="container dash-container">
      { blks( dashblocks, true, false, { t, ...S }) }
      {transactions( dashTxs, true, { t } )}
      
  </div>
  , { ...S, t, activeTab: 'dashBoard' })
)}
