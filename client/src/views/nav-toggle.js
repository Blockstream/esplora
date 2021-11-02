import Snabbdom from 'snabbdom-pragma'
import { nativeAssetId } from '../const'
import { updateQuery } from '../util'

const staticRoot = process.env.STATIC_ROOT || ''
const hasCam = process.browser && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
const otherTheme = { dark: 'light', light: 'dark' }

export default (t, theme, page) =>

<div className="toggle-container">
    <div className="burger-icon">
        <span></span>
        <span></span>
        <span></span>
    </div>
    <div className="toggle-menu">
      <div className="toggle-menu-header">
        { process.browser ? <div className="switch-theme-icon toggle-theme"></div>
                        : <a href={page.pathname.substr(1) + updateQuery(page.query, { theme: otherTheme[theme] })} className="switch-theme-icon"></a>
        }
      </div>
      <div className="section1">
        <h4 className="menu-title">Wallets</h4>
        <div className="wallets-link">
            <p>AQUA</p>
            <div>
            <a href="https://apps.apple.com/app/id1500791973" target="_blank"><img src={`${staticRoot}img/icons/apple.png`} /><span>App Store</span></a>
            </div>
        </div>
        <div className="wallets-link">
            <p>Blockstream Green</p>
            <div>
              <a href="https://apps.apple.com/us/app/green-bitcoin-wallet/id1402243590" target="_blank"><img src={`${staticRoot}img/icons/apple.png`} /><span>App Store</span></a>
              <a href="https://play.google.com/store/apps/details?id=com.greenaddress.greenbits_android_wallet" target="_blank"><img src={`${staticRoot}img/icons/google-play.png`} /><span>Google Play</span></a>
              <a href="https://github.com/Blockstream/green_qt/releases/download/release_0.1.5/BlockstreamGreen-x86_64.AppImage"><img src={`${staticRoot}img/icons/linux.png`} /><span>Linux</span></a>
              <a href="https://blockstream.com/green/" target="_blank">+4 more</a>
            </div>
        </div>
      </div>
      <div className="section2">
        <div className="link-list">
          <h4 className="menu-title">Explorers</h4>
          <ul>
            <li><a href="/" rel="external">Bitcoin</a></li>
            <li><a href="/liquid/" rel="external">Liquid Network</a></li>
            <li><a href="/testnet/" rel="external" target="_blank">Bitcoin Testnet</a></li>
            <li><a href="/liquidtestnet/" rel="external" target="_blank">Liquid Testnet</a></li>
          </ul>
          <h4 className="menu-title">Developer Tools</h4>
          <ul>
            <li><a href="https://github.com/Blockstream/esplora/blob/master/API.md" target="_blank">API</a></li>
            <li><a href="tx/push">Broadcast Transactions</a></li>
            <li> { hasCam ? <a href="scan-qr">Scan QR</a> : ""}</li>
            <li> { process.env.IS_ELEMENTS ? <a href={`asset/${nativeAssetId}`}>Pegs</a> : ""}</li>
          </ul>
        </div>
        <div className="link-list">
          <h4 className="menu-title">Other Products</h4>
          <ul>
            <li><a href="https://blockstream.com/liquid/" target="_blank">Liquid Network</a></li>
            <li><a href="https://blockstream.com/mining/" target="_blank">Blockstream Mining</a></li>
            <li><a href="https://blockstream.com/amp/" target="_blank">Blockstream AMP</a></li>
            <li><a href="https://blockstream.com/jade/" target="_blank">Blockstream Jade</a></li>
            <li><a href="https://blockstream.com/satellite/" target="_blank">Blockstream Satellite</a></li>
            <li><a href="https://blockstream.com/cryptofeed/" target="_blank">Crypto Data Feed</a></li>
            <li><a href="https://blockstream.com/lightning/" target="_blank">c-lightning</a></li>
            <li><a href="https://blockstream.com/elements/" target="_blank">Elements</a></li>
          </ul>
        </div>
        <div className="link-list">
          <h4 className="menu-title">Useful Links</h4>
          <ul>
            <li><a href="https://help.blockstream.com/hc/en-us" target="_blank">Help Center</a></li>
            <li><a href="https://help.blockstream.com/hc/en-us/requests/new?ticket_form_id=8613" target="_blank">Submit a bug / request</a></li>
            <li><a href="https://blockstream.com/press-releases/" target="_blank">Press</a></li>
            <li><a href="https://blockstream.com/about/" target="_blank">About Blockstream</a></li>
            <li><a href="https://blockstream.com/newsroom/" target="_blank">News</a></li>
          </ul>
        </div>
      </div>
    </div>
</div>
