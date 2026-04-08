import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const staticRoot = process.env.STATIC_ROOT || ''
const siteTitle = process.env.SITE_TITLE || 'Block Explorer'
const apiTitle = process.env.API_LANDING_TITLE || 'API Access'
const apiDescription = process.env.API_LANDING_BODY || 'Public REST API endpoints are available through the explorer. Documentation and integration guides are coming soon.'
const primaryUrl = process.env.API_DOCS_URL || process.env.WEBSITE_URL
const primaryLabel = process.env.API_DOCS_URL ? 'VIEW API DOCS' : 'VISIT HASHCASH'

const LandingPage = ({ t, ...S }) => {
    return  layout(
    <div className="landing-page">
      <div className="blur-orange"></div>
      <div className="blur-green"></div>
      <div className="laser-lines"></div>
      <div className="hero-section">
        <div className="container">
          <div className="hero-wrapper">
            <div className="hero-text">
              <h1 className="font-h1">{apiTitle}</h1>
              <p className="font-p1 text-gray">{apiDescription}</p>
              { primaryUrl ? <a href={primaryUrl} target="_blank" className="g-btn primary-btn">{primaryLabel}</a> : "" }
            </div>
            <div className="hero-image">
              <img src={`${staticRoot}img/favicon.png`} alt={siteTitle} />
            </div>
          </div>
        </div>
      </div>
    </div>
    , { t, activeTab: 'apiLanding', ...S })
}

export default LandingPage
