import Snabbdom from 'snabbdom-pragma'

export default ({ t, klass, autofocus }) =>
  <form className="search form-inline ml-auto" action=".">
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
      <button className="search-bar-submit" type="image" name="submit">
        <img className="search-bar-submit-image" src="img/icons/search.svg" alt="" />
      </button>
    </div>
  </form>
