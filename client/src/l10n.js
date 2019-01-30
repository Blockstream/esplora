import createL10ns from 'basic-l10n'
import browserLanguage from 'in-browser-language'

export default createL10ns(require('../../lang/index'), { debug: console.error })

Object.entries(exports.default).forEach(([ lang_id, lang_t ]) =>  {
  lang_t.lang_id = lang_id
  lang_t.langs = exports.default
})

export const defaultLang = process.browser ? browserLanguage.pick(Object.keys(exports.default), 'en') : 'en'
