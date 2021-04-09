import Snabbdom from 'snabbdom-pragma'
import { updateQuery } from '../util'
import { toggleIcon } from './util'

const items  = process.env.MENU_ITEMS && JSON.parse(process.env.MENU_ITEMS)
    , active = process.env.MENU_ACTIVE

const otherTheme = { dark: 'light', light: 'dark' }
const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, theme, page }) =>

<div className="main-nav-container">
  <ul className="main-nav">
    { items && Object.entries(items).map(([ name, url ]) =>
        <li className={`nav-item ${name == active ? 'active' : ''}`}>
          <a className="nav-link" href={url} rel="external">
            <span><img className="menu-logo" alt="" src={`${staticRoot}img/icons/menu-logo.png`} /></span>
            <span>{t(name)}</span>
          </a>
        </li>
    ) }
  </ul>
    
  <div className="toggle-container">
    <div className="burger-icon">
        <span></span>
        <span></span>
        <span></span>
    </div>
    {toggleIcon()}
    <div className="toggle-menu">
      <div className="toggle-menu-header">
        <div className="switch-theme-icon"></div>
        <div className="language">
          <form method="get">
            { !process.browser && Object.entries(page.query).map(([k, v]) =>
              k != 'lang' && <input type="hidden" name={k} value={v} />
            ) }
            <select className="language-selector" name="lang">
              { Object.entries(t.langs).map(([ lang_id, lang_t ]) =>
                <option value={lang_id} attrs={lang_id == t.lang_id ? { selected: true } : {}}>{lang_t`lang_name`}</option>
              ) }
            </select>
            { !process.browser && <input type="submit" className="language-submit" value={t`Go`} /> }
          </form>
        </div>
      </div>
      <div className="section1">
        <h4 className="menu-title">Wallets</h4>
        <div className="wallets-link">
            <p>AQUA</p>
            <div>
              <a href="/">App Store</a>
            </div>
        </div>
        <div className="wallets-link">
            <p>Blockstream Green</p>
            <div>
              <a href="/">App Store</a>
              <a href="/">Google Play</a>
              <a href="/">Linux</a>
              <a href="/">+4 more</a>
            </div>
        </div>
      </div>
      <div className="section2">
        <div className="link-list">
          <h4 className="menu-title">Explorers</h4>
          <ul>
            <li><a href="/">Bitcoin</a></li>
            <li><a href="/">Liquid Network</a></li>
            <li><a href="/testnet/">Bitcoin Testnet</a></li>
            <li><a href="/">Liquid Testnet</a></li>
            <li><a href="/">Signet</a></li>
          </ul>
          <h4 className="menu-title">Developer Tools</h4>
          <ul>
            <li><a href="https://github.com/Blockstream/esplora/blob/master/API.md" target="_blank">API</a></li>
            <li><a href="tx/push">Broadcast Transactions</a></li>
          </ul>
        </div>
        <div className="link-list">
          <h4 className="menu-title">Other Products</h4>
          <ul>
            <li><a href="/">Liquid Network</a></li>
            <li><a href="/">Blockstream Mining</a></li>
            <li><a href="/">Blockstream AMP</a></li>
            <li><a href="/">Blockstream Jade</a></li>
            <li><a href="/">Blockstream Satellite</a></li>
            <li><a href="/">Crypto Data Feed</a></li>
            <li><a href="/">c-lightning</a></li>
            <li><a href="/">Elements</a></li>
          </ul>
        </div>
        <div className="link-list">
          <h4 className="menu-title">Useful Links</h4>
          <ul>
            <li><a href="/">Help Center</a></li>
            <li><a href="/">Submit a bug / request</a></li>
            <li><a href="/">Press</a></li>
            <li><a href="/">About Blockstream</a></li>
            <li><a href="/">News</a></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</div>