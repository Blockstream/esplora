import Snabbdom from 'snabbdom-pragma'
import navbar from './navbar'
import footer from './footer'
import subnav from './sub-navbar'

export default (body, opt) =>
  <div className="explorer-container">
    { navbar(opt) }
    {subnav(opt.t, opt.isTouch, opt.activeTab, opt.page)}
    <main className="explorer-main">
      { body }
    </main>
    { footer(opt) }
  </div>
