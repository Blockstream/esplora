import Snabbdom from 'snabbdom-pragma'
import menu from './navbar-menu'

export default S =>

  <nav className="container nav-container">
      <a className="navbar-brand" href="."></a>
      { menu(S) }
  </nav>

