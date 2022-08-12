import Snabbdom from 'snabbdom-pragma'
import layout from './layout'


export default ({ t, ...S }) => layout(<div>
    <div className="spinner">
          <div className="ring"></div>
          <div className="loading">{t`Loading`}</div>
      </div>
    </div>, { t, ...S })
