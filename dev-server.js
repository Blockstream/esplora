import fs, { promises as fsp } from 'fs'
import pug from 'pug'
import pathu from 'path'
import glob from 'glob'
import express from 'express'
import browserify from 'browserify-middleware'
import cssjanus from 'cssjanus'

const rpath = p => pathu.join(__dirname, p)

const app = express()

app.engine('pug', pug.__express)

app.use(require('morgan')('dev'))

if (process.env.CORS_ALLOW) {
  app.use((req, res, next) => {
    res.set('Access-Control-Allow-Origin', process.env.CORS_ALLOW)
    next()
  })
}

if (process.env.NOSCRIPT_REDIR_BASE) {
  app.use((req, res, next) => {
    if (req.query.nojs != null) return res.redirect(303, process.env.NOSCRIPT_REDIR_BASE+req.path)
    next()
  })
}

const custom_assets = (process.env.CUSTOM_ASSETS||'').split(/ +/).filter(Boolean)
    , custom_css    = (process.env.CUSTOM_CSS   ||'').split(/ +/).filter(Boolean)

const p = fn => (req, res, next) => fn(req, res).catch(next)

app.get('/', (req, res) => res.render(rpath('client/index.pug')))
app.get('/app.js', browserify(rpath('client/src/run-browser.js')))

// Merges the main stylesheet from www/style.css with the custom css files
app.get('/style.css', p(async (req, res) =>
  res.type('css').send(await prepCss())))

const prepCss = async _ =>
  (await Promise.all([ rpath('www/style.css'), ...custom_css ].map(path => fsp.readFile(path))))
    .join('\n')

// Automatically adjust CSS for RTL using cssjanus
app.get('/style-rtl.css', p(async (req, res) =>
  res.type('css').send(cssjanus.transform(await prepCss()))))

// Add handlers for custom asset overrides
custom_assets.forEach(pattern => {
  console.log(process.env.CUSTOM_ASSETS, pattern)

  // pattern could also be a simple path
  const paths = glob.sync(pattern)

  paths.forEach(path => {
    const name = pathu.basename(path)
        , stat = fs.statSync(path)

    stat.isDirectory()
      ? app.use('/'+name, express.static(path))
      : app.get('/'+name, (req, res) => res.sendFile(path))
  })
})

// And finally the default fallback assets from www/
app.use('/', express.static(rpath('www')))

app.use((req, res) => res.render(rpath('client/index.pug')))

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
