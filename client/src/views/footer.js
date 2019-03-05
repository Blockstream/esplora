import Snabbdom from 'snabbdom-pragma'

const staticRoot = process.env.STATIC_ROOT || ''
const links = process.env.FOOTER_LINKS ? JSON.parse(process.env.FOOTER_LINKS) : { [staticRoot+'img/github_blue.png']: 'https://github.com/blockstream/esplora' }

const hasCam = process.browser && navigator.mediaDevices && navigator.mediaDevices.getUserMedia

export default ({ t, page }) =>
  <footer className="footer">
    <div className="container">

      <div className="footer-logo">
        <div className="footer-links">
          <a href="tx/push">{t`Broadcast tx`}</a> {' | '}
          { hasCam ? [ <a href="scan-qr">{t`Scan QR`}</a>, ' | '] : '' }
          <a href="https://github.com/Blockstream/esplora/blob/master/API.md">{t`API`}</a>
        </div>
      </div>

      <div className="footer_container_content">
        <div className="footer_container_content_row">

          { (process.env.ONION_V2 || process.env.ONION_V3) &&
            <div className="footer_container_content_row_onion_container">
              <div className="footer_container_content_row_onion_icon"></div>
              <div className="footer_container_content_row_onion_link-container">
                { process.env.ONION_V3 && <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V3 } target="_blank">Onion V3</a> }
                { process.env.ONION_V2 && <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V2 } target="_blank">Onion V2</a> }
              </div>
            </div>
          }

          <div className="footer_container_content_row_social-media_container">
            { Object.entries(links).map(([ imgSrc, url ]) =>
                <a className="footer_container_content_row_social-media_link" href={url} target="_blank">
                  <img className="footer_container_content_row_social-media_item" alt="" src={imgSrc} />
                </a>
            ) }
          </div>

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
        <div className="footer_container_content_copyright">{ process.env.SITE_FOOTER || t`Powered by esplora` }</div>
      </div>
    </div>
  </footer>
