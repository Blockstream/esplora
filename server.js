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

app.get('/', (req, res) => res.render(rpath('client/index.pug')))
app.get('/app.js', browserify(rpath('client/app.js')))
app.get('/style-rtl.css', (req, res) =>
  res.type('css').send(cssjanus.transform(fs.readFileSync(rpath('www/style.css')).toString(), false, true)))

app.use('/', express.static(rpath('www')))

app.use((req, res) => res.render(rpath('index.pug')))

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
