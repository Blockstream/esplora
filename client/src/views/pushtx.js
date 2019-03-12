import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

export default ({ t, ...S }) => layout(
  <div>
    <div className="jumbotron jumbotron-fluid block-page">
      <div className="container">
        <form data-do="pushtx" method="post" action="tx/push">
          <div className="form-group">
            <label className="col-form-label col-form-label-lg" for="rawtx"><h1>{t`Broadcast raw transaction (hex)`}</h1></label>
            <textarea className="form-control" id="rawtx" name="tx" rows="5"></textarea>
          </div>
          <input type="submit" value={t`Broadcast transaction`} className="btn btn-primary btn-xl" />
        </form>
      </div>
    </div>
  </div>
, { t, ...S })
