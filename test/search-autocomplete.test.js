const test = require('node:test')
const assert = require('node:assert/strict')
const render = require('snabbdom-to-html')
const { Subject } = require('../client/node_modules/rxjs/Subject')
const { TestScheduler } = require('../client/node_modules/rxjs/testing')

process.env.IS_ELEMENTS = '1'

const { default: makeAutocompleteDriver } = require('../client/src/driver/autocomplete')
const {
  autocompleteDelayMs,
  debounceAutocompleteQueries,
  getAutocompletePlan,
  mergeAssetResults,
} = require('../client/src/lib/search-autocomplete')
const search = require('../client/src/views/search').default

const t = (strings, ...values) => Array.isArray(strings)
  ? strings.reduce((text, string, index) => text + string + (values[index] == null ? '' : values[index]), '')
  : strings

const collectAutocomplete = (driver, query) => new Promise((resolve, reject) => {
  const events = []
  driver(require('../client/src/rxjs').Observable.of(query)).subscribe(event => {
    events.push(event)
    if (!event.loading) resolve(events)
  }, reject)
})

const fakeRequester = responses => {
  const calls = []
      , requester = url => {
          const call = { url, query: null }
              , response = responses[url] || { body: [] }
              , pending = {
                  query(query) {
                    call.query = query
                    return pending
                  },
                  then(resolve, reject) {
                    return (response instanceof Error ? Promise.reject(response) : Promise.resolve(response))
                      .then(resolve, reject)
                  },
                }

          calls.push(call)
          return pending
        }

  return { calls, requester }
}

test('classifies only complete hashes and addresses for exact autocomplete', () => {
  const hash = 'a'.repeat(64)
      , address = '1BoatSLRHtKNngkdXEeobR76b53LETtpyT'

  assert.deepEqual(getAutocompletePlan(hash, true), {
    kind: 'hash',
    query: hash,
  })
  assert.deepEqual(getAutocompletePlan(address, true), {
    kind: 'address',
    query: address,
  })
  assert.equal(getAutocompletePlan('a'.repeat(63), true).kind, 'none')
  assert.equal(getAutocompletePlan('abcdef1234567891abcdef12345', true).kind, 'none')
  assert.equal(getAutocompletePlan('840000', true).kind, 'none')
  assert.equal(getAutocompletePlan('840000x1x0', true).kind, 'none')
})

test('uses registry metadata filters without asset ID prefix autocomplete', () => {
  assert.deepEqual(getAutocompletePlan('USD', true).filters, [ 'name', 'ticker' ])
  assert.deepEqual(getAutocompletePlan('example.com', true).filters, [ 'name', 'ticker', 'domain' ])
  assert.deepEqual(getAutocompletePlan('CAFE', true).filters, [ 'name', 'ticker' ])
  assert.equal(getAutocompletePlan('USD', false).kind, 'none')
})

test('issues only the eligible registry metadata requests', () => {
  const { calls, requester } = fakeRequester({})

  return collectAutocomplete(makeAutocompleteDriver('/api', requester), 'USD').then(events => {
    assert.equal(events[0].loading, true)
    assert.equal(events[1].loading, false)
    assert.equal(calls.length, 2)
    assert.deepEqual(calls.map(call => call.query), [
      { name: 'USD', limit: 5, sort_field: 'name', sort_dir: 'asc' },
      { ticker: 'USD', limit: 5, sort_field: 'ticker', sort_dir: 'asc' },
    ])
    assert.ok(calls.every(call => !Object.prototype.hasOwnProperty.call(call.query, 'asset_id')))
  })
})

test('checks every exact hash category only at 64 characters', () => {
  const hash = 'a'.repeat(64)
      , base = '/api'
      , { calls, requester } = fakeRequester({
          [`${base}/tx/${hash}/status`]: { body: { confirmed: true } },
          [`${base}/block/${hash}`]: { body: { id: hash, height: 1 } },
          [`${base}/asset/${hash}`]: { body: { asset_id: hash } },
        })
  return collectAutocomplete(makeAutocompleteDriver(base, requester), hash).then(events => {
    assert.deepEqual(calls.map(call => call.url), [
      `${base}/tx/${hash}/status`,
      `${base}/block/${hash}`,
      `${base}/asset/${hash}`,
    ])
    assert.deepEqual(events[1].results.map(result => result.category), [
      'assets',
      'blocks',
      'transactions',
    ])
  })
})

