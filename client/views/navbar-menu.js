import Snabbdom from 'snabbdom-pragma'

const items  = process.env.MENU_ITEMS && JSON.parse(process.env.MENU_ITEMS)
    , active = process.env.MENU_ACTIVE

export default ({ t }) =>

  <ul className="navbar-nav">
    { items && Object.entries(items).map(([ name, url ]) =>
        <li className={`nav-item ${name == active ? 'active' : ''}`}>
          <a className="nav-link" href={url} rel="external">{t(name)}</a>
        </li>
    ) }
    <li className="nav-item nav-toggler">
      <div className="nav-bar_moon_icon toggle-theme"></div>
    </li>
  </ul>
