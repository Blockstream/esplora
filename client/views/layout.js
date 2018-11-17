import Snabbdom from 'snabbdom-pragma'
import navbar from './navbar'
import footer from './footer'

export default (body, opt) =>
  <div className="explorer-container">
    <div className="content-wrap">
      { navbar(opt) }
      { body }
    </div>
    { footer(opt) }
  </div>
