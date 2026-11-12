import navbar from './navbar'
import footer from './footer'
import subnav from './sub-navbar'
import { isBitcoinOrLiquidMainnet } from '../lib/network'

export default (body, opt) => {
  const mainKey = opt.view || opt.activeTab || opt.page && opt.page.pathname || 'main'

  return <div className="explorer-container">
    { navbar(opt) }
    { subnav(opt.t, opt.isTouch, opt.activeTab, opt.page) }
    <main className={`explorer-main${isBitcoinOrLiquidMainnet ? ' bitcoin-usd-values' : ''}`} key={mainKey}>
      { body }
    </main>
    { footer(opt) }
  </div>
}
