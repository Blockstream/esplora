import qs from 'querystring'
import pathRegexp from 'path-to-regexp'
import { Observable as O } from '../rxjs'

const isStr = x => typeof x === 'string'

const makeObj = (keys, values) => keys.reduce((o, k, i) => ({ ...o, [k.name]: values[i] }), {})

const baseHref  = process.env.BASE_HREF || '/'
    , stripBase = path => path.indexOf(baseHref) == 0 ? path.substr(baseHref.length-1) : path

const parseQuery = loc => {
  // Older versions of Esplora used a comma-separated url hash instead of a query string.
  // Try both for backward compatibility with old links.
  const query = loc.search ? qs.parse(loc.search.substr(1))
              : loc.hash ? loc.hash.substr(1).split(',').reduce((acc, k) => ({ ...acc, [k]: true }), {})
              : {}

  // Convert value-less args to true
  Object.keys(query).filter(key => key !== 'q' && query[key] === '')
    .forEach(key => query[key] = true)

  return query
}

module.exports = history => goto$ => {
  const history$ = O.from(history(goto$.map(goto => isStr(goto) ? { type: 'push', pathname: goto } : goto)))
    .map(loc =>({...loc, pathname: stripBase(loc.pathname), query: parseQuery(loc) }))

  const page$ = history$
    .filter((loc, i) => i == 0 || !loc.state || !loc.state.noRouting)

  function route(path) {
    if (!path) return page$

    const keys=[], re=pathRegexp(path, keys)

    return page$
      .map(loc => ({ ...loc, matches: loc.pathname.match(re) }))
      .filter(loc => !!loc.matches)
      .map(loc => ({ ...loc, params: makeObj(keys, loc.matches.slice(1)) }))
  }

  route.all$ = history$

  return route
}
