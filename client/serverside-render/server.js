import pug from 'pug'
import path from 'path'
import express from 'express'

import render from './render'

const rpath = p => path.join(__dirname, p)

const indexView = rpath('../index.pug')

const app = express()
app.set('query parser', false)
app.engine('pug', pug.__express)

app.use(require('morgan')('dev'))

app.get('*', (req, res, next) => {
  // TODO: promise
  // TODO: cookies as localStorage
  // TODO: handle 404

  render(req._parsedUrl.pathname, req._parsedUrl.query || '', {}, (err, resp) => {
    if (err) return next(err);

    res.render(indexView, {
      prerender_title: resp.title,
      prerender_html: resp.html,
      noscript: true,
    })
  })

})

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
