import fs from 'fs'
import pug from 'pug'
import path from 'path'
import express from 'express'
import request from 'superagent'

import l10n from '../client/l10n'
import render from '../client/run-server'

const themes = [ 'light', 'dark' ]
    , langs = Object.keys(l10n)
    , baseHref = process.env.BASE_HREF || '/'
    , canonBase = process.env.CANONICAL_URL ? process.env.CANONICAL_URL.replace(/\/$/, '') : null
    , apiUrl = process.env.API_URL.replace(/\/$/, '')

const rpath = p => path.join(__dirname, p)

const indexView = rpath('../../client/index.pug')

const app = express()
app.engine('pug', pug.__express)

if (app.settings.env == 'development')
  app.use(require('morgan')('dev'))

app.use(require('cookie-parser')())
app.use(require('body-parser').urlencoded({ extended: false }))

app.use((req, res, next) => {
  // TODO: optimize /block-height/nnn (no need to render the whole app just to get the redirect)

  let theme = req.query.theme || req.cookies.theme || 'dark'
  if (!themes.includes(theme)) theme = 'light'
  if (req.query.theme && req.cookies.theme !== theme) res.cookie('theme', theme)

  let lang = req.query.lang || req.cookies.lang || 'en'
  if (!langs.includes(lang)) lang = 'en'
  if (req.query.lang && req.cookies.lang !== lang) res.cookie('lang', lang)

  render(req._parsedUrl.pathname, req._parsedUrl.query || '', req.body, { theme, lang }, (err, resp) => {
    if (err) return next(err)
    if (resp.redirect) return res.redirect(301, baseHref + resp.redirect.substr(1))
    if (resp.errorCode) return res.sendStatus(resp.errorCode)

    res.status(resp.status || 200)
    res.render(indexView, {
      prerender_title: resp.title
    , prerender_html: resp.html
    , canon_url: canonBase ? canonBase + req.url : null
    , noscript: true
    , theme
    , t: l10n[lang]
    })
  })

})

// Cleanup socket file from previous executions
if (process.env.SOCKET_PATH) {
  try {
    if (fs.statSync(process.env.SOCKET_PATH).isSocket()) {
      fs.unlinkSync(process.env.SOCKET_PATH)
    }
  } catch (_) {}
}

app.listen(process.env.SOCKET_PATH || process.env.PORT || 5001, function(){
  let addr = this.address()
  if (addr.address) addr = `${addr.address}:${addr.port}`
  console.log(`HTTP server running on ${addr}`)
})
