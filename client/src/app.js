import '@babel/polyfill'
import { Observable as O } from './rxjs'
import {setAdapt} from '@cycle/run/lib/adapt';

import { getMempoolDepth, getConfEstimate, calcSegwitFeeGains } from './lib/fees'
import { summarizeBlockTemplate } from './lib/block-template'
import { getPriceFeedApiBase } from './lib/high-value-assets'
import { isBitcoinNetwork } from './lib/network'
import getPrivacyAnalysis from './lib/privacy-analysis'
import {
  highValueAssetDefinitions,
  nativeAssetId,
  blockTxsPerPage,
  blocksPerPage,
  difficultyPeriod,
  pollIntervalsMs,
  showHighValueAssets,
  showPegData,
  blockGridTransactionSelectEvent
} from './const'
import {
    dbg,
    combine,
    extractErrors,
    dropErrors,
    last,
    updateQuery,
    notNully,
    processGoAddr,
    parseHashes,
    isHash256,
    makeAddressQR,
    tickWhileFocused,
    pollWhileActive,
    pollWhileViewing,
    updateBlocks,
    calculateFeerates,
    calculateOverpayment,
} from './util'
import l10n, { defaultLang } from './l10n'
import * as views from './views'

const highValueAssetCategory = assetId => `dashboard-high-value-asset-${assetId}`
    , highValueAssetPriceCategory = assetId => `dashboard-high-value-asset-price-${assetId}`
    , apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')
    , bitcoinMarketChartUrl = process.env.BITCOIN_MARKET_CHART_URL || 'https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=1&interval=hourly'
    , blockTemplatePollIntervalMs = pollIntervalsMs.fast
    , tipRequestThrottleMs = 5000
    // Wait one electrs cache window after a new tip before requesting the next
    // template. If a refresh is still in progress, electrs holds the request
    // until fresh data is ready, so no additional client-side jitter is needed.
    , blockTemplatePollAfterNewBlockMs = 15000
    , priceFeedApiBase = getPriceFeedApiBase(
        apiBase,
        process.browser ? window.location.origin : process.env.CANONICAL_URL
      )
    , setBase = ({ path, ...r }) => ({ ...r, url: path.includes('://') || path.startsWith('./') ? path : apiBase + path })
    , highValueAssetRequests = !showHighValueAssets ? [] : highValueAssetDefinitions.reduce((requests, asset) => [
        ...requests,
        {
          category: highValueAssetCategory(asset.asset_id),
          method: 'GET',
          path: `/asset/${asset.asset_id}`,
          assetId: asset.asset_id,
          bg: true
        },
        ...(priceFeedApiBase ? [{
          category: highValueAssetPriceCategory(asset.asset_id),
          method: 'GET',
          path: `${priceFeedApiBase}/api/v1/assets/${asset.asset_id}/price`,
          assetId: asset.asset_id,
          bg: true
        }] : [])
      ], [])

const reservedPaths = [ 'mempool', 'assets', 'search' ]
    , NEW_TABLE_ENTRY_MS = 2000

// Make driver source observables rxjs5-compatible via rxjs-compat
setAdapt(stream => O.from(stream))

const defaultNewIds = (prev, next, getId) => {
  if (!prev.length) return []

  const prevIds = new Set(prev.map(getId))
  return next.map(getId).filter(id => !prevIds.has(id))
}

const trackNewEntries = (items$, getId, getNewIds=defaultNewIds) => {
  const newIds$ = items$
    .scan(({ prev }, next) => {
      const prevItems = prev || []
          , nextItems = next || []
          , newIds = prev == null ? [] : getNewIds(prevItems, nextItems, getId)

      return { prev: nextItems, newIds }
    }, { prev: null, newIds: [] })
    .map(({ newIds }) => newIds)
    .filter(ids => ids.length)
    .share()

  const add$ = newIds$.map(ids => current => ids.reduce((next, id) => ({ ...next, [id]: true }), current))
      , remove$ = newIds$.flatMap(ids =>
          O.of(ids)
            .delay(NEW_TABLE_ENTRY_MS)
            .map(ids => current => {
              const next = { ...current }
              ids.forEach(id => delete next[id])
              return next
            }))

  return O.merge(add$, remove$)
    .startWith(current => current)
    .scan((current, mod) => mod(current), {})
}

export const scheduleBlockTemplatePolls = (start$, newBlock$, scheduler) =>
  O.merge(
    start$.mapTo(0),
    newBlock$.mapTo(blockTemplatePollAfterNewBlockMs)
  )
    .switchMap(delay => O.timer(
      delay,
      blockTemplatePollIntervalMs,
      scheduler
    ))

export const scheduleDashboardBlockTemplatePolls = (
  view$,
  newBlock$,
  scheduler
) => scheduleBlockTemplatePolls(
  view$
    .distinctUntilChanged()
    .filter(view => view == 'dashBoard'),
  newBlock$,
  scheduler
)
  .withLatestFrom(view$, (pollIndex, view) => ({ pollIndex, view }))
  .filter(({ view }) => view == 'dashBoard')
  .map(({ pollIndex }) => pollIndex)

