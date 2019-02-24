#!/usr/bin/env node

const fs = require('fs')
   , parser = require('@babel/parser')
   , traverse = require('@babel/traverse').default

const jsStr = fs.readFileSync('/dev/stdin').toString()
    , jsAst = parser.parse(jsStr, { sourceType: 'module', plugins: [ "jsx" ] })

// Extracts translation strings from source files by looking
// for t`...` template strings

traverse(jsAst, {
  TemplateLiteral(path) {
    if (path.container.tag && path.container.tag.name == 't') {
      const parts = path.node.quasis.map(p => p.value.raw)
      console.log(parts.join('%s'))
    }
  }
})

