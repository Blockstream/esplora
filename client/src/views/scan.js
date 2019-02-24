import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

export default ({ t, ...S }) => layout(
  <div>
    <div className="qr-scanner">
      <div className="indicator">
        <div className="bordertop" />
        <div className="borderbottom" />
      </div>
      <div className="btns">
        <a className="btn btn-primary btn-lg" href=".">{t`Cancel`}</a>
      </div>
    </div>
  </div>
, { ...S, t })