test('keeps a block hash result when the other exact-match sources are unavailable', () => {
  const hash = 'b'.repeat(64)
      , base = '/api'
      , networkError = new Error('unavailable')
      , { requester } = fakeRequester({
          [`${base}/tx/${hash}/status`]: networkError,
          [`${base}/block/${hash}`]: { body: { id: hash, height: 42 } },
          [`${base}/asset/${hash}`]: networkError,
        })

  return collectAutocomplete(makeAutocompleteDriver(base, requester), hash).then(events => {
    assert.equal(events[0].loading, true)
    assert.equal(events[1].loading, false)
    assert.deepEqual(events[1].results.map(result => result.category), [ 'blocks' ])
    assert.equal(events[1].results[0].block.height, 42)
  })
})

test('finishes gracefully when every autocomplete source is unavailable', () => {
  const hash = 'c'.repeat(64)
      , base = '/api'
      , { requester } = fakeRequester({
          [`${base}/tx/${hash}/status`]: new Error('transaction source unavailable'),
          [`${base}/block/${hash}`]: new Error('block source unavailable'),
          [`${base}/asset/${hash}`]: new Error('asset source unavailable'),
        })

  return collectAutocomplete(makeAutocompleteDriver(base, requester), hash).then(events => {
    assert.equal(events[0].loading, true)
    assert.deepEqual(events[1], { query: hash, loading: false, results: [], failed: true })
  })
})

test('debounces changed queries and looks up clears and complete hashes immediately', () => {
  const scheduler = new TestScheduler((actual, expected) => assert.deepEqual(actual, expected))
      , input$ = new Subject()
      , emissions = []

  scheduler.maxFrames = 3000
  debounceAutocompleteQueries(input$, scheduler)
    .subscribe(query => emissions.push([ scheduler.frame, query ]))

  const typed = autocompleteDelayMs - 50
      , cleared = typed + autocompleteDelayMs + 100
      , retyped = cleared + 100
      , hash = 'a'.repeat(64)
      , pasted = retyped + autocompleteDelayMs + 100

  scheduler.schedule(() => input$.next('U'), 0)
  scheduler.schedule(() => input$.next('US'), typed)
  scheduler.schedule(() => input$.next(''), cleared)
  scheduler.schedule(() => input$.next('US'), retyped)
  scheduler.schedule(() => input$.next(hash), pasted)
  scheduler.flush()

  assert.deepEqual(emissions, [
    [ typed + autocompleteDelayMs, 'US' ],
    [ cleared, '' ],
    [ retyped + autocompleteDelayMs, 'US' ],
    [ pasted, hash ],
  ])
})

test('deduplicates and ranks merged asset metadata results', () => {
  const firstId = '1'.repeat(64)
      , secondId = '2'.repeat(64)
      , thirdId = '3'.repeat(64)
      , results = mergeAssetResults([
          {
            field: 'name',
            assets: [
              { asset_id: firstId, name: 'Dollar', ticker: 'USD' },
              { asset_id: secondId, name: 'USD', ticker: null },
              { asset_id: thirdId, name: 'USD Coin', ticker: 'USDC' },
            ],
          },
          {
            field: 'ticker',
            assets: [ { asset_id: firstId, name: 'Dollar', ticker: 'USD' } ],
          },
        ], 'usd')

  assert.deepEqual(results.map(result => result.asset.asset_id), [ firstId, secondId, thirdId ])
})

test('ranks exact matches first, then assets with a displayable icon', () => {
  const icon = href => ({ icon: { href } })
      , exactId = '1'.repeat(64)
      , iconId = '2'.repeat(64)
      , invalidIconId = '3'.repeat(64)
      , results = mergeAssetResults([
          {
            field: 'ticker',
            assets: [
              { asset_id: exactId, ticker: 'USD' },
              { asset_id: invalidIconId, ticker: 'USDA', registry: icon('javascript:alert(1)') },
              { asset_id: iconId, ticker: 'USDT', registry: icon('https://registry.example.com/usdt.png') },
            ],
          },
        ], 'usd')

  assert.deepEqual(results.map(result => result.asset.asset_id), [ exactId, iconId, invalidIconId ])
})

