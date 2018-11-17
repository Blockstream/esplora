#!/usr/bin/env
const { readFileSync } = require('fs')

const escape = str => !str ? '' : str.replace(/[\\"]/g, "\\$&")

const tran = JSON.parse(readFileSync('/dev/stdin'))
    , tranEn = require(`./en.json`)

const poStr = readFileSync("./strings.txt").toString('utf8').split("\n").filter(Boolean).map(str => {
  const val = tran[str] || tranEn[str] || str
  return Array.isArray(val) ? `msgid "${str}"\nmsgid_plural "${str}__plural"\n`
                                + val.slice(1).map((v, i) => `msgstr[${i}] "${escape(v || '-')}"`).join("\n")
                            : `msgid "${str}"\nmsgstr "${escape(val)}"`
}).join("\n")

console.log(poStr)
