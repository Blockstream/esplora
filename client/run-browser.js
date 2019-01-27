import run from '@cycle/rxjs-run'
import storageDriver from '@cycle/storage'
import { makeHTTPDriver } from '@cycle/http'
import { makeDOMDriver } from '@cycle/dom'
import { makeHistoryDriver, captureClicks } from '@cycle/history'
import makeRouteDriver from './driver/route'
import makeSearchDriver from './driver/search'

import main from './app'

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')
    , webBase = process.env.BASE_HREF || '/'

run(main, {
  DOM: makeDOMDriver('#explorer')
, HTTP: makeHTTPDriver()
, route: makeRouteDriver(captureClicks(makeHistoryDriver({ basename: webBase })))
, storage: storageDriver
, search: makeSearchDriver(apiBase)
})
