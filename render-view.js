process.env.NO_QR=1
global.window = {}

const pug = require('pug')
    , l10n  = require('./client/l10n').default
    , state = JSON.parse(process.argv[2])
    , view = require('./client/views')[state.view]

state.t = l10n[state.lang || 'en']

require('pug').renderFile('client/index.pug', {
  prerender_html: require('snabbdom-to-html')(view(state))
}, (err, html) => {
  if (err) throw err
  console.log(html)
})
