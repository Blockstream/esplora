#!/usr/bin/env node

const fs = require('fs')
    , path = require('path')

const escape = str => !str ? '' : str.replace(/[\\"]/g, "\\$&")

const lang_strs = JSON.parse(fs.readFileSync('/dev/stdin'))
    , lang_id = lang_strs.lang_id
    , eng_strs = require('../en.json')

const poStr = fs.readFileSync(path.join(__dirname, '..', 'strings.txt')).toString('utf8')
  .split("\n")
  .filter(Boolean)
  .map(str => {

    const has_plural = Array.isArray(eng_strs[str])
    let lang_str = lang_strs[str] || (lang_id == 'en' && str)

    if (has_plural && !Array.isArray(lang_str)) {
      lang_str = [ lang_str, lang_str ]
    }

    return !lang_str ? null
         : !has_plural ? `msgid "${str}"\nmsgstr "${escape(lang_str)}"`
         : `msgid "${escape(str)} (singular)"\nmsgstr "${escape(lang_str[0])}"\n\n`
          +`msgid "${escape(str)} (plural)"\nmsgstr "${escape(lang_str[1])}"`
  })
  .filter(Boolean)
  .join("\n\n")

console.log(`
msgid ""
msgstr "Language: ${lang_id}\\n"

${poStr}
`)
