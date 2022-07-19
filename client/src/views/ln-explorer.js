import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { channels } from './ln-channels'
import { nodes } from './ln-nodes' 

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
     { body }
   </div>
 , { t, isTouch, activeTab, ...S })

export const lnExplorer = ({ mempoolRecent, t, ...S }) => homeLayout(
    <div className="container dash-container">
      {channels(mempoolRecent, true, { t, ...S })}
      {nodes(mempoolRecent, true, { t, ...S })}
    </div>
  , {...S, t, activeTab: 'lnExplorer' })
  