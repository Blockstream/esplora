import navToggle from './nav-toggle'


const items  = process.env.MENU_ITEMS && JSON.parse(process.env.MENU_ITEMS)
    , active = process.env.MENU_ACTIVE

const staticRoot = process.env.STATIC_ROOT || ''

export default () =>

<div className="main-nav-container">
  { process.env.NAVBAR_HTML ? navToggle() : "" }
</div>
