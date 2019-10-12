global.window = {}

const pug = require('pug')
    , l10n  = require('./client/src/l10n').default
    , state = JSON.parse(process.argv[2])
    , view = require('./client/src/views')[state.view]

state.t = l10n[state.lang || 'en']
state.page = { pathname: '', query: {} }

require('pug').renderFile('client/index.pug', {
  prerender_html: require('snabbdom-to-html')(view(state))
, theme: 'dark'
}, (err, html) => {
  if (err) throw err
  console.log(html)
})
