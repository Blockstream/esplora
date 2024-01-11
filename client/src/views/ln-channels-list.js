import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { channels } from './ln-channels'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
     { body }
   </div>
 , { t, isTouch, activeTab, ...S })

export const lnChannels = ({ mempoolRecent, t, ...S }) => homeLayout(
    <div className="container dash-container">
      {channels(mempoolRecent, false, { t, ...S })}
    </div>
  , {...S, t, activeTab: 'lnChannels' })
  