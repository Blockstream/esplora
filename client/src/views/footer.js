import { ChevronDownIcon } from '../components/icons'

const staticRoot = process.env.STATIC_ROOT || ''

const productLinks = [
  ['Blockstream App', 'https://blockstream.com/app/'],
  ['Blockstream Jade', 'https://blockstream.com/jade/'],
  ['Blockstream Enterprise', 'https://blockstream.com/enterprise/'],
  ['Blockstream AMP', 'https://blockstream.com/amp/'],
  ['Blockstream Explorer', 'https://blockstream.info/'],
  ['Greenlight', 'https://blockstream.com/lightning/greenlight/'],
  ['Cryptocurrency Data Feed', 'https://blockstream.com/cryptofeed/'],
  ['Liquid Network', 'https://blockstream.com/liquid/'],
  ['Core Lightning', 'https://blockstream.com/lightning/'],
  ['Elements', 'https://blockstream.com/elements/'],
  ['Simplicity', 'https://simplicity-lang.org/']
]

const developerLinks = [
  ['Engineering', 'https://blog.blockstream.com/blockstream-research/'],
  ['Liquid Documentation', 'https://docs.liquid.net/docs/'],
  ['Core Lightning Documentation', 'https://docs.corelightning.org/docs/']
]

const companyLinks = [
  ['Research', 'https://research.blockstream.com/'],
  ['About', 'https://blockstream.com/about/'],
  ['Careers', 'https://blockstream.com/careers/']
]

const resourceLinks = [
  ['Help Center', 'https://help.blockstream.com/'],
  ['Bitcoin Education', 'https://help.blockstream.com/education/'],
  ['Glossary', 'https://help.blockstream.com/education/glossary/'],
  ['Local', 'https://blockstream.com/local/'],
  ['Brand Assets', 'https://design.blockstream.com/styleguide/branding/overview/']
]

const socialLinks = [
  ['X', 'https://x.com/Blockstream', 'x.svg'],
  ['LinkedIn', 'https://ca.linkedin.com/company/blockstream', 'linkedin.svg'],
  ['Facebook', 'https://www.facebook.com/Blockstream/', 'fb.svg'],
  ['Telegram', 'https://t.me/blockstream', 'telegram.svg'],
  ['YouTube', 'https://www.youtube.com/channel/UCZNt3fZazX9cwWcC9vjDJ4Q', 'yt.svg']
]

const externalLink = ([ label, href ]) => <a href={href}>{label}</a>

const linkSection = (title, sectionLinks, className = '') =>
  <section className={`blockstream-footer-section ${className}`}>
    <h2>{title}</h2>
    <div className="blockstream-footer-links">
      { sectionLinks.map(externalLink) }
    </div>
  </section>

const productSection = () =>
  <section className="blockstream-footer-section blockstream-footer-products">
    <h2>Products</h2>
    <div className="blockstream-footer-product-columns">
      <div className="blockstream-footer-links">
        { productLinks.slice(0, 6).map(externalLink) }
      </div>
      <div className="blockstream-footer-links">
        { productLinks.slice(6).map(externalLink) }
      </div>
    </div>
  </section>

const languageForm = ({ t, page }) =>
  <form className="language-form" method="get">
    { !process.browser && Object.entries(page.query).map(([ k, v ]) =>
      k != 'lang' && <input type="hidden" name={k} value={v} />
    ) }
    <select className="language-selector" name="lang">
      { Object.entries(t.langs).map(([ lang_id, lang_t ]) =>
        <option value={lang_id} attrs={lang_id == t.lang_id ? { selected: true } : {}}>{lang_t`lang_name`}</option>
      ) }
    </select>
    <ChevronDownIcon className="language-selector-arrow" />
    { !process.browser && <input type="submit" className="language-submit" value={t`Go`} /> }
  </form>

const blockstreamFooter = opt =>
  <footer className="footer blockstream-footer">
    <div className="container blockstream-footer-container">
      <div className="blockstream-footer-content">
        <section className="blockstream-footer-brand">
          <a
            className="blockstream-footer-logo"
            href="https://blockstream.com/"
            aria-label="Blockstream"
          >
            <img src={staticRoot + 'img/icons/logo.svg'} alt="Blockstream" />
          </a>

          <div className="blockstream-footer-socials">
            { socialLinks.map(([ label, href, icon ]) =>
              <a href={href} rel="noopener noreferrer" aria-label={label}>
                <img src={staticRoot + 'img/icons/' + icon} alt="" />
              </a>
            ) }
          </div>

          <div className="language">
            { languageForm(opt) }
          </div>

          <a
            className="blockstream-footer-contact"
            href="https://blockstream.com/contact/"
            rel="noopener noreferrer"
          >
            Contact us
          </a>
        </section>

        <div className="blockstream-footer-product-sections">
        { productSection() }
        { linkSection('Developers', developerLinks, 'blockstream-footer-developers') }
        { linkSection('Company', companyLinks, 'blockstream-footer-company') }
        { linkSection('Resources', resourceLinks, 'blockstream-footer-resources') }
        </div>
      </div>

      <div className="blockstream-footer-legal">
        <div className="blockstream-footer-policies">
          <a href={process.env.TERMS || 'https://blockstream.com/terms/'}>Terms</a>
          <span aria-hidden="true"></span>
          <a href={process.env.PRIVACY || 'https://blockstream.com/privacy/'}>Privacy</a>
        </div>
        <p>
          { process.env.SITE_FOOTER ||
            `© ${new Date().getFullYear()} Blockstream Corporation Inc. All rights reserved.` }
        </p>
      </div>
    </div>
  </footer>

export default blockstreamFooter;
