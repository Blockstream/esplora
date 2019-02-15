import run from '@cycle/rxjs-run'
import storageDriver from '@cycle/storage'
import { makeHTTPDriver } from '@cycle/http'
import { makeDOMDriver } from '@cycle/dom'
import { makeHistoryDriver, captureClicks } from '@cycle/history'
import makeRouteDriver from './driver/route'
import makeSearchDriver from './driver/search'
import makeScanDriver from './driver/instascan'

import { Observable as O } from './rxjs'

import main from './app'

const apiBase = (process.env.API_URL || '/api').replace(/\/+$/, '')
    , webBase = process.env.BASE_HREF || '/'
    , initTitle = process.browser ? document.title : process.env.SITE_TITLE

const titleDriver = title$ => O.from(title$)
  .subscribe(title => document.title = title ? `${title} · ${initTitle}` : initTitle)

run(main, {
  DOM: makeDOMDriver('#explorer')
, HTTP: makeHTTPDriver()
, route: makeRouteDriver(captureClicks(makeHistoryDriver({ basename: webBase })))
, storage: storageDriver
, search: makeSearchDriver(apiBase)
, title: titleDriver
, scanner: makeScanDriver()
})
