import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const staticRoot = process.env.STATIC_ROOT || ''

const logoSources = {
    dark: {
      sideswap: `${staticRoot}img/logos/sideswap.svg`,
      sparrow: `${staticRoot}img/logos/sparrow.png`,
      blockstreamApp: `${staticRoot}img/logos/app_logo_darkmode.svg`,
      lwk: `${staticRoot}img/logos/lwk.svg`,
      aqua: `${staticRoot}img/logos/aqua.svg`,
      bitcoinDevKit: `${staticRoot}img/logos/bitcoin-dev-kit.svg`,
      nunchuk: `${staticRoot}img/logos/nunchuk.svg`,
    },
    light: {
      sideswap: `${staticRoot}img/logos/sideswap-dark.svg`,
      sparrow: `${staticRoot}img/logos/sparrow-dark.png`,
      blockstreamApp: `${staticRoot}img/logos/app_logo_lightmode.svg`,
      lwk: `${staticRoot}img/logos/lwk-dark.svg`,
      aqua: `${staticRoot}img/logos/aqua-dark.svg`,
      bitcoinDevKit: `${staticRoot}img/logos/bitcoin-dev-kit-dark.svg`,
      nunchuk: `${staticRoot}img/logos/nunchuk-dark.svg`,
    }
}

const LandingPage = ({ t, theme, ...S }) => {
    const logos = logoSources[theme || 'dark']
    return  layout(
    <div className="landing-page">   
        <script src={`${staticRoot}/js/infinite-scroll.js`} async></script>   
        <div className="blur-orange"></div>
        <div className="blur-green"></div>
        <div className="laser-lines"></div>
        <div className="hero-section">
        <div className="container">
            <div className="hero-wrapper">
                <div className="hero-text">
                    <h1 className="font-h1">Build on Bitcoin <br/>at Scale</h1>
                    <p className="font-p1 text-gray">Let the Blockstream Explorer API<br/> handle the blockchain backend for you.<br/>
Faster, always available, and easy to integrate<br/> into wallets, exchanges, and fintech platforms.</p>
                    <a href="https://dashboard.blockstream.info" target="_blank" className="g-btn primary-btn">GET YOUR API KEY</a>
                </div>
                <div className="hero-image">
                    <img src={`${staticRoot}img/explorer-api-compass.png`} alt="Hero Image" />
                </div>
            </div>
        </div>
        </div>

        <div className="container">
            <div className="logos-section">
                <div className="logos-desktop">
                    <div className="logos">
                        <img src={logos.sideswap} alt="SideSwap Logo" />
                        <img src={logos.sparrow} alt="Sparrow Bitcoin Wallet Logo" />
                        <img src={logos.blockstreamApp} alt="Blockstream App Logo" />
                        <img src={logos.lwk} alt="LWK Logo" />
                        <img src={logos.aqua} alt="Aqua Logo" />
                        <img src={logos.bitcoinDevKit} alt="Bitcoin Dev Kit" />
                        <img src={logos.nunchuk} alt="Nunchuk" />
                    </div>
                </div>

                <div className="logos-mobile">
                    <div className="logos-container">
                        <div className="logos-scroll">
                            <div className="logos-track">
                                <img src={logos.sideswap} alt="SideSwap Logo" className="logo-item" />
                                <img src={logos.sparrow} alt="Sparrow Bitcoin Wallet Logo" className="logo-item" />
                                <img src={logos.blockstreamApp} alt="Blockstream App Logo" className="logo-item" />
                                <img src={logos.lwk} alt="LWK Logo" className="logo-item" />
                                <img src={logos.aqua} alt="Aqua Logo" className="logo-item" />
                                <img src={logos.bitcoinDevKit} alt="Bitcoin Dev Kit" className="logo-item" />
                                <img src={logos.nunchuk} alt="Nunchuk" className="logo-item" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <div className="info-section">
            <div className="badge">WHY EXPLORER API</div>
            <h2 className="font-h2 text-center">High performance service - optimized for scaling and uptime</h2>
            <p className="font-p3 text-gray text-center">Proven in production, and trusted by some of the biggest names in the industry,<br/> our API is built to handle demanding workloads so your team can focus on growth.</p>

            <div className="info-cards">
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/integrate.svg`} alt="icon" />
                    <h3 className="font-h2">Plug in and Scale</h3>
                    <p className="font-p3 text-gray">Innovate without the burden of backend systems.</p>
                </div>
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/redundancy.svg`} alt="icon" />
                    <h3 className="font-h2">Always Online</h3>
                    <p className="font-p3 text-gray">99.9% uptime SLA guarantee.</p>
                </div>
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/privacy.svg`} alt="icon" />
                    <h3 className="font-h2">Privacy and Security</h3>
                    <p className="font-p3 text-gray">No persistent logging and end-to-end encryption.</p>
                </div>
            </div>
        </div>
        <div className="features-section">
            <div className="badge">FEATURES</div>
            <h2 className="font-h2 text-center">Explorer handles millions of requests on globally distributed infrastructure so your services are always online</h2>
            <div className="features">
                <div className="feature">
                    <img src={`${staticRoot}img/icons/issuance.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Built on the battle-tested and<br/> well-maintained Esplora stack.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/lbtc.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Access Bitcoin mainnet, testnet,<br/> and Liquid network data.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/security-tokens.svg`} alt="icon" />
                    <p className="font-p3 text-gray">API designed for developers<br/> with up-to-date documentation.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/integration.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Enterprise reliability from one of the<br/> most experienced teams in Bitcoin.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/encryption.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Blockstream runs the infrastructure<br/> so your team can focus on product.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/database.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Pre-indexed blockchain data<br/> makes applications run faster</p>
                </div>
            </div>
        </div>
        </div>

        <div className="cta-section">
            <div className="container">
                <div className="cta-card">
                    <div className="cta-left">
                        <img src={`${staticRoot}img/icons/rest-api.svg`} alt="icon" />
                        <h2 className="font-h2">HTTP REST API<br/> for Bitcoin and Liquid</h2>
                        <p className="font-p3 text-gray">Instant API keys, clear docs, and well-maintained repos make integration seamless.<br/> Access UTXOs, balances, mempool, and fee data through low-latency REST endpoints.</p>
                        <a href="https://github.com/Blockstream/esplora/blob/master/API.md" target="_blank" className="g-btn primary-btn">EXPLORE DOCUMENTATION</a>
                    </div>
                    <div className="cta-right">
                        <img src={`${staticRoot}img/rest-api-cta.svg`} alt="HTTP Rest API image" />
                    </div>
                </div>
            </div>
        </div>

        <div className="pricing-section">
            <div className="container">
                <div className="badge">OUR OFFER</div>
                <h2 className="font-h2 text-center">Pricing</h2>
                <div className="pricing">
                    <div className="pricing-card">
                        <img src={`${staticRoot}img/icons/pricing1.svg`} alt="icon" />
                        <span className="pricing-term">FREE UP TO</span>
                        <h3 className="font-h3">500k <span>Requests/Month</span></h3>
                        <p className="font-p2 text-gray">Authenticated users benefit from 500K requests per month for free and higher daily limits providing more capacity than the free public Esplora endpoints. Authenticated users also benefit from dedicated onboarding & support, and a 99.9% SLA for enhanced reliability.</p>
                    </div>
                    <div className="pricing-card">
                        <img src={`${staticRoot}img/icons/pricing2.svg`} alt="icon" />
                        <span className="pricing-term">ONLY PAY FOR WHAT YOU USE</span>
                        <div className="pricing-table">
                            <div className="pricing-table-row">
                                <div className="pricing-table-price">
                                    <span className="currency">$</span>
                                    <span className="amount">0.01</span>
                                    <span className="rate">/100</span>
                                </div>
                                <div className="pricing-table-description">500K - 10M requests</div>
                            </div>

                            <div className="pricing-table-row">
                                <div className="pricing-table-price">
                                    <span className="currency">$</span>
                                    <span className="amount">0.01</span>
                                    <span className="rate">/200</span>
                                </div>
                                <div className="pricing-table-description">10M - 50M requests</div>
                            </div>

                            <div className="pricing-table-row">
                                <div className="pricing-table-price">
                                    <span className="currency">$</span>
                                    <span className="amount">0.01</span>
                                    <span className="rate">/500</span>
                                </div>
                                <div className="pricing-table-description">50M - 100M requests</div>
                            </div>

                            <div className="pricing-table-row">
                                <div className="pricing-table-price">
                                    <span className="currency">$</span>
                                    <span className="amount">4,000</span>
                                </div>
                                <div className="pricing-table-description" style={{lineHeight: `15px`}}>100M+ requests (Unlimited Usage)</div>
                            </div>
                        </div>
                        <a href="https://dashboard.blockstream.info" target="_blank" className="g-btn primary-btn">GET YOUR API KEY</a>
                    </div>
                    <div className="pricing-card">
                        <img src={`${staticRoot}img/icons/server-icon.svg`} alt="icon" />
                        <span className="pricing-term">ENTERPRISE DEPLOYMENT</span>
                        <div className="pricing-table">
                            <p className="font-p2 text-gray my-1">For high-volume, mission-critical use cases, get dedicated Explorer API infrastructure with tailored setups.</p>
                            <ul className="font-p2 text-gray">
                                <li>Guaranteed geo-availability across regions</li>
                                <li>Single or multi-tenant options</li>
                                <li>Electrum RPC and REST endpoints</li>
                                <li>Enhanced privacy and reliability</li>
                            </ul>
                            
                        </div>
                        <a href="https://blockstream.typeform.com/enterpriseAPI" target="_blank" className="g-btn primary-btn">CONTACT US</a>
                    </div>
                </div>
            </div>
    
        </div>
    </div>
    , { t, activeTab: 'apiLanding', ...S })
}

export default LandingPage