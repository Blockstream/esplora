import pathRegexp from 'path-to-regexp'
import { Observable as O } from '../rxjs'

const isStr = x => typeof x === 'string'

const makeObj = (keys, values) => keys.reduce((o, k, i) => ({ ...o, [k.name]: values[i] }), {})

const baseHref  = process.env.BASE_HREF
    , stripBase = path => path.indexOf(baseHref) == 0 ? path.substr(baseHref.length-1) : path

module.exports = history => goto$ => {
  const history$ = O.from(history(
    goto$.map(goto => isStr(goto) ? { type: 'push', pathname: goto } : goto)
  ))

  return path => {
    if (!path) return history$

    const keys=[], re=pathRegexp(path, keys)

    return history$
      .map(loc => ({ ...loc, pathname: stripBase(loc.pathname) }))
      .map(loc => ({ ...loc, matches: loc.pathname.match(re) }))
      .filter(loc => !!loc.matches)
      .map(loc => ({ ...loc, params: makeObj(keys, loc.matches.slice(1)) }))
  }
}
