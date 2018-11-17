import Snabbdom from 'snabbdom-pragma'
import menu from './navbar-menu'

export default ({ t }) =>
  <nav className="navbar navbar-dark navbar-expand-lg">
    <div className="container">
      <a className="navbar-brand" href=".">
        <img src="img/icons/blockstream-logo.png" height="54" className="d-inline-block align-top" alt="" />
      </a>

      <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbar-menu" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <span className="navbar-toggler-icon"></span>
      </button>

      <div className="collapse navbar-collapse" id="navbar-menu">
        { menu({ t }) }
      </div>
    </div>
  </nav>
