import createL10ns from 'basic-l10n'
import browserLanguage from 'in-browser-language'

export default createL10ns({
  en: require('../lang/en.json')
, 'pt-pt': require('../lang/pt-pt.json')
, de: require('../lang/de.json')
, fr: require('../lang/fr.json')
, it: require('../lang/it.json')
, es: require('../lang/es.json')
, nl: require('../lang/nl.json')
, ru: require('../lang/ru.json')
, sr: require('../lang/sr.json')
, hr: require('../lang/hr.json')
, bs: require('../lang/bs.json')
, me: require('../lang/me.json')
, sv: require('../lang/sv.json')
, 'zh-cn': require('../lang/zh-cn.json')
, he: require('../lang/he.json')
, jp: require('../lang/jp.json')
, ko: require('../lang/ko.json')
}, { debug: console.error })

Object.entries(exports.default).forEach(([ lang_id, lang_t ]) =>  {
  lang_t.lang_id = lang_id
  lang_t.langs = exports.default
})

export const defaultLang = browserLanguage.pick(Object.keys(exports.default), 'en')
