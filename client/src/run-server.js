import run from '@cycle/rxjs-run'
import { makeHTTPDriver } from '@cycle/http'
import { makeHTMLDriver } from '@cycle/html'
import makeRouteDriver from './driver/route'
import makeSearchDriver from './driver/search'
import { Observable as O } from './rxjs'

import main from './app'

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')

const LOAD_TIMEOUT = process.env.PRERENDER_TIMEOUT || 30000
    , ROUTE_TIMEOUT = 50
    , INIT_STATE_TIMEOUT = 1000

// should not be necessary following https://github.com/cyclejs/cyclejs/pull/874
const ModulesForHTML = Object.values(require('snabbdom-to-html/modules'))

export default function render(pathname, args='', body, locals={}, cb) {

  let lastHtml, lastState, seenLoading=false, called=false

  let timeout = setTimeout(_ => done({ errorCode: 500 }), INIT_STATE_TIMEOUT)

  function done(data) {
    if (called) return console.error('html render result() called too many times', pathname, '\n------\ndata: ', data, '\n------\n lastState:', lastState, '\n------\n lastHtml:', lastHtml, '\n\n\n');
    called = true
    clearTimeout(timeout)
    dispose()

    const status = lastState.view == 'notFound' ? 404 : lastState.error ? 400 : 200
    cb(null, data || { html: lastHtml, title: lastState.title, status })
  }

  function htmlUpdate(html) {
    lastHtml = html
  }
  function stateUpdate(S) {
    if (!lastState) { // the first state
      clearTimeout(timeout)
      timeout = setTimeout(_ => done(), ROUTE_TIMEOUT)
    }

    lastState = S

    if (S.loading || !S.isReady) {
      if (!seenLoading) {
        seenLoading = true
        clearTimeout(timeout)
        timeout = setTimeout(_ => done({ errorCode: 504 }), LOAD_TIMEOUT)
      }
    }
    else if (seenLoading) done()
  }

  const historyDriver = goto$ => {
    O.from(goto$).subscribe(loc =>
      done({ redirect: loc.pathname + (loc.search || '') })
    )
    return O.of({ pathname, search: '?'+args, body })
  }

  const dispose = run(main, {
    DOM: makeHTMLDriver(htmlUpdate, { modules: ModulesForHTML })
  , HTTP: makeHTTPDriver()
  , route: makeRouteDriver(historyDriver)
  , storage: _ => ({ local: { getItem: key => O.of(locals[key]) } })
  , scanner: _ => O.empty()
  , search: makeSearchDriver(apiBase)
  , state: state$ => O.from(state$).subscribe(stateUpdate)
  })
}
