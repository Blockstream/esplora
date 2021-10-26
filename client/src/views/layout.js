import Snabbdom from 'snabbdom-pragma'
import navbar from './navbar'
import footer from './footer'
import subnav from './sub-navbar'
import widget from './testnet-widget'

export default (body, opt) =>
  <div className="explorer-container">
    <div className="content-wrap">
      { navbar(opt) }
      {subnav(opt.t, opt.isTouch, opt.activeTab)}
      { body }
    </div>
    { widget()}
    { footer(opt) }
  </div>
