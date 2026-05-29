import Snabbdom from 'snabbdom-pragma'
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
  [
      blks( dashblocks, true, false, { t, ...S }),
      transactions( dashTxs, true, { t } )
  ]
  , { ...S, t, activeTab: 'dashBoard' })
)}
