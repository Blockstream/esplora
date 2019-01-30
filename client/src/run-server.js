import run from '@cycle/rxjs-run'
import { makeHTTPDriver } from '@cycle/http'
import { makeHTMLDriver } from '@cycle/html'
import makeRouteDriver from './driver/route'
import makeSearchDriver from './driver/search'
import { Observable as O } from './rxjs'

import main from './app'

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')

const LOAD_TIMEOUT = 5000
    , ROUTE_TIMEOUT = 250

// should not be necessary following https://github.com/cyclejs/cyclejs/pull/874
const ModulesForHTML = Object.values(require('snabbdom-to-html/modules'))

export default function render(pathname, args='', locals={}, cb) {

  let lastHtml, lastState, seenLoading=false, called=false

  let timeout = setTimeout(_ => done(), ROUTE_TIMEOUT)

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
    lastState = S

    if (S.loading) {
      if (!seenLoading) {
        seenLoading = true
        clearTimeout(timeout)
        timeout = setTimeout(_ => done({ errorCode: 504 }), LOAD_TIMEOUT)
      }
    }
    else if (seenLoading && S.tipHeight) done()
  }

  const historyDriver = goto$ => {
    O.from(goto$).subscribe(loc =>
      done({ redirect: loc.pathname + (loc.search || '') })
    )
    return O.of({ pathname, search: '?'+args })
  }

  const dispose = run(main, {
    DOM: makeHTMLDriver(htmlUpdate, { modules: ModulesForHTML })
  , HTTP: makeHTTPDriver()
  , route: makeRouteDriver(historyDriver)
  , storage: _ => ({ local: { getItem: key => O.of(locals[key]) } })
  , search: makeSearchDriver(apiBase)
  , state: state$ => O.from(state$).subscribe(stateUpdate)
  })
}
