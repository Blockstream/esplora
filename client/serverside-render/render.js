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

export default function render(pathname, args='', locals={}, cb) {
  let scheduled=false, seenLoading=false, called=false, timeout, lastHtml, lastTitle

  function done() {
    if (called) return console.error('html render result() called too many times', pathname, { lastHtml });
    called = true
    cb(null, { html: lastHtml, title: lastTitle })
  }

  function processHTML(html) {
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
  }

  run(main, {
    DOM: makeHTMLDriver(processHTML, { modules: ModulesForHTML })
  , HTTP: makeHTTPDriver()
  , route: makeRouteDriver(_ => O.of({ pathname, hash: '#'+args }))
  , storage: _ => ({ local: { getItem: key => O.of(locals[key]) } })
  , search: _ => O.empty()
  , title: title$ => O.from(title$).subscribe(title => lastTitle = title)
  })


}

//render('/tx/4c9df295b97b50c2aaeb309f4cd24d11917cd60b18bfe2a97527a86c1c3e0c0f', '', { lang: 'he' }, (err, res) => console.log({ err, res }))
