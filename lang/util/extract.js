#!/usr/bin/env node

const fs = require('fs')
   , parser = require('@babel/parser')
   , traverse = require('@babel/traverse').default

const jsStr = fs.readFileSync('/dev/stdin').toString()
    , jsAst = parser.parse(jsStr, { sourceType: 'module', plugins: [ "jsx" ] })

// Extracts translation strings from source files by looking
// for t`...` template strings and for string literals that appear like UI strings

// literal strings starting with an uppercase and containing at least one space
// are considered to be user-presented UI strings
const reLangStr = /^[A-Z].* /

// Except for these, which match the pattern but don't need translations
const langStrBlacklist = ['Block Explorer', 'Request has been terminated', 'Toggle navigation']

traverse(jsAst, {
  TemplateLiteral(path) {
    if (path.container.tag && path.container.tag.name == 't') {
      const parts = path.node.quasis.map(p => p.value.raw)
      console.log(parts.join('%s'))
    }
  },

  StringLiteral(path) {
    if (reLangStr.test(path.node.value) && !langStrBlacklist.includes(path.node.value)) {
      console.log(path.node.value)
    }
  }
})

