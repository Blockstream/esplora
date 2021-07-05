import Snabbdom from 'snabbdom-pragma'

const staticRoot = process.env.STATIC_ROOT || ''
const links = process.env.FOOTER_LINKS ? JSON.parse(process.env.FOOTER_LINKS) : { [staticRoot+'img/github_blue.png']: 'https://github.com/blockstream/esplora' }


export default ({ t, page }) =>
  <footer className="footer">
    <div className="container">
      <div className="footer_container_content">
        <div className="footer_container_content_row">

          <div className="footer_container_content_row_social-media_container">
            { Object.entries(links).map(([ imgSrc, url ]) =>
                <a className="footer_container_content_row_social-media_link" href={url} target="_blank">
                  <img className="footer_container_content_row_social-media_item" alt="" src={imgSrc} />
                </a>
            ) }
          </div>

          { (process.env.ONION_V2 || process.env.ONION_V3) &&
            <div className="footer_container_content_row_onion_container">
              <div className="footer_container_content_row_onion_icon"></div>
              <div className="footer_container_content_row_onion_link-container">
                { process.env.ONION_V3 && <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V3 } target="_blank">Onion V3</a> }
                { process.env.ONION_V2 && <a className="footer_container_content_row_onion_link" href={ process.env.ONION_V2 } target="_blank">Onion V2</a> }
              </div>
            </div>
          }

        </div>
        <div className="footer_container_content_copyright">
          <div>
          { process.env.TERMS && <span><a href={ process.env.TERMS } target="_blank">Terms &amp; </a></span> }
          { process.env.PRIVACY && <span><a href={ process.env.PRIVACY } target="_blank">Privacy</a></span> }
          </div>
          <div>{ process.env.SITE_FOOTER || t`Powered by esplora` }</div>
        </div>
      </div>
    </div>
  </footer>
