import Snabbdom from 'snabbdom-pragma'

export default ({ t }) =>
  <footer className="footer">
    <div className="container">

      <div className="footer_container_blockstream-logo_container">
        <div className="footer_container_blockstream-logo"></div>
      </div>

      <div className="footer_container_content">

        <div className="footer_container_content_row">

          <div className="footer_container_content_row_onion_container">
            {/* <img className="footer_container_content_row_onion_icon" alt="" src="img/onion.svg" /> */}
            <div className="footer_container_content_row_onion_icon"></div>
            <div className="footer_container_content_row_onion_link-container">
                <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V3 } target="_blank">Onion V3</a>
                <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V2 } target="_blank">Onion V2</a>
            </div>
          </div>


          <div className="footer_container_content_row_social-media_container">
            <div>
              <a className="footer_container_content_row_social-media_link footer_twitter_link" href="https://twitter.com/Blockstream" target="_blank">
                <img className="footer_container_content_row_social-media_item" alt="" src="img/t1witter_blue.png" />
              </a>
            </div>
            <div>
              <a className="footer_container_content_row_social-media_link" href="https://ca.linkedin.com/company/blockstream" target="_blank">
                <img className="footer_container_content_row_social-media_item" alt="" src="img/linkedin_blue.png" />
              </a>
            </div>
            <div>
              <a className="footer_container_content_row_social-media_link" href="https://www.facebook.com/Blockstream/" target="_blank">
                <img className="footer_container_content_row_social-media_item" alt="" src="img/f1b_blue.png" />
              </a>
            </div>
            <div>
              <a className="footer_container_content_row_social-media_link" href="https://github.com/Blockstream" target="_blank">
                <img className="footer_container_content_row_social-media_item" alt="" src="img/github_blue.png" />
              </a>
            </div>
          </div>
          <span>
            <select className="language-selector" name="lang">
              { Object.entries(t.langs).map(([ lang_id, lang_t ]) =>
                <option value={lang_id} selected={lang_id == t.lang_id}>{lang_t`lang_name`}</option>
              )}
            </select>
          </span>

        </div>

      <div className="footer_container_content_copyright">{ process.env.SITE_FOOTER || t`Powered by esplora` }</div>
      </div>

    </div>
  </footer>
