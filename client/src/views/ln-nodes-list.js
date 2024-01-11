import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { nodes } from './ln-nodes' 

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
     { body }
   </div>
 , { t, isTouch, activeTab, ...S })

export const lnNodes = ({ mempoolRecent, t, ...S }) => homeLayout(
    <div className="container dash-container">
      {nodes(mempoolRecent, false, { t, ...S })}
    </div>
  , {...S, t, activeTab: 'lnNodes' })
  