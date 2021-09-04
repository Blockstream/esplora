import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

export default ({ t, ...S }) => layout(<div>
  <div className="loading-delay">
    <div className="container text-center">
      <h2>{t`Loading...`}</h2>
      <img src="img/Loading.gif" />
    </div>
  </div>
</div>, { t, ...S })
