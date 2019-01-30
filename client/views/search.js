import Snabbdom from 'snabbdom-pragma'

export default ({ t, klass, autofocus }) =>
  <form className="search form-inline ml-auto" action={process.browser?undefined:"search"}>
    <div className={`search-bar${klass?` ${klass}` : ''}`}>
      <input
        className="form-control search-bar-input"
        type="search"
        name="q"
        placeholder={t`Search for block height, hash, transaction, or address`}
        aria-label="Search"
        autofocus={!!autofocus}
        autocomplete="off"
      />
      <button className="search-bar-submit" type="image"></button>
    </div>
  </form>
