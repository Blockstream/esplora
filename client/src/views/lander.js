import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const staticRoot = process.env.STATIC_ROOT || ''

const LandingPage = ({ t, ...S }) => layout(
  <div className="landing-page">      
  <div className="blur-orange"></div>
  <div className="blur-green"></div>
    <div className="hero-section">
      <div className="container text-center">
        <h1 className="font-h1">Powering Bitcoin and Liquid Applications with Real-Time Blockchain Data</h1>
        <p className="font-p1 text-gray">Built to simplify development and enhance performance for existing Bitcoin and Liquid applications, the Blockstream Explorer API offers faster address lookups, robust DoS protection, and seamless integration.</p>
        <a href="https://blockstream.com/explorerbeta" target="_blank" className="g-btn primary-btn">JOIN OPEN BETA</a>
      </div>
    </div>

    <div className="container">
      <div className="logos-section">
        <div className="logos">
          <img src={`${staticRoot}img/logos/bull-bitcoin.svg`} alt="Bull Bitcoin Logo" />
          <img src={`${staticRoot}img/logos/sideswap.svg`} alt="SideSwap Logo" />
          <img src={`${staticRoot}img/logos/sparrow.png`} alt="Sparrow Bitcoin Wallet Logo" />
          <img src={`${staticRoot}img/logos/blockstream-green.svg`} alt="Blockstream Green Logo" />
          <img src={`${staticRoot}img/logos/lwk.svg`} alt="LWK Logo" />
          <img src={`${staticRoot}img/logos/aqua.svg`} alt="Aqua Logo" />
          <img src={`${staticRoot}img/logos/bitcoin-dev-kit.svg`} alt="Bitcoin Dev Kit" />
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
                <p className="font-p3 text-gray">With no persistent logging and full end-to-end encryption, the service ensures confidentiality and adherence to best practices. Robust security protocols eliminate the need for self-managed security solutions.</p>
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
                <p className="font-p3 text-gray">Access data across Bitcoin Mainnet, Testnet, Signet, and Liquid networks, offering a broad spectrum of blockchain data for diverse applications.</p>
            </div>
            <div className="feature">
                <img src={`${staticRoot}img/icons/security-tokens.svg`} alt="icon" />
                <p className="font-p3 text-gray">An HTTP REST API (with Electrs RPC coming soon) provides extended transaction details and seamless integration.</p>
            </div>
            <div className="feature">
                <img src={`${staticRoot}img/icons/issuance.svg`} alt="icon" />
                <p className="font-p3 text-gray">Partner with Blockstream for seamless integration, unmatched performance, and dedicated ongoing support.</p>
            </div>
            <div className="feature">
                <img src={`${staticRoot}img/icons/lbtc.svg`} alt="icon" />
                <p className="font-p3 text-gray">Fully encrypted connections and secure access ensure data integrity, delivering reliable performance for mission-critical operations.</p>
            </div>
            <div className="feature">
                <img src={`${staticRoot}img/icons/security-tokens.svg`} alt="icon" />
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
                    <h2 className="font-h2">HTTP Rest API</h2>
                    <p className="font-p3 text-gray">Access real-time blockchain data with low latency and high throughput, ensuring the most up-to-date information for your applications.</p>
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
                    <img src={`${staticRoot}img/icons/pricing.svg`} alt="icon" />
                    <span className="pricing-term">FREE UP TO</span>
                    <h3 className="font-h3">500k <span>Requests/Month</span></h3>
                    <p className="font-p2 text-gray">Free API usage for unauthenticated users is capped at ~16K requests per day. Users exceeding this limit will need to provide an email for authentication, API key access, billing, and support to transition to the premium service.</p>
                </div>
                <div className="pricing-card">
                    <img src={`${staticRoot}img/icons/pricing.svg`} alt="icon" />
                    <span className="pricing-term">ONLY PAY FOR WHAT YOU USE</span>
                    <div className="pricing-table">
                        <div className="pricing-table-row">
                            <div className="pricing-table-price">
                                <span className="currency">$</span>
                                <span className="amount">0.01</span>
                                <span className="rate">/100</span>
                            </div>
                            <div className="pricing-table-description">Next 15M Requests</div>
                        </div>

                        <div className="pricing-table-row">
                            <div className="pricing-table-price">
                                <span className="currency">$</span>
                                <span className="amount">0.01</span>
                                <span className="rate">/200</span>
                            </div>
                            <div className="pricing-table-description">Following 15M Requests</div>
                        </div>

                        <div className="pricing-table-row">
                            <div className="pricing-table-price">
                                <span className="currency">$</span>
                                <span className="amount">0.01</span>
                                <span className="rate">/500</span>
                            </div>
                            <div className="pricing-table-description">Beyond 30M Requests</div>
                        </div>

                        <div className="pricing-table-row">
                            <div className="pricing-table-price">
                                <span className="currency">$</span>
                                <span className="amount">4,000</span>
                            </div>
                            <div className="pricing-table-description">Above 60M Requests Unlimited Usage</div>
                        </div>
                    </div>
                    <p className="font-p2 text-gray">Contact Support now if you are looking for more tailored plans designed for high-volume and enterprise-grade applications.</p>
                    <a href="https://blockstream.com/explorerbeta" target="_blank" className="g-btn primary-btn">JOIN THE OPEN BETA NOW</a>
                </div>
            </div>
        </div>
  
      </div>

  </div>
, { t, activeTab: 'landing', ...S })

export default LandingPage