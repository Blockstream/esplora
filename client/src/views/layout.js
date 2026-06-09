import Snabbdom from 'snabbdom-pragma'
import navbar from './navbar'
import footer from './footer'
import subnav from './sub-navbar'

export default (body, opt) => {
  const mainKey = opt.view || opt.activeTab || opt.page && opt.page.pathname || 'main'

  return <div className="explorer-container">
    { navbar(opt) }
    {subnav(opt.t, opt.isTouch, opt.activeTab, opt.page)}
    <main className="explorer-main" key={mainKey}>
      { body }
    </main>
    { footer(opt) }
  </div>
}
