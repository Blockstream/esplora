import pug from 'pug'
import path from 'path'
import express from 'express'

import render from './render'

const themes = [ 'light', 'dark' ]

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
  if (req.cookies.theme !== theme) res.cookie('theme', req.query.theme)

  render(req._parsedUrl.pathname, req._parsedUrl.query || '', { theme }, (err, resp) => {
    if (err) return next(err);

    res.render(indexView, {
      prerender_title: resp.title,
      prerender_html: resp.html,
      noscript: true,
      theme,
    })
  })

})

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
