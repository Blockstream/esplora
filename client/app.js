import 'babel-polyfill'
import 'bootstrap/js/dist/collapse'
import { Observable as O } from './rxjs'
import run from '@cycle/rxjs-run'
import storageDriver from '@cycle/storage'
import { makeHTTPDriver } from '@cycle/http'
import { makeDOMDriver } from '@cycle/dom'
import { makeHistoryDriver, captureClicks } from '@cycle/history'
import makeRouteDriver from './driver/route'
import makeSearchDriver from './driver/search'

import { dbg, combine, extractErrors, dropErrors, last, notNully, tryUnconfidentialAddress} from './util'
import l10n, { defaultLang } from './l10n'
import * as views from './views'

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')
    , setBase = ({ ...r, path }) => ({ ...r, url: apiBase + path })
    , initTitle = document.title

// Temporary bug workaround. Listening with on('form.search', 'submit') was unable
// to catch some form submissions.
const searchSubmit$ = O.fromEvent(document.body, 'submit')
  .filter(e => e.target.classList.contains('search'))

function main({ DOM, HTTP, route, storage, search: searchResult$ }) {
  const

    reply = (cat, raw) => dropErrors(HTTP.select(cat)).map(r => raw ? r : (r.body || r.text))
  , on    = (sel, ev, opt={}) => DOM.select(sel).events(ev, opt)
  , click = sel => on(sel, 'click').map(e => e.ownerTarget.dataset)

  /// User actions
  , route$    = route()
  , goHome$   = route('/')
  , goBlock$  = route('/block/:hash').map(loc => loc.params.hash)
  , goHeight$ = route('/block-height/:height').map(loc => loc.params.height)
  , goAddr$   = route('/address/:addr').map(loc => loc.params.addr).map(tryUnconfidentialAddress)
  , goTx$     = route('/tx/:txid').map(loc => loc.params.txid)
  , goSearch$ = route('/:q([a-zA-Z0-9]+)').map(loc => loc.params.q)
  , togTx$    = click('[data-toggle-tx]').map(d => d.toggleTx).merge(route$.mapTo(null))
  , togBlock$ = click('[data-toggle-block]').map(d => d.toggleBlock)
  , togTheme$ = click('.toggle-theme')
  , copy$     = click('[data-clipboard-copy]').map(d => d.clipboardCopy)
  , query$    = O.merge(searchSubmit$.map(e => e.target.querySelector('[name=q]').value), goSearch$)

  , moreBlocks$ = click('[data-loadmore-block-height]').map(d => ({ start_height: d.loadmoreBlockHeight }))
  , moreBTxs$   = click('[data-loadmore-txs-block]').map(d => ({ block: d.loadmoreTxsBlock, start_index: d.loadmoreTxsIndex }))
  , moreATxs$   = click('[data-loadmore-txs-addr]').map(d => ({ addr: d.loadmoreTxsAddr, start_index: d.loadmoreTxsIndex }))

  , lang$ = storage.local.getItem('lang').first().map(lang => lang || defaultLang)
      .concat(on('select[name=lang]', 'input').map(e => e.target.value))
      .distinctUntilChanged()

  /// Model

  , error$ = extractErrors(HTTP.select().filter(r$ => !r$.request.bg && !r$.request.ignore_err))

  , tipHeight$ = reply('tip-height').map(height => +height)

  // the translation function for the currently selected language
  , t$ = lang$.map(lang => l10n[lang] || l10n[defaultLang])

  // Active theme
  , theme$ = storage.local.getItem('theme').first().map(theme => theme || 'dark')
      .concat(togTheme$).scan(curr => curr == 'dark' ? 'light' : 'dark')

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

  , nextMoreBlocks$ = blocks$.map(blocks => blocks && blocks.length && last(blocks).height).map(height => height > 0 ? height-1 : null)

  // Single block and associated txs
  , block$ = reply('block').merge(goBlock$.mapTo(null))
  , blockStatus$ = reply('block-stat').merge(goBlock$.mapTo(null))
  , blockTxs$ = O.merge(
      reply('block-txs').map(txs => S => [ ...(S || []), ...txs ])
    , goBlock$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  , nextMoreBTxs$ = O.combineLatest(block$, blockTxs$, (block, txs) => block && txs && block.tx_count > txs.length ? txs.length : null)

  // Hash by height search
  , byHeight$ = reply('height')

  // Address and associated txs
  , addr$ = reply('address').merge(goAddr$.mapTo(null))
  , addrTxs$ = O.merge(
      reply('addr-txs').map(txs => S => [ ...(S || []), ...txs ])
    , goAddr$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  , nextMoreATxs$ = O.combineLatest(addr$, addrTxs$, (addr, txs) => addr && txs && addr.tx_count > txs.length ? txs.length : null)

  // Single TX
  , tx$ = reply('tx').merge(goTx$.mapTo(null))

  // Currently collapsed tx/block ("details")
  , openTx$ = togTx$.startWith(null).scan((prev, txid) => prev == txid ? null : txid)
  , openBlock$ = togBlock$.startWith(null).scan((prev, blockhash) => prev == blockhash ? null : blockhash)

  // Spending txs map (reset on every page nav)
  , spends$ = O.merge(
    reply('tx-spends', true).map(r => S => ({ ...S, [r.request.txid]: r.body }))
  , route$.mapTo(S => ({}))
  ).startWith({}).scan((S, mod) => mod(S))

  // Currently visible view
  , view$ = O.merge(route$.mapTo(null)
                  , blocks$.filter(notNully).mapTo('home')
                  , block$.filter(notNully).mapTo('block')
                  , tx$.filter(notNully).mapTo('tx')
                  , addr$.filter(notNully).mapTo('addr')
                  , error$.mapTo('error'))
      .combineLatest(loading$, (view, loading) => view || (loading ? 'loading' : 'notFound'))

  // Page title
  , title$ = O.merge(route$.mapTo(null)
                   , block$.filter(notNully).withLatestFrom(t$, (block, t) => t`Block #${block.height}: ${block.id}`)
                   , tx$.filter(notNully).withLatestFrom(t$, (tx, t) => t`Transaction: ${tx.txid}`)
                   , addr$.filter(notNully).withLatestFrom(t$, (addr, t) => t`Address: ${addr.address}`))

  // App state
  , state$ = combine({ t$, error$, tipHeight$, spends$
                     , blocks$, nextMoreBlocks$
                     , block$, blockStatus$, blockTxs$, nextMoreBTxs$, openBlock$
                     , tx$, openTx$
                     , addr$, addrTxs$, nextMoreATxs$
                     , loading$, view$
                     })

  /// Sinks

  // HTTP request sink
  , req$ = O.merge(
    // fetch single block, its status and its txs
      goBlock$.flatMap(hash => [{ category: 'block',      method: 'GET', path: `/block/${hash}` }
                              , { category: 'block-stat', method: 'GET', path: `/block/${hash}/status` }
                              , { category: 'block-txs',  method: 'GET', path: `/block/${hash}/txs` } ])

    // fetch single tx (including confirmation status)
    , goTx$.map(txid        => ({ category: 'tx',         method: 'GET', path: `/tx/${txid}` }))

    // fetch address stats
    , goAddr$.flatMap(addr  => [{ category: 'address',    method: 'GET', path: `/address/${addr}` }
                              , { category: 'addr-txs',   method: 'GET', path: `/address/${addr}/txs`, ignore_err: true }])

    // fetch list of blocks for homepage
    , O.merge(goHome$.mapTo({ }), moreBlocks$)
        .map(d              => ({ category: 'blocks',     method: 'GET', path: `/blocks/${d.start_height || ''}` }))

    // fetch more txs for block page
    , moreBTxs$.map(d       => ({ category: 'block-txs',  method: 'GET', path: `/block/${d.block}/txs/${d.start_index}` }))

    // fetch more txs for address page
    , moreATxs$.map(d       => ({ category: 'addr-txs',   method: 'GET', path: `/address/${d.addr}/txs/${d.start_index}` }))

    // fetch block by height
    , goHeight$.map(n       => ({ category: 'height',     method: 'GET', path: `/block-height/${n}` }))

    // fetch spending txs when viewing advanced details
    , openTx$.filter(notNully)
        .map(txid           => ({ category: 'tx-spends',  method: 'GET', path: `/tx/${txid}/outspends`, txid }))

    // get the tip every 30s (but only when the page is active) or when we render a block/tx/addr, but not more than once every 5s
    , O.merge(O.timer(0, 30000).filter(() => document.hasFocus()), goBlock$, goTx$, goAddr$).throttleTime(5000)
        .mapTo(                 { category: 'tip-height', method: 'GET', path: '/blocks/tip/height', bg: true } )

    ).map(setBase)

  // DOM sink
  , vdom$ = state$.map(S => S.view ? views[S.view](S) : null)

  // localStorage sink
  , store$ = O.merge(
      lang$.skip(1).map(lang => ({ key: 'lang', value: lang }))
    , theme$.skip(1).map(theme => ({ key: 'theme', value: theme }))
  )

  // Route navigation sink
  , navto$ = O.merge(
      searchResult$.filter(Boolean).map(path => ({ type: 'push', pathname: path }))
    , byHeight$.map(hash => ({ type: 'replace', pathname:`/block/${hash}` }))
  )

  dbg({ goHome$, goBlock$, goTx$, togTx$, route$, lang$
      , state$, view$, block$, blockTxs$, blocks$, tx$, spends$
      , tipHeight$, error$, loading$
      , query$, searchResult$, copy$, store$, navto$
      , req$, reply$: dropErrors(HTTP.select()).map(r => [ r.request.category, r.req.method, r.req.url, r.body||r.text, r ]) })

  // @XXX side-effects outside of drivers

  // Display "No results found"
  searchResult$.filter(found => !found).map(_ => document.querySelector('[name=q]'))
    .filter(el => !!el)
    .withLatestFrom(t$)
    .subscribe(([el, t]) => (el.setCustomValidity(t`No results found`), el.reportValidity()))
  on('[name=q]', 'input').subscribe(e => e.target.setCustomValidity(''))

  // Update page title
  title$.subscribe(title => document.title = title ? `${title} · ${initTitle}` : initTitle)

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
  route$.startWith([ ]).scan((prevKeys, loc) => [ ...prevKeys.slice(0, 15), loc.key ])
    .filter(keys => keys.length && !keys.slice(0, -1).includes(last(keys)))
    .subscribe(_ => window.scrollTo(0, 0))

  return { DOM: vdom$, HTTP: req$, route: navto$, storage: store$, search: query$ }
}

run(main, {
  DOM: makeDOMDriver('#liquid-explorer')
, HTTP: makeHTTPDriver()
, route: makeRouteDriver(captureClicks(makeHistoryDriver({ basename: process.env.BASE_HREF || '/' })))
, storage: storageDriver
, search: makeSearchDriver(apiBase)
})
