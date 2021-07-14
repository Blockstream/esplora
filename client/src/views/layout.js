import Snabbdom from 'snabbdom-pragma'
import navbar from './navbar'
import footer from './footer'
import subnav from './sub-navbar'

export default (body, opt) =>
  <div className="explorer-container">
    <div className="content-wrap">
      { navbar(opt) }
      {subnav(opt.t, opt.isTouch, opt.activeTab)}
      { body }
    </div>
    { footer(opt) }
  </div>
