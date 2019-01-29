import qs from 'querystring'
import pathRegexp from 'path-to-regexp'
import { Observable as O } from '../rxjs'

const isStr = x => typeof x === 'string'

const makeObj = (keys, values) => keys.reduce((o, k, i) => ({ ...o, [k.name]: values[i] }), {})

const baseHref  = process.env.BASE_HREF || '/'
    , stripBase = path => path.indexOf(baseHref) == 0 ? path.substr(baseHref.length-1) : path

const parseQuery = loc => {
  // Older versions of Esplora used the url hash instead of the query.
  // Try both for backward compatibility with old links.
  const query = qs.parse((loc.search || loc.hash || '').substr(1))
  // Convert value-less args to true
  Object.keys(query).forEach(key => (query[key] === '') && (query[key] = true))
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
