import layout from './layout'
import { blks } from './blocks'
import { transactions } from './transactions'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  body
, { t, isTouch, activeTab, ...S })

export const dashBoard = ({ t, blocks, dashboardState, loading, ...S }) => {
  const { dashblocks, dashTxs } = dashboardState || {}

return (homeLayout(
  <div key="dashBoard">
      { blks( dashblocks, true, { t, ...S }) }
      { transactions( dashTxs, true, { t, ...S } ) }
  </div>
  , { ...S, t, activeTab: 'dashBoard' })
)}
