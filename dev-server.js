import fs, { promises as fsp } from 'fs'
import pug from 'pug'
import pathu from 'path'
import glob from 'glob'
import express from 'express'
import browserify from 'browserify-middleware'
import cssjanus from 'cssjanus'

const rpath = p => pathu.join(__dirname, p)

const app = express()
const router = express.Router()
const baseHref = process.env.BASE_HREF || '/'
const basePath = baseHref === '/' ? '/' : `/${baseHref.replace(/^\/+|\/+$/g, '')}`
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

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

if (basePath !== '/') {
  app.get('/', (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    res.redirect(302, `${basePath}/${query}`)
  })

  app.get(new RegExp(`^${escapeRegExp(basePath)}$`), (req, res) => {
    const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : ''
    res.redirect(302, `${basePath}/${query}`)
  })
}

router.get('/', (req, res) => res.render(rpath('client/index.pug')))
router.get('/app.js', browserify(rpath('client/src/run-browser.js')))

// Merges the main stylesheet from www/style.css with the custom css files
router.get('/style.css', p(async (req, res) =>
  res.type('css').send(await prepCss())))

const prepCss = async _ =>
  (await Promise.all([ rpath('www/style.css'), ...custom_css ].map(path => fsp.readFile(path))))
    .join('\n')

// Automatically adjust CSS for RTL using cssjanus
router.get('/style-rtl.css', p(async (req, res) =>
  res.type('css').send(cssjanus.transform(await prepCss()))))

// Add handlers for custom asset overrides
custom_assets.forEach(pattern => {
  // pattern could also be a simple path
  const paths = glob.sync(pattern)

  paths.forEach(path => {
    const name = pathu.basename(path)
        , stat = fs.statSync(path)

    stat.isDirectory()
      ? router.use(`/${name}`, express.static(path))
      : router.get(`/${name}`, (req, res) => res.sendFile(path))
  })
})

// And finally the default fallback assets from www/
router.use(express.static(rpath('www')))

router.use((req, res) => res.render(rpath('client/index.pug')))

app.use(basePath, router)

app.listen(process.env.PORT || 5000, function(){
  console.log(`HTTP server running on ${this.address().address}:${this.address().port}`)
})
