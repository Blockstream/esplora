import pug from 'pug'
import path from 'path'
import express from 'express'

import l10n from '../l10n'
import render from './render'

const themes = [ 'light', 'dark' ]
    , langs = Object.keys(l10n)

const rpath = p => path.join(__dirname, p)

const indexView = rpath('../index.pug')

const app = express()
app.engine('pug', pug.__express)

app.use(require('morgan')('dev'))
app.use(require('cookie-parser')('dev'))

app.get('*', (req, res, next) => {
  // TODO: promise
  // TODO: cookies as localStorage
  // TODO: handle 404

  let theme = req.query.theme || req.cookies.theme || 'dark'
  if (!themes.includes(theme)) theme = 'light'
  if (req.query.theme && req.cookies.theme !== theme) res.cookie('theme', theme)

  let lang = req.query.lang || req.cookies.lang || 'en'
  if (!langs.includes(lang)) lang = 'en'
  if (req.query.lang && req.cookies.lang !== lang) res.cookie('lang', lang)

  render(req._parsedUrl.pathname, req._parsedUrl.query || '', { theme, lang }, (err, resp) => {
    if (err) return next(err);

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