export const dashboardNewBlocks = (page$, latestBlock$) =>
  page$
    .switchMap(page => page && page.pathname == '/'
      ? latestBlock$.skip(1)
      : O.empty())

export const dropBlindingFragment = query =>
  query.includes('#blinded=') ? query.split('#')[0] : query

export const parseTipHeight = text => {
  const normalized = typeof text == 'string' ? text.trim() : text
      , height = typeof normalized == 'string' && /^\d+$/.test(normalized)
          ? Number(normalized)
          : normalized

  return Number.isSafeInteger(height) && height >= 0 ? height : null
}

export const subsequentTipHeights = tipHeight$ =>
  tipHeight$.distinctUntilChanged().skip(1)

export const tipDrivenBlockListRefreshes = (tipHeight$, view$) =>
  tipHeight$
    .withLatestFrom(view$, (height, view) => ({ height, view }))
    .filter(({ view }) => view == 'recentBlocks' || view == 'dashBoard')
    .map(({ height }) => height)

const trackPendingBlockTemplateUpdate = (previous, template) => {
  if (!template || !Array.isArray(template.transactions)) {
    return { template: null, key: null, transactionCount: null, delta: null }
  }

  const key = template.previousblockhash != null
      ? template.previousblockhash
      : template.height
      , transactionCount = template.transactions.length + 1
      , isSamePendingBlock = previous.key != null && key != null && previous.key == key
      , delta = isSamePendingBlock && previous.transactionCount != null
          ? transactionCount - previous.transactionCount
          : null

  return { template, key, transactionCount, delta: delta || null }
}

export const trackPendingBlockTemplateEvent = (previous, event) => {
  if (event.tipId != null) {
    return previous.template && previous.template.previousblockhash == event.tipId
      ? { ...previous, tipId: event.tipId }
      : {
          template: null,
          key: null,
          transactionCount: null,
          delta: null,
          tipId: event.tipId
        }
  }

  const template = event.template
  if (
    previous.tipId != null &&
    (!template || template.previousblockhash != previous.tipId)
  ) {
    return previous
  }

  return {
    ...trackPendingBlockTemplateUpdate(previous, template),
    tipId: previous.tipId
  }
}

