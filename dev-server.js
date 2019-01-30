import fs from 'fs'
import pug from 'pug'
import path from 'path'
import express from 'express'
import browserify from 'browserify-middleware'
import cssjanus from 'cssjanus'

const rpath = p => path.join(__dirname, p)

const app = express()

app.engine('pug', pug.__express)

app.use(require('morgan')('dev'))

if (process.env.CORS_ALLOW) {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.CORS_ALLOW)
    next()
  })
}

if (process.env.PRERENDER_URL) {
  app.use((req, res, next) => {
    if (req.query.nojs != null) return res.redirect(303, process.env.PRERENDER_URL+req.path)
    next()
  })
}

app.get('/', (req, res) => res.render(rpath('client/index.pug')))
app.get('/app.js', browserify(rpath('client/src/run-browser.js')))
app.get('/style-rtl.css', (req, res) =>
  res.type('css').send(cssjanus.transform(fs.readFileSync(rpath('www/style.css')).toString(), false, true)))

app.use('/', express.static(rpath('www')))

app.use((req, res) => res.render(rpath('client/index.pug')))

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
