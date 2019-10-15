import 'babel-polyfill'
import { Observable as O } from './rxjs'

import { getMempoolDepth, getConfEstimate, calcSegwitFeeGains } from './lib/fees'
import getPrivacyAnalysis from './lib/privacy-analysis'
import { blockTxsPerPage, blocksPerPage } from './const'
import { dbg, combine, extractErrors, dropErrors, last, updateQuery, notNully, tryUnconfidentialAddress, parseHashes, isHash256, makeAddressQR } from './util'
import l10n, { defaultLang } from './l10n'
import * as views from './views'

if (process.browser) {
  require('bootstrap/js/dist/collapse')
}

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')
    , setBase = ({ path, ...r }) => ({ ...r, url: path.includes('://') ? path : apiBase + path })

const reservedPaths = [ 'mempool', 'assets' ]

// Temporary bug workaround. Listening with on('form.search', 'submit') was unable
// to catch some form submissions.
const searchSubmit$ = !process.browser ? O.empty() : O.fromEvent(document.body, 'submit')
  .filter(e => e.target.classList.contains('search'))

export default function main({ DOM, HTTP, route, storage, scanner: scan$, search: searchResult$ }) {
  const

    reply = (cat, raw) => dropErrors(HTTP.select(cat)).map(r => raw ? r : (r.body || r.text))
  , on    = (sel, ev, opt={}) => DOM.select(sel).events(ev, opt)
  , click = sel => on(sel, 'click').map(e => e.ownerTarget.dataset)

  /// User actions
  , page$     = route()
  , goHome$   = route('/').map(loc => ({ start_height: loc.query.start != null ? +loc.query.start : null }))
  , goBlock$  = route('/block/:hash').map(loc => ({ hash: loc.params.hash, start_index: +loc.query.start || 0 }))
  , goHeight$ = route('/block-height/:height').map(loc => loc.params.height)
  , goAddr$   = route('/address/:addr').map(loc => ({
      addr: tryUnconfidentialAddress(loc.params.addr)
    , last_txids: parseHashes(loc.query.txids)
    , est_chain_seen_count: +loc.query.c || 0 }))
  , goTx$     = route('/tx/:txid').map(loc => loc.params.txid).filter(isHash256)
  , goPush$   = route('/tx/push')
  , goRecent$ = route('/tx/recent')
  , goScan$   = route('/scan-qr').mapTo(true)
  , goMempool$= route('/mempool')
  , goSearch$ = route('/:q([a-zA-Z0-9]+)').map(loc => loc.params.q === 'search' ? loc.query.q : loc.params.q)
      .filter(q => !reservedPaths.includes(q))
      .merge(scan$)

  , goAsset$  = !process.env.ISSUED_ASSETS ? O.empty() : route('/asset/:asset_id').map(loc => ({
      asset_id: loc.params.asset_id
    , last_txids: parseHashes(loc.query.txids)
    , est_chain_seen_count: +loc.query.c || 0
    }))

  , goAssetList$ = !process.env.ISSUED_ASSETS || !process.env.ASSET_MAP_URL ? O.empty() : route('/assets')

  // auto-expand when opening with "#expand"
  , expandTx$ = route('/tx/:txid').filter(loc => loc.query.expand).map(loc => loc.params.txid)
  , expandBl$ = route('/block/:hash').filter(loc => loc.query.expand).map(loc => loc.params.hash)

  , togTx$    = click('[data-toggle-tx]').map(d => d.toggleTx).merge(page$.mapTo(null), expandTx$)
  , togBlock$ = click('[data-toggle-block]').map(d => d.toggleBlock).merge(page$.mapTo(null), expandBl$)
  , togTheme$ = click('.toggle-theme')

  , copy$     = click('[data-clipboard-copy]').map(d => d.clipboardCopy)
  , query$    = O.merge(searchSubmit$.map(e => e.target.querySelector('[name=q]').value), goSearch$)
  , pushtx$   = (process.browser
      ? on('form[data-do=pushtx]', 'submit', { preventDefault: true }).map(e => e.ownerTarget.querySelector('[name=tx]').value)
      : goPush$.filter(loc => loc.body && loc.body.tx).map(loc => loc.body.tx)
      ).map(hex => hex.replace(/\s+/g, ''))

  , moreBlocks$ = click('[data-loadmore-block-height]').map(d => ({ start_height: d.loadmoreBlockHeight }))
  , moreBTxs$   = click('[data-loadmore-txs-block]').map(d => ({ block: d.loadmoreTxsBlock, start_index: d.loadmoreTxsIndex }))
  , moreATxs$   = click('[data-loadmore-txs-addr]').map(d => ({ addr: d.loadmoreTxsAddr, last_txid: d.loadmoreTxsLastTxid }))
  , moreSTxs$   = click('[data-loadmore-txs-asset]').map(d => ({ asset_id: d.loadmoreTxsAsset, last_txid: d.loadmoreTxsLastTxid }))

  , lang$ = storage.local.getItem('lang').first().map(lang => lang || defaultLang)
      .concat(on('select[name=lang]', 'input').map(e => e.target.value))
      .distinctUntilChanged()

  /// Model

  , error$ = extractErrors(HTTP.select().filter(r$ => !r$.request.bg))
      .merge(searchResult$.filter(found => !found).mapTo('No results found'))

  , tipHeight$ = reply('tip-height', true).map(res => +res.text)

  // the translation function for the currently selected language
  , t$ = lang$.map(lang => l10n[lang] || l10n[defaultLang])

  // Active theme
  , theme$ = storage.local.getItem('theme').first().map(theme => theme || 'dark')
      .concat(togTheme$).scan(curr => curr == 'dark' ? 'light' : 'dark')

  // Scanner state (on/off)
  , scanning$ = O.merge(
      goScan$.mapTo(true)
    , page$.filter(l => l.pathname != '/scan-qr').mapTo(false)
    , scan$.mapTo(false)
    )

  // Keep track of the number of active in-flight HTTP requests
  , loading$ = HTTP.select().filter(r$ => !r$.request.bg)
      .flatMap(r$ => r$.mapTo(-1).catch(_ => O.of(-1)).startWith(+1))
      .merge(query$.mapTo(+1)).merge(searchResult$.mapTo(-1))
      .startWith(0).scan((N, a) => N+a)

  // Recent blocks
  , blocks$ = O.merge(
      reply('blocks').map(blocks => S => [ ...(S || []), ...blocks ])
    , goHome$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  , nextBlocks$ = blocks$.map(blocks => blocks && blocks.length && last(blocks).height).map(height => height > 0 ? height-1 : null)

  , prevBlocks$ = process.browser ? O.empty()
      : goHome$.combineLatest(tipHeight$, (d, tipHeight) => d.start_height != null && d.start_height < tipHeight ? Math.min(tipHeight, d.start_height+blocksPerPage) : null)

  // Single block and associated txs
  , block$ = reply('block').merge(goBlock$.mapTo(null))
  , blockStatus$ = reply('block-stat').merge(goBlock$.mapTo(null))
  , blockTxs$ = O.merge(
      reply('block-txs').map(txs => S => [ ...(S || []), ...txs ])
    , goBlock$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  , nextBlockTxs$ = O.combineLatest(goBlock$, block$, blockTxs$, (goBlock, block, txs) =>
      block && txs && block.tx_count > goBlock.start_index+txs.length ? goBlock.start_index+txs.length : null)

  , prevBlockTxs$ = process.browser ? O.empty()
    : O.combineLatest(goBlock$, block$, (goBlock, block) => block && goBlock.start_index > 0 ? goBlock.start_index-blockTxsPerPage: null)

  // Hash by height search
  , byHeight$ = reply('height', true).map(r => r.text)

  // Address and associated txs
  , addr$ = reply('address').merge(goAddr$.mapTo(null))
  , addrQR$ = addr$.flatMap(addr => addr ? makeAddressQR(addr.address) : [])
  , addrTxs$ = O.merge(
      reply('addr-txs').map(txs => S => txs)
    , reply('addr-txs-more').map(txs => S => [ ...S, ...txs ])
    , goAddr$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  // Single TX
  , tx$ = reply('tx').merge(goTx$.mapTo(null)).startWith(null)

  // Currently collapsed tx/block ("details")
  , openTx$ = togTx$.startWith(null).scan((prev, txid) => prev == txid ? null : txid)
  , openBlock$ = togBlock$.startWith(null).scan((prev, blockhash) => prev == blockhash ? null : blockhash)

  // Spending txs map (reset on every page nav)
  , spends$ = O.merge(
    reply('tx-spends', true).map(r => S => ({ ...S, [r.request.txid]: r.body }))
  , page$.mapTo(S => ({}))
  ).startWith({}).scan((S, mod) => mod(S))

  // Pushed tx result (txid)
  , pushedtx$ = reply('pushtx', true).map(r => r.text)

  // Mempool backlog stats
  , mempool$ = reply('mempool').startWith(null)
  , mempoolRecent$ = reply('recent')

  // Fee estimates
  , feeEst$ = reply('fee-est').startWith(null)

  // Transaction analysis
  , txAnalysis$ = tx$.filter(Boolean)
      .combineLatest(mempool$, feeEst$, (tx, mempool, feeEst) =>
          ({ tx, mempool, feeEst, feerate: tx.fee ? tx.fee / tx.weight * 4 : null }))
      .map(({ tx, feerate, mempool, feeEst }) => ({
        feerate
      , privacyAnalysis: getPrivacyAnalysis(tx)
      , segwitGains: calcSegwitFeeGains(tx)
      , mempoolDepth: !tx.status.confirmed && feerate != null && mempool ? getMempoolDepth(mempool.fee_histogram, feerate) : null
      , confEstimate: !tx.status.confirmed && feerate != null && feeEst ? getConfEstimate(feeEst, feerate) : null
      , overpaying: !tx.status.confirmed && feerate != null && feeEst && feeEst[2] != null ? feerate/feeEst[2] : null
      }))

  // Asset and associated txs (elements only)
  , asset$ = !process.env.ISSUED_ASSETS ? O.empty() : reply('asset').merge(goAsset$.mapTo(null))
  , assetTxs$ = !process.env.ISSUED_ASSETS ? O.empty() : O.merge(
      reply('asset-txs').map(txs => S => txs)
    , reply('asset-txs-more').map(txs => S => [ ...S, ...txs ])
    , goAsset$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  // Asset map (elements only)
  , assetMap$ = !process.env.ASSET_MAP_URL ? O.of({}) :
      reply('asset-map')
        // use an empty object if the map fails loading for any reason
        .merge(extractErrors(HTTP.select('asset-map')).mapTo({}))

  // The minimally required data to start rendering the UI
  // In elements, we block rendering until the assetMap is loaded. Otherwise, we can start immediately.
  , isReady$ = process.env.ASSET_MAP_URL ? assetMap$.mapTo(true).startWith(false) : O.of(true)

  // Currently visible view
  , view$ = O.merge(page$.mapTo(null)
                  , goHome$.mapTo('recentBlocks')
                  , goRecent$.mapTo('recentTxs')
                  , block$.filter(notNully).mapTo('block')
                  , tx$.filter(notNully).mapTo('tx')
                  , addr$.filter(notNully).mapTo('addr')
                  , asset$.filter(notNully).mapTo('asset')
                  , goPush$.mapTo('pushtx')
                  , goScan$.mapTo('scan')
                  , goMempool$.mapTo('mempool')
                  , goAssetList$.mapTo('assetList')
                  , error$.mapTo('error'))
      .combineLatest(isReady$, loading$, (view, isReady, loading) =>
        !isReady ? 'loading' : view || (loading ? 'loading' : 'notFound'))

  // Page title
  , title$ = O.merge(page$.mapTo(null)
                   , block$.filter(notNully).withLatestFrom(t$, (block, t) => t`Block #${block.height}: ${block.id}`)
                   , tx$.filter(notNully).withLatestFrom(t$, (tx, t) => t`Transaction: ${tx.txid}`)
                   , addr$.filter(notNully).withLatestFrom(t$, (addr, t) => t`Address: ${addr.address}`)
                   , asset$.filter(notNully).withLatestFrom(t$, (asset, t) => t`Asset: ${asset.asset_id}`)
                   , goAssetList$.withLatestFrom(t$, (_, t) => t`Registered assets`)
                   , goPush$.withLatestFrom(t$, (_, t) => t`Broadcast transaction`)
                   , goMempool$.withLatestFrom(t$, (_, t) => t`Mempool`)
                   , goRecent$.withLatestFrom(t$, (_, t) => t`Recent transactions`))

  // App state
  , state$ = combine({ t$, error$, tipHeight$, spends$
                     , goHome$, blocks$, nextBlocks$, prevBlocks$
                     , goBlock$, block$, blockStatus$, blockTxs$, nextBlockTxs$, prevBlockTxs$, openBlock$
                     , mempool$, mempoolRecent$, feeEst$
                     , tx$, txAnalysis$, openTx$
                     , goAddr$, addr$, addrTxs$, addrQR$
                     , assetMap$, goAsset$, asset$, assetTxs$
                     , isReady$, loading$, page$, view$, title$, theme$
                     })

  // Update query options with ?expand
  , updateQuery$ = O.merge(
      openTx$.withLatestFrom(view$).filter(([ _, view]) => view == 'tx').pluck(0)
    , openBlock$.withLatestFrom(view$).filter(([ _, view]) => view == 'block').pluck(0)
    )
    .map(Boolean).distinctUntilChanged()
    .withLatestFrom(route.all$)
    .filter(([ expand, page ]) => page.query.expand != expand)
    .map(([ expand, page ]) => [ page.pathname, updateQuery(page.query, { expand }) ])

  /// Sinks

  // HTTP request sink
  , req$ = O.merge(
    // fetch single block, its status and its txs
      goBlock$.flatMap(d    => [{ category: 'block',      method: 'GET', path: `/block/${d.hash}` }
                              , { category: 'block-stat', method: 'GET', path: `/block/${d.hash}/status` }
                              , { category: 'block-txs',  method: 'GET', path: `/block/${d.hash}/txs/${d.start_index}` } ])

    // fetch single tx (including confirmation status)
    , goTx$.map(txid        => ({ category: 'tx',         method: 'GET', path: `/tx/${txid}` }))

    // fetch address and its txs
    , goAddr$.flatMap(d     => [{ category: 'address',    method: 'GET', path: `/address/${d.addr}` }
                              , d.last_txids.length
                              ? { category: 'addr-txs',   method: 'GET', path: `/address/${d.addr}/txs/chain/${last(d.last_txids)}` }
                              : { category: 'addr-txs',   method: 'GET', path: `/address/${d.addr}/txs` }])

    // fetch list of blocks for homepage
    , O.merge(goHome$, moreBlocks$)
        .map(d              => ({ category: 'blocks',     method: 'GET', path: `/blocks/${d.start_height == null ? '' : d.start_height}` }))

    // fetch more txs for block page
    , moreBTxs$.map(d       => ({ category: 'block-txs',  method: 'GET', path: `/block/${d.block}/txs/${d.start_index}` }))

    // fetch more txs for address page
    , moreATxs$.map(d       => ({ category: 'addr-txs-more', method: 'GET', path: `/address/${d.addr}/txs/chain/${d.last_txid}` }))

    // fetch block by height
    , goHeight$.map(n       => ({ category: 'height',     method: 'GET', path: `/block-height/${n}` }))

    // push tx
    , pushtx$.map(rawtx     => ({ category: 'pushtx',     method: 'POST', path: `/tx`, send: rawtx, type: 'text/plain' }))

    // fetch spending txs when viewing advanced details
    , openTx$.filter(notNully)
        .map(txid           => ({ category: 'tx-spends',  method: 'GET', path: `/tx/${txid}/outspends`, txid }))

    // in browser env, get the tip every 30s (but only when the page is active) or when we render a block/tx/addr, but not more than once every 5s
    // in server env, just get it once
    , (process.browser ? O.merge(O.timer(0, 30000).filter(() => document.hasFocus()), goBlock$, goTx$, goAddr$).startWith(1).throttleTime(5000)
                       : O.of(1)
        ).mapTo(                { category: 'tip-height', method: 'GET', path: '/blocks/tip/height', bg: !!process.browser } )

    // fetch mempool backlog stats and fee estimates as foregrounds request when opening the mempool page
    , goMempool$.flatMap(_ =>  [{ category: 'mempool',    method: 'GET', path: '/mempool' }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates' }])

    // fetch backlog stats and fee estimates in the background when opening a tx, or every 30 seconds while the mempool or unconfirmed tx page remains open
    , goTx$.merge(process.browser ? O.timer(0, 30000).withLatestFrom(view$, tx$)
                                                    .filter(([ _, view, tx ]) => view == 'mempool' || (view == 'tx' && tx && !tx.status.confirmed))
                                                    .filter(_ => document.hasFocus())
                                  : O.empty())
        .flatMap(_ =>          [{ category: 'mempool',    method: 'GET', path: '/mempool', bg: !!process.browser }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates', bg: !!process.browser }])

    // fetch recent mempool txs when opening the recent txs page
    , goRecent$.mapTo(          { category: 'recent',     method: 'GET', path: '/mempool/recent' })
    // ... and every 10 seconds while it remains open
    , !process.browser ? O.empty() : O.timer(0, 10000).withLatestFrom(view$).filter(([ _, view ]) => view == 'recentTxs' && document.hasFocus())
        .mapTo(                 { category: 'recent',     method: 'GET', path: '/mempool/recent', bg: true })


    //
    // elements/liquid only
    //

    // fetch asset map index on page load (once, as a foreground request)
    , !process.env.ASSET_MAP_URL ? O.empty() : O.of(
                                { category: 'asset-map',  method: 'GET', path: process.env.ASSET_MAP_URL, bg: true })

    // fetch asset and its txs
    , !process.env.ISSUED_ASSETS ? O.empty() :
        goAsset$.flatMap(d  => [{ category: 'asset',      method: 'GET', path: `/asset/${d.asset_id}` }
                              , d.last_txids.length
                              ? { category: 'asset-txs',  method: 'GET', path: `/asset/${d.asset_id}/txs/chain/${last(d.last_txids)}` }
                              : { category: 'asset-txs',  method: 'GET', path: `/asset/${d.asset_id}/txs` }])

    // fetch more txs for asset page
    , moreSTxs$.map(d       => ({ category: 'asset-txs-more', method: 'GET', path: `/asset/${d.asset_id}/txs/chain/${d.last_txid}` }))

    ).map(setBase)

  // DOM sink
  , vdom$ = state$.map(S => S.view && views[S.view](S) || null)

  // localStorage sink
  , store$ = O.merge(
      lang$.skip(1).map(lang => ({ key: 'lang', value: lang }))
    , theme$.skip(1).map(theme => ({ key: 'theme', value: theme }))
  )

  // Route navigation sink
  , navto$ = O.merge(
      searchResult$.filter(Boolean).map(result => ({ type: 'push', ...result }))
    , byHeight$.map(hash => ({ type: 'replace', pathname: `/block/${hash}` }))
    , pushedtx$.map(txid => ({ type: 'push', pathname: `/tx/${txid}` }))
    // XXX: replace still uses a single string with the search query (https://github.com/cyclejs/cyclejs/pull/890#issuecomment-542413707)
    , updateQuery$.map(([ pathname, qs ]) => ({ type: 'replace', pathname: pathname+qs, state: { noRouting: true } }))
  )

  dbg({ goHome$, goBlock$, goTx$, togTx$, page$, lang$, vdom$
      , openTx$, openBlock$, updateQuery$
      , state$, view$, block$, blockTxs$, blocks$, tx$, txAnalysis$, spends$
      , tipHeight$, error$, loading$
      , query$, searchResult$, copy$, store$, navto$, scanning$, scan$
      , assetMap$
      , req$, reply$: dropErrors(HTTP.select()).map(r => [ r.request.category, r.req.method, r.req.url, r.body||r.text, r ]) })

  // @XXX side-effects outside of drivers
  if (process.browser) {

    searchSubmit$.subscribe(e => e.preventDefault())

    // Click-to-copy
    if (navigator.clipboard) copy$.subscribe(text => navigator.clipboard.writeText(text))

    // Switch stylesheet based on current language
    const stylesheet = document.querySelector('link[href="style.css"]')
    t$.map(t => t`style.css`).distinctUntilChanged().subscribe(styleSrc =>
      stylesheet.getAttribute('href') != styleSrc && (stylesheet.href = styleSrc))

    // Apply dark/light theme, language and text direction to root element
    theme$.subscribe(theme => {
      document.body.classList.remove('theme-dark', 'theme-light')
      document.body.classList.add(`theme-${theme}`)
    })
    t$.subscribe(t => {
      document.body.setAttribute('lang', t.lang_id)
      document.body.setAttribute('dir', t`ltr`)
    })

    // Reset scrolling when navigating to a new page (but not when hitting 'back')
    page$.startWith([ ]).scan((prevKeys, loc) => [ ...prevKeys.slice(0, 15), loc.key ])
      .filter(keys => keys.length && !keys.slice(0, -1).includes(last(keys)))
      .subscribe(_ => window.scrollTo(0, 0))

    // Scroll elements selected via URL hash into view
    DOM.select('.ins-and-outs .selected').elements()
      .filter(els => !!els.length)
      .map(els => els[0])
      .distinctUntilChanged().delay(300)
      .subscribe(el => el.scrollIntoView({ behavior: 'smooth' }))

    // Display "Copied!" tooltip
    on('[data-clipboard-copy]', 'click').subscribe(({ ownerTarget: btn }) => {
      btn.classList.add('show-tooltip')
      setTimeout(_ => btn.classList.remove('show-tooltip'), 700)
    })
  }

  return { DOM: vdom$, HTTP: req$, route: navto$, storage: store$, search: query$, scanner: scanning$, title: title$, state: state$ }
}
