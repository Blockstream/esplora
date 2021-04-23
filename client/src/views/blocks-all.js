import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { blks } from './blocks'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
 <div>
    { body }
  </div>
, { t, isTouch, activeTab, ...S })

export const recentBlocks = ({ t, blocks, loading, ...S }) => homeLayout(
      <div className="container">
      { blks(blocks, false, true, { t, loading, ...S }) }
      </div>
  , { ...S, t, activeTab: 'recentBlocks' })

