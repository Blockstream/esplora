import Snabbdom from 'snabbdom-pragma'

const links = process.env.FOOTER_LINKS ? JSON.parse(process.env.FOOTER_LINKS) : { 'img/github_blue.png': 'https://github.com/blockstream/esplora' }

export default ({ t }) =>
  <footer className="footer">
    <div className="container">

      <div className="footer-logo"></div>

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
          <select className="language-selector" name="lang">
            { Object.entries(t.langs).map(([ lang_id, lang_t ]) =>
              <option value={lang_id} selected={lang_id == t.lang_id}>{lang_t`lang_name`}</option>
            )}
          </select>
        </div>
        <div className="footer_container_content_copyright">{ process.env.SITE_FOOTER || t`Powered by esplora` }</div>
      </div>
    </div>
  </footer>
