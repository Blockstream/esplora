import search from './search'
import menu from './navbar-menu'
import networkSelection from './network-selection'

export default (t, isTouch, activeTab, page, autocomplete) =>
  <div className="sub-navbar">
    <div className="container sub-nav-container">
      { networkSelection({t, page}) }
      { search({ t, autofocus: !isTouch, autocomplete }) }
    </div>
  </div>