test('renders categorized options and accessible active state', () => {
  const hash = 'a'.repeat(64)
      , vnode = search({
          t,
          autocomplete: {
            focused: true,
            dismissed: false,
            loading: false,
            activeIndex: 0,
            results: [
              {
                category: 'assets',
                id: `asset:${hash}`,
                pathname: `/asset/${hash}`,
                asset: {
                  asset_id: hash,
                  ticker: 'USDt',
                  name: 'Tether USD',
                  entity: { domain: 'tether.to' },
                  registry: { icon: { href: 'https://registry.example.com/usdt.png' } },
                },
              },
              {
                category: 'transactions',
                id: `transaction:${hash}`,
                pathname: `/tx/${hash}`,
                txid: hash,
              },
            ],
          },
        })
      , html = render(vnode)
      , findOption = node => node && node.data && node.data.dataset && node.data.dataset.autocompleteIndex != null
        ? node
        : node && node.children && node.children.map(findOption).find(Boolean)
      , option = findOption(vnode)

  assert.match(html, /aria-expanded="true"/)
  assert.match(html, /aria-activedescendant="search-autocomplete-option-0"/)
  assert.match(html, /Assets \(1\)/)
  assert.match(html, /Transactions \(1\)/)
  assert.match(html, /search-autocomplete-option search-autocomplete-asset-option active/)
  assert.match(html, /tabindex="-1"/)
  assert.match(html, /USDt — Tether USD/)
  assert.match(html, /<span class="search-autocomplete-domain">tether\.to<\/span> · <span class="mono">a{64}<\/span>/)
  assert.match(html, /<img class="asset-icon-image"[^>]* src="https:\/\/registry\.example\.com\/usdt\.png"/)
  assert.ok(option)
  assert.equal(option.data.dataset.autocompleteIndex, 0)
  assert.equal(option.data.dataset['autocomplete-index'], undefined)
})

test('renders the default asset icon without repeating a domain shown as the title', () => {
  const hash = 'b'.repeat(64)
      , html = render(search({
          t,
          autocomplete: {
            focused: true,
            dismissed: false,
            results: [{
              category: 'assets',
              id: `asset:${hash}`,
              pathname: `/asset/${hash}`,
              asset: { asset_id: hash, entity: { domain: 'example.com' }, registry: { icon: { href: 'javascript:alert(1)' } } },
            }],
          },
        }))

  assert.match(html, /<span class="search-autocomplete-primary">example\.com<\/span>/)
  assert.doesNotMatch(html, /search-autocomplete-domain/)
  assert.doesNotMatch(html, /<img class="asset-icon-image"/)
  assert.match(html, /asset-icon-container/)
})

test('leaves Bitcoin searches on the existing submit path without autocomplete requests', async () => {
  const previous = process.env.IS_ELEMENTS
  delete process.env.IS_ELEMENTS
  try {
    const { calls, requester } = fakeRequester({})
        , driver = makeAutocompleteDriver('/api', requester)
    for (const query of [ 'USD', 'example.com', 'a'.repeat(64), '1BoatSLRHtKNngkdXEeobR76b53LETtpyT' ]) {
      const events = await collectAutocomplete(driver, query)
      assert.deepEqual(events, [{ query, loading: false, results: [] }])
    }
    assert.equal(calls.length, 0)
    assert.doesNotMatch(render(search({ t })), /role="combobox"/)
  } finally {
    process.env.IS_ELEMENTS = previous
  }
})

test('reuses cached asset matches across searches without extra requests', async () => {
  const { calls, requester } = fakeRequester({
    '/api/assets/registry': { body: [{ asset_id: 'a'.repeat(64), ticker: 'USD' }] },
  })
      , driver = makeAutocompleteDriver('/api', requester)
  const first = await collectAutocomplete(driver, 'USD')
      , again = await collectAutocomplete(driver, 'usd')
  assert.equal(calls.length, 2)
  assert.equal(again.length, 1)
  assert.deepEqual(again[0].results, first[1].results)
})

test('caches lookups that settle after being cancelled', async () => {
  const { calls, requester } = fakeRequester({})
      , driver = makeAutocompleteDriver('/api', requester)
      , query$ = new Subject()
      , events = []

  driver(query$).subscribe(event => events.push(event))
  query$.next('USD')
  query$.next('')
  await new Promise(resolve => setTimeout(resolve))

  const again = await collectAutocomplete(driver, 'USD')
  assert.equal(calls.length, 2)
  assert.deepEqual(again, [{ query: 'USD', loading: false, results: [] }])
})
