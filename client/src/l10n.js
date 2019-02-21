import createL10ns from 'basic-l10n'
import browserLanguage from 'in-browser-language'

const langs = require('../../lang/index')

// use the plural form as the zero form
Object.entries(langs).forEach(([ lang_id, strs ]) =>
  Array.isArray(strs) && strs.unshift(strs[1]))

export default createL10ns(langs, { debug: console.error })

Object.entries(exports.default).forEach(([ lang_id, lang_t ]) =>  {
  lang_t.lang_id = lang_id
  lang_t.langs = exports.default
})

export const defaultLang = process.browser ? browserLanguage.pick(Object.keys(exports.default), 'en') : 'en'
