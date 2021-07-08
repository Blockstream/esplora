import Snabbdom from 'snabbdom-pragma'

const staticRoot = process.env.STATIC_ROOT || ''
const hasCam = process.browser && navigator.mediaDevices && navigator.mediaDevices.getUserMedia

export default ({ t, klass, autofocus }) =>
  <form className="search" action={process.browser?undefined:"search"}>
    <div className={`search-bar${klass?` ${klass}` : ''}`}>
      <input
        className="form-control search-bar-input"
        type="search"
        name="q"
        placeholder={t`Search for block height, hash, transaction, or address`}
        aria-label="Search"
        autofocus={!!autofocus}
        required
        autocomplete="off"
      />
      { hasCam ? <a className="qrcode-link" href="scan-qr"><img src={`${staticRoot}img/icons/qrcode.svg`}/></a>: "" }
      <button className="search-bar-submit" type="image"></button>
    </div>
  </form>
