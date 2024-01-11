import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { nodeProfile } from './ln-node' 

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
     { body }
   </div>
 , { t, isTouch, activeTab, ...S })

export const lnNode = ({ nodeInfo, t, ...S }) => homeLayout(
    <div className="container dash-container">
      {nodeProfile(nodeInfo, false, { t, ...S })}
    </div>
  , {...S, t, activeTab: 'lnNodeProfile' })
  