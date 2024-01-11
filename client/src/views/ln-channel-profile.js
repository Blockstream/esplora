import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import { channelProfile } from './ln-channel' 

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  <div>
     { body }
   </div>
 , { t, isTouch, activeTab, ...S })

export const lnChannelProfile = ({ channelInfo, t, ...S }) => homeLayout(
    <div className="container dash-container">
      {channelProfile(channelInfo, false, { t, ...S })}
    </div>
  , {...S, t, activeTab: 'lnChannelProfile' })
  