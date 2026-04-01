import Snabbdom from 'snabbdom-pragma'
import navToggle from './nav-toggle'


const items  = process.env.MENU_ITEMS && JSON.parse(process.env.MENU_ITEMS)
    , active = process.env.MENU_ACTIVE

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ t, theme, page }) =>

<div className="main-nav-container">
  { process.env.NAVBAR_HTML ? navToggle(t, theme, page) : "" }
</div>