export default function main(
  { DOM, HTTP, route, storage, scanner: scan$, search: searchResult$, blinding: unblinded$ },
  {
    pollingEnabled=process.browser,
    pollingScheduler,
    hasFocus=() => document.hasFocus()
  }={}
) {
  const

    reply = (cat, raw) => dropErrors(HTTP.select(cat)).map(r => raw ? r : (r.body || r.text))
  , focusedTicks = ms => tickWhileFocused(
      ms,
      pollingScheduler,
      hasFocus,
      pollingEnabled
    )
  , pollActive = (ms, activeKey$) => pollWhileActive(
      ms,
      activeKey$,
      pollingScheduler,
      hasFocus,
      pollingEnabled
    )
  , pollViewing = (ms, views, view$) => pollWhileViewing(
      ms,
      views,
      view$,
      pollingScheduler,
      hasFocus,
      pollingEnabled
    )
  , recoverableReply = cat => O.merge(
        reply(cat).map(value => ({ value, succeeded: true }))
      , extractErrors(HTTP.select(cat)).mapTo({ succeeded: false }))
      .scan((state, result) => result.succeeded
          ? { value: result.value, error: false }
          : { ...state, error: true }
        , { value: null, error: false })
      .startWith({ value: null, error: false })
  , on    = (sel, ev, opt={}) => DOM.select(sel).events(ev, opt)
  , click = sel => on(sel, 'click').map(e => e.ownerTarget.dataset)

  /// User actions
  , page$     = route()
  , goHome$ = route('/')
  , goAPILanding$= route('/explorer-api')
  , goBlocks$   = route('/blocks/recent').map(loc => ({ start_height: loc.query.start != null ? +loc.query.start : null }))
  , goBlock$  = route('/block/:hash').map(loc => ({ hash: loc.params.hash, start_index: +loc.query.start || 0 }))
  , goHeight$ = route('/block-height/:height').map(loc => loc.params.height)
  , goAddr$   = route('/address/:addr').map(loc => ({
      addr: loc.params.addr
    , last_txids: parseHashes(loc.query.txids)
    , est_chain_seen_count: +loc.query.c || 0
    })).map(processGoAddr)
  , goTx$     = route('/tx/:txid').map(loc => loc.params.txid).filter(isHash256)
  , goPush$   = route('/tx/push')
  , goRecent$ = route('/tx/recent')
  , goScan$   = route('/scan-qr').mapTo(true)
  , goMempool$= route('/mempool')
  , goSearch$ = route('/search').map(loc => loc.query.q).filter(Boolean)

  // Elements only
  , goAsset$ = !process.env.IS_ELEMENTS ? O.empty() : route('/asset/:asset_id').map(loc => ({
      asset_id: loc.params.asset_id
    , last_txids: parseHashes(loc.query.txids)
    , est_chain_seen_count: +loc.query.c || 0
    }))
  , goAssetList$ = !process.env.IS_ELEMENTS ? O.empty() : route('/assets').map(loc => ({
      start_index: +loc.query.start_index || 0
    , sort_field: loc.query.sort_field != null ? loc.query.sort_field : 'name'
    , sort_dir: loc.query.sort_dir != null ? loc.query.sort_dir : 'asc'
    , limit: +loc.query.limit || 50,
    }))
  , blindingReq$ = !(process.env.IS_ELEMENTS && process.browser) ? O.empty()
      : page$.map(loc => loc.hash.startsWith('#blinded=') ? loc.hash.substr(9) : null)
  // End Elements only


  // three ways to search: via the form, using the short /<query> search URL and using the QR scanner.
  // this triggers a redirect to /search?q=<query>, which then triggers the search itself.
  , searchQuery$ = O.merge(
      on('.search', 'submit').map(e => e.target.querySelector('[name=q]').value)
    , route('/:q([a-zA-Z0-9]+)').map(loc => loc.params.q).filter(q => !reservedPaths.includes(q))
    , scan$
    )

  // auto-expand when opening with "#expand"
  , expandTx$ = route('/tx/:txid').filter(loc => loc.query.expand).map(loc => loc.params.txid)
  , expandBl$ = route('/block/:hash').filter(loc => loc.query.expand).map(loc => loc.params.hash)

  , togTx$    = click('[data-toggle-tx]').map(d => d.toggleTx).merge(page$.mapTo(null), expandTx$)
  , togBlock$ = click('[data-toggle-block]').map(d => d.toggleBlock).merge(page$.mapTo(null), expandBl$)
  , togPendingBlockDetails$ = click('[data-toggle-pending-block-details]')
  , selectBlockGridTx$ = on('.block-grid__canvas', blockGridTransactionSelectEvent)
      .map(e => e.detail && e.detail.txid)
      .filter(isHash256)

  , copy$     = click('[data-clipboard-copy]').map(d => d.clipboardCopy)
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

  , tipHeight$ = reply('tip-height', true)
      .map(res => parseTipHeight(res.text))
      .filter(notNully)
  , subsequentTipHeight$ = subsequentTipHeights(tipHeight$)

  // the translation function for the currently selected language
  , t$ = lang$.map(lang => l10n[lang] || l10n[defaultLang])

  // Scanner state (on/off)
  , scanning$ = O.merge(
      goScan$.mapTo(true)
    , page$.filter(l => l.pathname != '/scan-qr').mapTo(false)
    , scan$.mapTo(false)
    )

  // Keep track of the number of active in-flight HTTP requests
  , loading$ = HTTP.select().filter(r$ => !r$.request.bg)
      .flatMap(r$ => r$.mapTo(-1).catch(_ => O.of(-1)).startWith(+1))
      .merge(goSearch$.mapTo(+1)).merge(searchResult$.mapTo(-1))
      .startWith(0).scan((N, a) => N+a)

  // Recent blocks
  , blocks$ = reply('blocks')
      .map(blocks => S => updateBlocks(S, blocks))
      .startWith([]).scan((S, mod) => mod(S))
      .share()

  , latestBlock$ = blocks$
      .map(blocks => blocks && blocks[0])
      .filter(Boolean)
      .distinctUntilChanged((a, b) => a.id == b.id)

  , newBlockEntries$ = trackNewEntries(
      blocks$,
      block => block.id,
      (prev, next) => {
        const prevTip = prev.length ? prev[0].height : null
        return prevTip == null ? [] : next.filter(block => block.height > prevTip).map(block => block.id)
      }
    )

  , nextBlocks$ = blocks$.map(blocks => blocks && blocks.length && last(blocks).height).map(height => height > 0 ? height-1 : null)

  , prevBlocks$ = process.browser ? O.empty()
      : goBlocks$.combineLatest(tipHeight$, (d, tipHeight) => d.start_height != null && d.start_height < tipHeight ? Math.min(tipHeight, d.start_height+blocksPerPage) : null)

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
  , addr$ = reply('address')
      .withLatestFrom(goAddr$, (addr, goAddr) => ({ ...addr, display_addr: goAddr.display_addr }))
      .merge(goAddr$.mapTo(null))
  , addrQR$ = addr$.filter(Boolean).map(addr => addr.display_addr).flatMap(makeAddressQR)
  , addrTxs$ = O.merge(
      reply('addr-txs').map(txs => S => txs)
    , reply('addr-txs-more').map(txs => S => [ ...S, ...txs ])
    , goAddr$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  // Single TX
  , tx$ = reply('tx').merge(goTx$.mapTo(null)).startWith(null)
  , txBlock$ = reply('tx-block').merge(goTx$.mapTo(null)).startWith(null)

  // Predecessor metadata for confirmed block interval calculations
  , previousBlock$ = reply('previous-block')
      .merge(O.merge(goBlock$, goTx$).mapTo(null))
      .startWith(null)

  // Currently collapsed tx/block ("details")
  , openTx$ = togTx$.startWith(null).scan((prev, txid) => prev == txid ? null : txid)
  , openBlock$ = togBlock$.startWith(null).scan((prev, blockhash) => prev == blockhash ? null : blockhash)
  , pendingBlockDetailsOpen$ = togPendingBlockDetails$
      .mapTo(open => !open)
      .merge(page$.mapTo(_ => false))
      .startWith(false)
      .scan((open, mod) => mod(open))

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
  , newTxEntries$ = trackNewEntries(mempoolRecent$, tx => tx.txid)
  , trackedBlockTemplateState$ = O.merge(
      reply('block-template').map(template => ({ template }))
    , latestBlock$.map(block => ({ tipId: block.id }))
    )
      .startWith({ template: null })
      .scan(trackPendingBlockTemplateEvent, {
        template: null,
        key: null,
        transactionCount: null,
        delta: null,
        tipId: null
      })

  // dashboard
  , dashboardPegAsset$ = !showPegData
      ? O.of({ value: null, error: false })
      : recoverableReply('dashboard-peg-asset')
  , dashboardPegChainTxs$ = !showPegData
      ? O.of({ value: null, error: false })
      : recoverableReply('dashboard-peg-chain-txs')
  , dashboardPegMempoolTxs$ = !showPegData
      ? O.of({ value: null, error: false })
      : recoverableReply('dashboard-peg-mempool-txs')
  , dashboardPegState$ = O.combineLatest(
      dashboardPegAsset$
    , dashboardPegChainTxs$
    , dashboardPegMempoolTxs$
    , (asset, chainTxs, mempoolTxs) => ({
        asset: asset.value
      , txs: chainTxs.value != null && mempoolTxs.value != null
          ? [ ...mempoolTxs.value, ...chainTxs.value ]
          : null
      , error: asset.error || chainTxs.error || mempoolTxs.error
      }))
  , dashboardHighValueAssets$ = !showHighValueAssets
      ? O.of({})
      : O.merge(...highValueAssetDefinitions.reduce((replies, asset) => [
          ...replies,
          reply(highValueAssetCategory(asset.asset_id), true)
              .map(r => state => ({
                ...state,
                [r.request.assetId]: {
                  ...state[r.request.assetId],
                  asset: r.body
                }
              })),
          reply(highValueAssetPriceCategory(asset.asset_id), true)
              .map(r => state => ({
                ...state,
                [r.request.assetId]: {
                  ...state[r.request.assetId],
                  price: r.body && r.body.data
                }
              }))
        ], []))
        .scan((state, update) => update(state), {})
        .startWith({})
  , dashboardState$ = O.combineLatest(
      blocks$,
      mempoolRecent$,
      dashboardPegState$,
      dashboardHighValueAssets$,
      (blks, txs, peg, highValueAssets) => ({
        dashblocks: blks.slice(0, 5),
        dashTxs: txs.slice(0, 11),
        peg,
        highValueAssets
      }))

  , dashboardEpochStartBlock$ = reply('dashboard-epoch-start-block', true)
      .map(r => ({ ...r.body, requestedHeight: r.request.height }))
      .startWith(null)

  , dashboardPreviousDifficultyBlock$ = reply('dashboard-previous-difficulty-block', true)
      .map(r => ({ ...r.body, requestedHeight: r.request.height }))
      .startWith(null)

  // Fee estimates
  , feeEst$ = reply('fee-est').startWith(null)
  , blockTemplateState$ = O.combineLatest(
      trackedBlockTemplateState$
    , feeEst$
    , (state, feeEst) => ({
        ...state
      , metrics: summarizeBlockTemplate(state.template, feeEst)
      }))

  // Bitcoin price chart data
  , bitcoinMarketChart$ = reply('bitcoin-market-chart').startWith(null)

  // Transaction analysis
  , txAnalysis$ = tx$.filter(Boolean)
      .combineLatest(mempool$, feeEst$, calculateFeerates)
      .map(({ tx, feerate, mempool, feeEst, effectiveFeerate}) => ({
        feerate
      , privacyAnalysis: getPrivacyAnalysis(tx)
      , segwitGains: calcSegwitFeeGains(tx)
      , mempoolDepth: !tx.status.confirmed && feerate != null && mempool ? getMempoolDepth(mempool.fee_histogram, effectiveFeerate) : null
      , confEstimate: !tx.status.confirmed && feerate != null && feeEst ? getConfEstimate(feeEst, effectiveFeerate) : null
      , overpaying: !tx.status.confirmed && feerate != null && feeEst ? calculateOverpayment(effectiveFeerate, feeEst) : null
      }))

  // Asset and associated txs (elements only)
  , asset$ = !process.env.IS_ELEMENTS ? O.empty() : reply('asset').merge(goAsset$.mapTo(null))
  , assetTxs$ = !process.env.IS_ELEMENTS ? O.empty() : O.merge(
      reply('asset-txs').map(txs => S => txs)
    , reply('asset-txs-more').map(txs => S => [ ...S, ...txs ])
    , goAsset$.map(_ => S => null)
    ).startWith(null).scan((S, mod) => mod(S))

  // Asset map (elements only)
  , assetMap$ = !process.env.ASSET_MAP_URL ? O.of({}) :
      reply('asset-map')
        // use an empty object if the map fails loading for any reason
        .merge(extractErrors(HTTP.select('asset-map')).mapTo({}))

  // Assets List State
  , assetList$ = !process.env.IS_ELEMENTS ? O.empty() :
      reply('assetlist', true).map(r => ({ assets: r.body, total: r.headers['x-total-results'] || 493 }))

  // The minimally required data to start rendering the UI
  // In elements, we block rendering until the assetMap is loaded. Otherwise, we can start immediately.
  , isReady$ = process.env.ASSET_MAP_URL ? assetMap$.mapTo(true).startWith(false) : O.of(true)

  // Currently visible view
  , view$ = O.merge(page$.mapTo(null)
                  , goHome$.mapTo('dashBoard')
                  , goAPILanding$.mapTo('apiLanding')
                  , goBlocks$.mapTo('recentBlocks')
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

  , dashboardLatestBlock$ = isBitcoinNetwork
      ? latestBlock$
          .combineLatest(view$, (block, view) => view == 'dashBoard' ? block : null)
          .filter(Boolean)
          .distinctUntilChanged((a, b) => a.height == b.height)
      : O.empty()

  // Route entry already requests all dashboard data. Treat its first block-list
  // response as the baseline, then refresh block-dependent data on later tips.
  , dashboardNewBlock$ = dashboardNewBlocks(page$, latestBlock$)

  , mempoolPollKey$ = O.combineLatest(view$, tx$, (view, tx) =>
      view == 'dashBoard' || view == 'mempool'
        ? view
        : view == 'tx' && tx && !tx.status.confirmed
          ? tx.txid
          : null)

  , feeEstimatePollKey$ = O.combineLatest(
      mempoolPollKey$,
      view$,
      (mempoolPollKey, view) => view == 'recentTxs' ? view : mempoolPollKey)

  , blockTemplatePoll$ = !pollingEnabled
      ? goHome$
      : scheduleDashboardBlockTemplatePolls(
          view$,
          dashboardNewBlock$,
          pollingScheduler
        ).filter(pollIndex => pollIndex == 0 || hasFocus())

  , dashboardEpochStartHeight$ = dashboardLatestBlock$
      .map(block => block.height - (block.height % difficultyPeriod))
      .distinctUntilChanged()

  , dashboardPreviousDifficultyHeight$ = dashboardEpochStartHeight$
      .map(height => height - difficultyPeriod)
      .filter(height => height >= 0)
      .distinctUntilChanged()

  // Page title
  , title$ = O.merge(page$.mapTo(null)
                   , goAPILanding$.withLatestFrom(t$, (_, t) => t`Explorer API`)
                   , block$.filter(notNully).withLatestFrom(t$, (block, t) => t`Block #${block.height}: ${block.id}`)
                   , tx$.filter(notNully).withLatestFrom(t$, (tx, t) => t`Transaction: ${tx.txid}`)
                   , addr$.filter(notNully).withLatestFrom(goAddr$, t$, (_, goAddr, t) => t`Address: ${goAddr.display_addr}`)
                   , asset$.filter(notNully).withLatestFrom(t$, (asset, t) => t`Asset: ${asset.asset_id}`)
                   , goAssetList$.withLatestFrom(t$, (_, t) => t`Registered assets`)
                   , goPush$.withLatestFrom(t$, (_, t) => t`Broadcast transaction`)
                   , goMempool$.withLatestFrom(t$, (_, t) => t`Mempool`)
                   , goRecent$.withLatestFrom(t$, (_, t) => t`Recent transactions`))

  // App state
  , state$ = combine({ t$, error$, tipHeight$, spends$
                     , goBlocks$, blocks$, nextBlocks$, prevBlocks$, dashboardState$
                     , pendingBlockDetailsOpen$, blockTemplateState$
                     , dashboardEpochStartBlock$, dashboardPreviousDifficultyBlock$
                     , newBlockEntries$, newTxEntries$
                     , goBlock$, block$, blockStatus$, blockTxs$, nextBlockTxs$, prevBlockTxs$, openBlock$
                     , mempool$, mempoolRecent$, feeEst$, bitcoinMarketChart$
                     , tx$, txBlock$, previousBlock$, txAnalysis$, openTx$
                     , goAddr$, addr$, addrTxs$, addrQR$
                     , assetMap$, assetList$, goAssetList$, goAsset$, asset$, assetTxs$, unblinded$
                     , isReady$, loading$, page$, view$, title$
                     })

  // Update query options with ?expand
  , updateQuery$ = O.merge(
      openTx$.withLatestFrom(view$).filter(([ _, view]) => view == 'tx').pluck(0)
    , openBlock$.withLatestFrom(view$).filter(([ _, view]) => view == 'block').pluck(0)
    )
    .map(Boolean).distinctUntilChanged()
    .withLatestFrom(route.all$)
    .filter(([ expand, page ]) => page.query.expand != expand)
    .map(([ expand, page ]) => [ page.pathname, page.hash, updateQuery(page.query, { expand }) ])

  /// Sinks

  // HTTP request sink
  , req$ = O.merge(
    // fetch single block, its status and its txs
      goBlock$.flatMap(d    => [{ category: 'block',      method: 'GET', path: `/block/${d.hash}` }
                              , { category: 'block-stat', method: 'GET', path: `/block/${d.hash}/status` }
                              , { category: 'block-txs',  method: 'GET', path: `/block/${d.hash}/txs/${d.start_index}` } ])

    // fetch single tx (including confirmation status)
    , goTx$.map(txid        => ({ category: 'tx',         method: 'GET', path: `/tx/${txid}` }))

    // fetch the block containing a confirmed tx
    , tx$.filter(tx         => tx && tx.status && tx.status.confirmed && tx.status.block_hash)
        .map(tx             => ({ category: 'tx-block',   method: 'GET', path: `/block/${tx.status.block_hash}` }))

    // fetch the predecessor needed to calculate a confirmed block's interval
    , O.merge(block$, txBlock$)
        .filter(block       => block && block.previousblockhash)
        .map(block          => ({ category: 'previous-block', method: 'GET', path: `/block/${block.previousblockhash}`, bg: true }))

    // fetch address and its txs
    , goAddr$.flatMap(d     => [{ category: 'address',    method: 'GET', path: `/address/${d.addr}` }
                              , d.last_txids.length
                              ? { category: 'addr-txs',   method: 'GET', path: `/address/${d.addr}/txs/chain/${last(d.last_txids)}` }
                              : { category: 'addr-txs',   method: 'GET', path: `/address/${d.addr}/txs` }])

    // Fetch the block list on route entry, when the tip height changes, and as
    // a slow safety refresh. The timer exists specifically to catch same-height
    // reorgs, which cannot be detected through /blocks/tip/height.
    , O.merge(
        goBlocks$,
        moreBlocks$,
        tipDrivenBlockListRefreshes(subsequentTipHeight$, view$)
          .mapTo({ start_height: null }),
        pollViewing(
          pollIntervalsMs.slow,
          [ 'recentBlocks', 'dashBoard' ],
          view$
        ).mapTo({ start_height: null })
      )
        .map(d              => ({ category: 'blocks',     method: 'GET', path: `/blocks/${d.start_height == null ? '' : d.start_height}` }))

    // fetch more txs for block page
    , moreBTxs$.map(d       => ({ category: 'block-txs',  method: 'GET', path: `/block/${d.block}/txs/${d.start_index}` }))

    // fetch more txs for address page
    , moreATxs$.map(d       => ({ category: 'addr-txs-more', method: 'GET', path: `/address/${d.addr}/txs/chain/${d.last_txid}` }))

    // fetch block by height
    , goHeight$.map(n       => ({ category: 'height',     method: 'GET', path: `/block-height/${n}` }))

    // fetch dashboard difficulty comparison blocks
    , dashboardEpochStartHeight$
        .map(height          => ({ category: 'dashboard-epoch-start-height', method: 'GET', path: `/block-height/${height}`, height, bg: true }))

    , reply('dashboard-epoch-start-height', true)
        .map(r              => ({ category: 'dashboard-epoch-start-block', method: 'GET', path: `/block/${r.text}`, height: r.request.height, bg: true }))

    , dashboardPreviousDifficultyHeight$
        .map(height          => ({ category: 'dashboard-previous-difficulty-height', method: 'GET', path: `/block-height/${height}`, height, bg: true }))

    , reply('dashboard-previous-difficulty-height', true)
        .map(r              => ({ category: 'dashboard-previous-difficulty-block', method: 'GET', path: `/block/${r.text}`, height: r.request.height, bg: true }))

    // push tx
    , pushtx$.map(rawtx     => ({ category: 'pushtx',     method: 'POST', path: `/tx`, send: rawtx, type: 'text/plain' }))

    // fetch spending txs when viewing advanced details
    , openTx$.filter(notNully)
        .map(txid           => ({ category: 'tx-spends',  method: 'GET', path: `/tx/${txid}/outspends`, txid }))

    // in browser env, get the tip every 30s (but only when the page is active) or when we render a block/tx/addr, but not more than once every 5s
    // in server env, just get it once
    , (pollingEnabled ? O.merge(focusedTicks(pollIntervalsMs.fast), goBlock$, goTx$, goAddr$).throttleTime(tipRequestThrottleMs, pollingScheduler)
                       : O.of(1)
        ).mapTo(                { category: 'tip-height', method: 'GET', path: '/blocks/tip/height', bg: !!process.browser } )

    // fetch mempool backlog stats and fee estimates as foregrounds request when opening the mempool page
    , goMempool$.flatMap(_ =>  [{ category: 'mempool',    method: 'GET', path: '/mempool' }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates' }])

    // fetch backlog stats and fee estimates in the background when opening a tx
    , goTx$.flatMap(_ =>       [{ category: 'mempool',    method: 'GET', path: '/mempool', bg: !!process.browser }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates', bg: !!process.browser }])

    // poll each dynamic endpoint only on views that consume it
    , pollActive(pollIntervalsMs.standard, mempoolPollKey$)
        .mapTo(                 { category: 'mempool',    method: 'GET', path: '/mempool', bg: true })

    , pollActive(pollIntervalsMs.standard, feeEstimatePollKey$)
        .mapTo(                 { category: 'fee-est',    method: 'GET', path: '/fee-estimates', bg: true })

    // fetch recent mempool txs and fee estimates when opening the recent txs page
    , goRecent$.flatMap(_ =>   [{ category: 'recent',     method: 'GET', path: '/mempool/recent' }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates' }])
    // ... and on the fast cadence while either transaction list remains open
    , pollViewing(
        pollIntervalsMs.fast,
        [ 'recentTxs', 'dashBoard' ],
        view$
      )
       .mapTo(                 { category: 'recent',     method: 'GET', path: '/mempool/recent', bg: true })

    // refresh pending peg transactions on the standard cadence
    , !showPegData ? O.empty() :
        pollViewing(pollIntervalsMs.standard, 'dashBoard', view$)
          .mapTo({ category: 'dashboard-peg-mempool-txs', method: 'GET', path: `/asset/${nativeAssetId}/txs/mempool`, bg: true })

    // the market chart contains hourly samples and uses the slow cadence
    , pollViewing(pollIntervalsMs.slow, 'dashBoard', view$)
        .mapTo({ category: 'bitcoin-market-chart', method: 'GET', path: bitcoinMarketChartUrl, bg: true })

    // confirmed peg state changes only when a new block arrives
    , !showPegData ? O.empty() :
        dashboardNewBlock$.flatMap(_ =>
                              [{ category: 'dashboard-peg-asset', method: 'GET', path: `/asset/${nativeAssetId}`, bg: true }
                              , { category: 'dashboard-peg-chain-txs', method: 'GET', path: `/asset/${nativeAssetId}/txs/chain`, bg: true }])

    // Refresh the pending block template while the dashboard remains open. A new
    // tip resets the cadence and waits for electrs' block cache to refresh.
    , blockTemplatePoll$
        .mapTo({ category: 'block-template', method: 'GET', path: '/block-template', bg: true })

    , goHome$.flatMap(_ =>  [{ category: 'blocks',    method: 'GET', path: '/blocks' }
                              , { category: 'recent',    method: 'GET', path: '/mempool/recent' }
                              , { category: 'fee-est',    method: 'GET', path: '/fee-estimates' }
                              , { category: 'mempool',    method: 'GET', path: '/mempool' }
                              , { category: 'bitcoin-market-chart', method: 'GET', path: bitcoinMarketChartUrl, bg: true }])

    // fetch peg data only when opening an Elements dashboard
    , !showPegData ? O.empty() :
        goHome$.flatMap(_ =>  [{ category: 'dashboard-peg-asset', method: 'GET', path: `/asset/${nativeAssetId}`, bg: true }
                              , { category: 'dashboard-peg-chain-txs', method: 'GET', path: `/asset/${nativeAssetId}/txs/chain`, bg: true }
                              , { category: 'dashboard-peg-mempool-txs', method: 'GET', path: `/asset/${nativeAssetId}/txs/mempool`, bg: true }])

    // fetch asset stats and USD prices only while viewing the Liquid dashboard
    , !showHighValueAssets ? O.empty() :
        O.merge(goHome$, pollViewing(pollIntervalsMs.slow, 'dashBoard', view$))
          .flatMap(_ => highValueAssetRequests)
    //
    // elements/liquid only
    //

    // fetch asset map index on page load (once, as a foreground request)
    , !process.env.ASSET_MAP_URL ? O.empty() : O.of(
                                { category: 'asset-map',  method: 'GET', path: process.env.ASSET_MAP_URL, bg: true })

    // fetch asset list
    , goAssetList$.map(d => ({ category: 'assetlist',  method: 'GET', path: '/assets/registry'
          , query: { sort_field: d.sort_field, sort_dir: d.sort_dir, limit: d.limit, start_index: d.start_index } }))

    // fetch asset and its txs
    , !process.env.IS_ELEMENTS ? O.empty() :
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
  )

  // Route navigation sink
  , navto$ = O.merge(
      searchResult$.filter(Boolean).map(result => ({ type: 'replace', ...result }))
    , byHeight$.map(hash => ({ type: 'replace', pathname: `/block/${hash}` }))
    , pushedtx$.map(txid => ({ type: 'push', pathname: `/tx/${txid}` }))
    , selectBlockGridTx$.map(txid => ({ type: 'push', pathname: `/tx/${txid}` }))
    , updateQuery$.map(([ pathname, hash, qs ]) => ({ type: 'replace', pathname, hash, search: qs, state: { noRouting: true } }))
    , searchQuery$.map(q => ({ type: 'push', pathname: '/search', search: `q=${encodeURIComponent(dropBlindingFragment(q))}` }))
  )

  dbg({ goBlocks$, goBlock$, goTx$, goAddr$, togTx$, page$, lang$, vdom$, moreBlocks$
      , openTx$, openBlock$, updateQuery$
      , state$, view$, block$, blockTxs$, blocks$, tx$, txBlock$, txAnalysis$, spends$, addr$
      , tipHeight$, error$, loading$
      , goSearch$, searchResult$, copy$, store$, navto$, scanning$, scan$, selectBlockGridTx$
      , assetMap$,  goAssetList$, assetList$
      , req$, reply$: dropErrors(HTTP.select()).map(r => [ r.request.category, r.req.method, r.req.url, r.body||r.text, r ]) })

  // @XXX side-effects outside of drivers
  if (process.browser) {

    // Click-to-copy
    if (navigator.clipboard) copy$.subscribe(text => navigator.clipboard.writeText(text))

    // Switch stylesheet based on current language
    const stylesheet = document.querySelector('link[href="style.css"]')
    t$.map(t => t`style.css`).distinctUntilChanged().subscribe(styleSrc =>
      stylesheet.getAttribute('href') != styleSrc && (stylesheet.href = styleSrc))

    // Apply language and text direction to root element
    t$.subscribe(t => {
      document.body.setAttribute('lang', t.lang_id)
      document.body.setAttribute('dir', t`ltr`)
    })

    // Reset scrolling when navigating to a new page (but not when hitting 'back')
    page$.startWith([ ]).scan((prevKeys, loc) => [ ...prevKeys.slice(0, 15), loc.key ])
      .filter(keys => keys.length && !keys.slice(0, -1).includes(last(keys)))
      .subscribe(_ => window.scrollTo(0, 0))

    // Scroll ins/outs selected via URL hash into view (single tx page only)
    DOM.select('.ins-and-outs .active').elements()
      .withLatestFrom(view$)
      .filter(([ els, view ]) => view == 'tx' && !!els.length)
      .map(([ els, _ ]) => els[0])
      .distinctUntilChanged().delay(300)
      .subscribe(el => el.scrollIntoView({ behavior: 'smooth' }))

    // Display "Copied!" tooltip
    on('[data-clipboard-copy]', 'click').subscribe(({ ownerTarget: btn }) => {
      btn.classList.add('show-tooltip')
      setTimeout(_ => btn.classList.remove('show-tooltip'), 700)
    })

    on('.table-copy-button', 'click', { preventDefault: true }).subscribe(e => e.stopPropagation())

    const closeOpenTooltips = except => {
      document.querySelectorAll('.tooltip.tooltip-open').forEach(tooltip => {
        if (tooltip != except) tooltip.classList.remove('tooltip-open')
      })
    }
    on('.tooltip', 'click', { preventDefault: true }).subscribe(e => {
      e.stopPropagation()
      const tooltip = e.ownerTarget
          , shouldOpen = !tooltip.classList.contains('tooltip-open')
      closeOpenTooltips(tooltip)
      tooltip.classList.toggle('tooltip-open', shouldOpen)
      if (!shouldOpen) tooltip.blur()
    })
    on('.tooltip', 'blur').subscribe(({ ownerTarget: tooltip }) =>
      tooltip.classList.remove('tooltip-open'))
    on('[data-scroll-top]', 'click').subscribe(_ => window.scrollTo(0, 0))

    const keepTooltipInViewport = ({ ownerTarget: tooltip }) => {
      const dialogue = tooltip.querySelector('.tooltip-dialogue')
      if (!dialogue) return

      tooltip.classList.remove('tooltip-flipped')
      const bounds = dialogue.getBoundingClientRect()
          , viewportWidth = document.documentElement.clientWidth
      tooltip.classList.toggle('tooltip-flipped', bounds.left < 0 || bounds.right > viewportWidth)
    }
    O.merge(on('.tooltip', 'mouseenter'), on('.tooltip', 'focus')).subscribe(keepTooltipInViewport)

    on('.toggle-container', 'click').subscribe(({ ownerTarget: burgerMenu }) => {
      burgerMenu.classList.toggle('open-menu');
    })

    const closeNetworkMenus = () => {
      document.querySelectorAll('.nav-item.open-network-menu').forEach(menu => {
        menu.classList.remove('open-network-menu')
        const toggle = menu.querySelector('.network-selector-toggle')
        toggle && toggle.setAttribute('aria-expanded', 'false')
      })
    }

    on('.network-selector-toggle', 'click', { preventDefault: true }).subscribe(({ ownerTarget: toggle }) => {
      const menu = toggle.closest('.nav-item')
      const isOpen = menu.classList.contains('open-network-menu')
      closeNetworkMenus()
      menu.classList.toggle('open-network-menu', !isOpen)
      toggle.setAttribute('aria-expanded', String(!isOpen))
    })

    document.addEventListener('click', e => {
      const activeTooltip = document.activeElement
      if (activeTooltip && activeTooltip.classList.contains('tooltip') && !e.target.closest('.tooltip')) {
        activeTooltip.blur()
      }
      if (!e.target.closest('.tooltip')) closeOpenTooltips()
      if (e.target.closest('.main-nav-container')) return
      closeNetworkMenus()
    })

    document.addEventListener('keydown', e => {
      if (e.key == 'Escape') {
        closeNetworkMenus()
        closeOpenTooltips()
        document.activeElement && document.activeElement.classList.contains('tooltip') && document.activeElement.blur()
      }

      const hasModifier = e.metaKey || e.ctrlKey
      , noExtraModifiers = !e.altKey && !e.shiftKey

      if (hasModifier && noExtraModifiers && e.key.toLowerCase() == 'k') {
        const searchInput = document.querySelector('.search-bar-input')
        if (searchInput) {
          e.preventDefault()
          searchInput.focus()
        }
      }
    })
  }

  return {
    DOM: vdom$
  , HTTP: req$
  , route: navto$
  , storage: store$
  , search: goSearch$
  , scanner: scanning$
  , title: title$
  , state: state$

  // elements only
  , blinding: blindingReq$
  }
}
