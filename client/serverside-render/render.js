import run from '@cycle/rxjs-run'
import { makeHTTPDriver } from '@cycle/http'
import { makeHTMLDriver } from '@cycle/html'
import makeRouteDriver from '../driver/route'
import makeSearchDriver from '../driver/search'

import { Observable as O } from '../rxjs'

import main from '../app'

// should not be necessary following https://github.com/cyclejs/cyclejs/pull/874
const ModulesForHTML = Object.values(require('snabbdom-to-html/modules'))

const notFoundMarker = 'data-errorId="not-found"'
    , loadingMarker = 'src="img/Loading.gif"'

// TODO compile html on our own based on state
// TODO catch route redirects & issue 30x

export default function render(pathname, args='', locals={}, cb) {
  //let scheduled=false, seenLoading=false, called=false, timeout, lastHtml, lastTitle


  console.log('render',pathname,'with',args)

  function done() {
    if (called) return console.error('html render result() called too many times', pathname, { lastHtml });
    called = true
    cb(null, { html: lastHtml, title: lastTitle })
  }

  /*function processHTML(html) {
    lastHtml = html
    clearTimeout(timeout)

    // skip multiple HTML renders sent in the same tick
    if (scheduled) return;
    scheduled = true

    process.nextTick(_ => {
      scheduled = false

      const isNotFound = lastHtml.includes(notFoundMarker)
          , isLoading = lastHtml.includes(loadingMarker)

      if (isLoading) seenLoading = true

      // if its not a 404 and not a loading screen, we're good to go!
      if (!isNotFound && !isLoading) return done();

      // if its a 404 after a loading screen, fail immediately
      if (isNotFound && seenLoading) return done();

      // otherwise, reply with what we have after a timeout
      if (isNotFound) timeout = setTimeout(_ => done(), 100)
      if (isLoading) timeout = setTimeout(_ => done(), 1500)
    })
  }*/

  let lastHtml, lastTitle, seenLoading=false, called=false, timeout

  function htmlUpdate(html) {
    lastHtml = html
  }
  function stateUpdate({ title, loading, error }) {
    // lastState = ...
    lastTitle = title
    if (loading) seenLoading = true
    else if (seenLoading) process.nextTick(done)
  }

  //const noRouteTimeout = setTimeout(_ => !seenLoading && done([>TODO: render error page<]), 150)
  //const loadTimeout = setTimeout(_ => done(), 5000)

  run(main, {
    DOM: makeHTMLDriver(htmlUpdate, { modules: ModulesForHTML })
  , HTTP: makeHTTPDriver()
  , route: makeRouteDriver(_ => O.of({ pathname, hash: '#'+args }))
  , storage: _ => ({ local: { getItem: key => O.of(locals[key]) } })
  , search: _ => O.empty()
  , state: state$ => O.from(state$).subscribe(stateUpdate)
  })


}

