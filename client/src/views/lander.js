import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const staticRoot = process.env.STATIC_ROOT || ''

const logoSources = {
    dark: {
      sideswap: `${staticRoot}img/logos/sideswap.svg`,
      sparrow: `${staticRoot}img/logos/sparrow.png`,
      blockstreamGreen: `${staticRoot}img/logos/blockstream-green.svg`,
      lwk: `${staticRoot}img/logos/lwk.svg`,
      aqua: `${staticRoot}img/logos/aqua.svg`,
      bitcoinDevKit: `${staticRoot}img/logos/bitcoin-dev-kit.svg`,
      nunchuk: `${staticRoot}img/logos/nunchuk.svg`,
    },
    light: {
      sideswap: `${staticRoot}img/logos/sideswap-dark.svg`,
      sparrow: `${staticRoot}img/logos/sparrow-dark.png`,
      blockstreamGreen: `${staticRoot}img/logos/blockstream-green-dark.svg`,
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
                    <h1 className="font-h1">Powering Bitcoin and Liquid Applications with Real-Time Blockchain Data</h1>
                    <p className="font-p1 text-gray">Built to simplify development and enhance performance for existing Bitcoin and Liquid applications, the Blockstream Explorer API offers faster address lookups, robust DoS protection, and seamless integration.</p>
                    <a href="https://dashboard.blockstream.info" target="_blank" className="g-btn primary-btn">GET YOUR API KEY</a>
                </div>
                <div className="hero-image">
                    <img src={`${staticRoot}img/hero-explorer-api.svg`} alt="Hero Image" />
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
                        <img src={logos.blockstreamGreen} alt="Blockstream Green Logo" />
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
                                <img src={logos.blockstreamGreen} alt="Blockstream Green Logo" className="logo-item" />
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
            <p className="font-p3 text-gray text-center">Extensive blockchain data indexing powers pre-populated, cache-ready results for fast and reliable access. The infrastructure is built to handle demanding workloads, ensuring high availability and scalability, even during peak usage.</p>

            <div className="info-cards">
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/integrate.svg`} alt="icon" />
                    <h3 className="font-h2">Integrate & Scale</h3>
                    <p className="font-p3 text-gray">Effortless integration with a transparent pricing model eliminates upfront infrastructure costs. Developers can focus on building applications without the complexity of managing backend systems, saving both time and resources.</p>
                </div>
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/redundancy.svg`} alt="icon" />
                    <h3 className="font-h2">Operational Redundancy</h3>
                    <p className="font-p3 text-gray">Whether used as a primary solution or backup, the service eliminates costly infrastructure maintenance and disaster recovery planning. Its high reliability ensures uninterrupted access during outages or demand spikes.</p>
                </div>
                <div className="info-card">
                    <img src={`${staticRoot}img/icons/privacy.svg`} alt="icon" />
                    <h3 className="font-h2">Privacy & Security</h3>
                    <p className="font-p3 text-gray">With no persistent logging and full end-to-end encryption, the service ensures confidentiality and adherence to best practices. Robust security protocols reduce the need for self-managed security solutions.</p>
                </div>
            </div>
        </div>
        <div className="features-section">
            <div className="badge">FEATURES</div>
            <h2 className="font-h2 text-center">Fast data access, scalable infrastructure, and 99.9% uptime</h2>
            <div className="features">
                <div className="feature">
                    <img src={`${staticRoot}img/icons/issuance.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Powered by the open-source Esplora project, Blockstream Explorer can be self-hosted. Run your own instance to suit your specific needs while leveraging the same robust software that powers our Enterprise solution.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/lbtc.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Access data across Bitcoin Mainnet, Testnet, and Liquid networks, offering a broad spectrum of blockchain data for diverse applications.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/security-tokens.svg`} alt="icon" />
                    <p className="font-p3 text-gray">An HTTP REST API (with Electrs RPC coming soon) provides extended transaction details and seamless integration.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/integration.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Partner with Blockstream for seamless integration, unmatched performance, and dedicated ongoing support.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/encryption.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Fully encrypted connections and secure access ensure data integrity, delivering reliable performance for mission-critical operations.</p>
                </div>
                <div className="feature">
                    <img src={`${staticRoot}img/icons/database.svg`} alt="icon" />
                    <p className="font-p3 text-gray">Advanced indexing and database storage reduce query times and remove the need to self-host expensive hardware like 2TB+ high-speed SSDs with extensive CPU resources.</p>
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
                        <p className="font-p3 text-gray">Get real-time access to network data with simple RESTful endpoints, delivering low-latency, high-availability insights into UTXOs, balances, mempool transactions, and fee estimates, with seamless transaction broadcasting.</p>
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
                        <p className="font-p2 text-gray"><a href="mailto:explorer-support@blockstream.com">Contact Support</a> now if you are looking for more tailored plans designed for high-volume and enterprise-grade applications.</p>
                        <a href="https://dashboard.blockstream.info" target="_blank" className="g-btn primary-btn">GET YOUR API KEY</a>
                    </div>
                </div>
            </div>
    
        </div>
    </div>
    , { t, activeTab: 'apiLanding', ...S })
}

export default LandingPage