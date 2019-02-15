import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

export default S => layout(
  <div>
    <div className="qr-scanner">
      <div className="indicator">
        <div className="bordertop" />
        <div className="borderbottom" />
      </div>
      <div className="btns">
        <a className="btn btn-primary btn-lg" href=".">Cancel</a>
      </div>
    </div>
  </div>
, S)
