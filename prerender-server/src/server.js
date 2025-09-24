import fs from 'fs'
import pug from 'pug'
import path from 'path'
import express from 'express'
import request from 'superagent'
import promClient from 'prom-client'

import l10n from '../client/l10n'
import render from '../client/run-server'

const themes = ['light', 'dark']
  , langs = Object.keys(l10n)
  , baseHref = process.env.BASE_HREF || '/'
  , canonBase = process.env.CANONICAL_URL ? process.env.CANONICAL_URL.replace(/\/$/, '') : null
  , apiUrl = process.env.API_URL.replace(/\/$/, '')

const rpath = p => path.join(__dirname, p)

const indexView = rpath('../../client/index.pug')

const register = new promClient.Registry()

const activeRenders = new promClient.Gauge({
  name: 'prerender_active_renders',
  help: 'Number of active renders'
})

const totalRenders = new promClient.Counter({
  name: 'prerender_total_renders',
  help: 'Total number of renders completed'
})

const renderDuration = new promClient.Histogram({
  name: 'prerender_render_duration_seconds',
  help: 'Duration of renders in seconds'
})

register.registerMetric(activeRenders)
register.registerMetric(totalRenders)
register.registerMetric(renderDuration)

let requestCounter = 0

const app = express()
app.set('trust proxy', true)
app.engine('pug', pug.__express)

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

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

  if (typeof process.send === 'function') {
    const requestId = ++requestCounter
    process.send({ type: 'startRender', requestId })
    let responded = false
    const handler = (msg) => {
      if (msg.requestId === requestId && !responded) {
        responded = true
        clearTimeout(timeout)
        process.removeListener('message', handler)
        if (msg.type === 'renderAllowed') {
          doRender()
        } else if (msg.type === 'renderDenied') {
          res.status(503).send('Server overloaded')
        }
      }
    }
    process.on('message', handler)
    const timeout = setTimeout(() => {
      if (!responded) {
        responded = true
        process.removeListener('message', handler)
        console.error('IPC timeout for request', requestId)
        res.status(500).send('Internal server error')
      }
    }, 5000) // 5 second timeout
  } else {
    doRender()
  }

  function doRender() {
    activeRenders.inc()
    const end = renderDuration.startTimer()
    let metricsUpdated = false
    render(req._parsedUrl.pathname, req._parsedUrl.query || '', req.body, { theme, lang, isHead: req.method === 'HEAD' }, (err, resp) => {
      if (!metricsUpdated) {
        metricsUpdated = true
        if (typeof process.send === 'function') process.send({ type: 'endRender' })
        activeRenders.dec()
        end()
        totalRenders.inc()
      }
      if (err) return next(err)
      if (resp.redirect) return res.redirect(301, baseHref + resp.redirect)
      if (resp.errorCode) {
        console.error(`Failed with code ${resp.errorCode}:`, resp)
        return res.sendStatus(resp.errorCode)
      }

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
  }
})

// Cleanup socket file from previous executions
if (process.env.SOCKET_PATH) {
  try {
    if (fs.statSync(process.env.SOCKET_PATH).isSocket()) {
      fs.unlinkSync(process.env.SOCKET_PATH)
    }
  } catch (_) { }
}

app.listen(process.env.SOCKET_PATH || process.env.PORT || 5001, function () {
  let addr = this.address()
  if (addr.address) addr = `${addr.address}:${addr.port}`
  console.log(`HTTP server running on ${addr}`)
})
