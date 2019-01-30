import pug from 'pug'
import path from 'path'
import express from 'express'

import l10n from '../client/src/l10n'
import render from '../client/src/run-server'

const themes = [ 'light', 'dark' ]
    , langs = Object.keys(l10n)

const rpath = p => path.join(__dirname, p)

const indexView = rpath('../client/index.pug')

const app = express()
app.engine('pug', pug.__express)

app.use(require('morgan')('dev'))
app.use(require('cookie-parser')())

app.get('*', (req, res, next) => {
  // TODO: optimize /block-height/nnn (no need to render the whole app just to get the redirect)

  let theme = req.query.theme || req.cookies.theme || 'dark'
  if (!themes.includes(theme)) theme = 'light'
  if (req.query.theme && req.cookies.theme !== theme) res.cookie('theme', theme)

  let lang = req.query.lang || req.cookies.lang || 'en'
  if (!langs.includes(lang)) lang = 'en'
  if (req.query.lang && req.cookies.lang !== lang) res.cookie('lang', lang)

  render(req._parsedUrl.pathname, req._parsedUrl.query || '', { theme, lang }, (err, resp) => {
    if (err) return next(err)
    if (resp.redirect) return res.redirect(303, resp.redirect)
    if (resp.errorCode) return res.sendStatus(resp.errorCode)

    res.status(resp.status || 200)
    res.render(indexView, {
      prerender_title: resp.title,
      prerender_html: resp.html,
      noscript: true,
      theme,
      t: l10n[lang],
    })
  })

})

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
