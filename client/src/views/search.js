import { loadingRing } from '../components/loading'
import AssetIcon from '../components/asset-icon'
import { autocompleteCategoryOrder } from '../const'
import { assetDomain, assetIconHref } from '../lib/search-autocomplete'
import {
  DefaultAssetIcon,
  BlockIcon,
  TxArrowsIcon,
  AddressHamburgerIcon,
} from '../components/icons'

const staticRoot = process.env.STATIC_ROOT || ''
const hasCam = process.browser && navigator.mediaDevices && navigator.mediaDevices.getUserMedia

const categoryLabel = (t, category) => category == 'assets' ? t`Assets`
      : category == 'blocks' ? t`Blocks`
      : category == 'transactions' ? t`Transactions`
      : t`Addresses`
    , categoryIcon = category => category == 'assets' ? <DefaultAssetIcon />
      : category == 'blocks' ? <BlockIcon />
      : category == 'transactions' ? <TxArrowsIcon />
      : <AddressHamburgerIcon />
    , assetPrimary = asset => {
        const ticker = asset && asset.ticker
            , name = asset && asset.name

        return ticker && name ? `${ticker} — ${name}`
          : name || ticker || assetDomain(asset) || asset && asset.asset_id
      }

const resultContent = (t, result) => {
  if (result.category == 'assets') {
    const asset = result.asset || {}
        , primary = assetPrimary(asset)
        , assetId = asset.asset_id
        , domain = assetDomain(asset)
        , showDomain = !!domain && domain != primary
        , showAssetId = primary != assetId

    return [
      <AssetIcon href={assetIconHref(asset)} />,
      <span className="search-autocomplete-text">
        <span className="search-autocomplete-primary">{primary}</span>
        {showDomain || showAssetId ? <span className="search-autocomplete-secondary">
          {showDomain ? <span className="search-autocomplete-domain">{domain}</span> : ''}
          {showDomain && showAssetId ? ' · ' : ''}
          {showAssetId ? <span className="mono">{assetId}</span> : ''}
        </span> : ''}
      </span>
    ]
  }

  if (result.category == 'blocks') {
    const height = result.block && result.block.height
    return [
      <span className="search-autocomplete-primary">{height != null ? t`Block #${height}` : t`Block`}</span>,
      <span className="search-autocomplete-secondary mono">{result.hash}</span>
    ]
  }

  return <span className="search-autocomplete-primary mono">
    {result.category == 'transactions' ? result.txid : result.address}
  </span>
}

const autocompleteResults = ({ t, results, activeIndex }) => {
  const indexedResults = results.map((result, index) => ({ result, index }))

  return <div className="search-autocomplete-results" id="search-autocomplete-results" role="listbox">
    {autocompleteCategoryOrder.map(category => {
      const matches = indexedResults.filter(({ result }) => result.category == category)
          , headingId = `search-autocomplete-${category}`

      return matches.length ? <div className="search-autocomplete-group" role="group" aria-labelledby={headingId} key={category}>
        <div className="search-autocomplete-heading" id={headingId}>
          <span className="search-autocomplete-heading-icon">{categoryIcon(category)}</span>
          <span>{`${categoryLabel(t, category)} (${matches.length})`}</span>
        </div>
        {matches.map(({ result, index }) =>
          <a
            className={`search-autocomplete-option${category == 'assets' ? ' search-autocomplete-asset-option' : ''}${activeIndex == index ? ' active' : ''}`}
            id={`search-autocomplete-option-${index}`}
            href={result.pathname.substr(1)}
            role="option"
            tabindex="-1"
            aria-selected={activeIndex == index ? 'true' : 'false'}
            data-autocompleteIndex={index}
            key={result.id}
          >
            {resultContent(t, result)}
          </a>
        )}
      </div> : ''
    })}
  </div>
}

export default ({ t, klass, autofocus, autocomplete }) => {
  const {
    results=[],
    loading=false,
    focused=false,
    dismissed=false,
    activeIndex=-1,
  } = autocomplete || {}
      , expanded = focused && !dismissed && !!results.length

  return <form className="search" action={process.browser?undefined:"search"}>
      <div className={`search-bar${klass?` ${klass}` : ''}`}>
        <button className="search-bar-submit" type="submit" aria-label={t`Search`}>
          { loading
            ? <span className="search-bar-loading spinner spinner-immediate" aria-hidden="true">{loadingRing('small')}</span>
            : <img src={`${staticRoot}img/icons/magnifying-glass.svg`} alt="" /> }
        </button>
        <input
          className="form-control search-bar-input"
          type="search"
          name="q"
          placeholder={process.env.IS_ELEMENTS
            ? t`Search for asset, block height, hash, transaction, or address`
            : t`Search for block height, hash, transaction, or address`}
          aria-label="Search"
          aria-autocomplete={process.env.IS_ELEMENTS ? 'list' : undefined}
          aria-busy={process.env.IS_ELEMENTS ? (loading ? 'true' : 'false') : undefined}
          aria-controls={process.env.IS_ELEMENTS ? 'search-autocomplete-results' : undefined}
          aria-expanded={process.env.IS_ELEMENTS ? (expanded ? 'true' : 'false') : undefined}
          aria-activedescendant={expanded && activeIndex >= 0 ? `search-autocomplete-option-${activeIndex}` : undefined}
          role={process.env.IS_ELEMENTS ? 'combobox' : undefined}
          autofocus={!!autofocus}
          required
          autocomplete="off"
        />
        <p className="search-focus-hotkey">⌘K</p>
        { hasCam ? <a className="qrcode-link" href="scan-qr"><img src={`${staticRoot}img/icons/qrcode.svg`}/></a>: "" }
      </div>
      { expanded ? autocompleteResults({ t, results, activeIndex }) : '' }
    </form>
}
