import Snabbdom from 'snabbdom-pragma'
import { nativeAssetId } from '../const'
import { updateQuery } from '../util'

const hasCam = process.browser && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
const otherTheme = { dark: 'light', light: 'dark' }
const utilityLinks = process.env.UTILITY_LINKS ? JSON.parse(process.env.UTILITY_LINKS) : {}
const brandName = process.env.BRAND_NAME || 'Explorer'

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
      <div className="section2">
        <div className="link-list">
          <h4 className="menu-title font-h5">Explorer</h4>
          <ul className="font-p3">
            <li><a href="tx/push">Broadcast Transaction</a></li>
            { hasCam ? <li><a href="scan-qr">Scan QR</a></li> : "" }
            { process.env.IS_ELEMENTS ? <li><a href={`asset/${nativeAssetId}`}>Native Asset</a></li> : "" }
          </ul>
        </div>
        { Object.keys(utilityLinks).length > 0 &&
          <div className="link-list">
            <h4 className="menu-title font-h5">{brandName}</h4>
            <ul className="font-p3">
              { Object.entries(utilityLinks).map(([ label, url ]) =>
                <li><a href={url} rel="external" target="_blank">{label}</a></li>
              ) }
            </ul>
          </div>
        }
      </div>
    </div>
</div>
