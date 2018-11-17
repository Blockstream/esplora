#!/bin/bash
set -xeo pipefail
shopt -s extglob

: ${DEST:=dist}
: ${NODE_ENV:=production}

export NODE_ENV

mkdir -p $DEST
rm -rf $DEST/*

[[ -d node_modules ]] || npm install
(cd client && [[ -d node_modules ]] || npm install)

# Static assets
cp -rL www/* $DEST/

# Index HTML
pug index.pug -o $DEST

# RTLify CSS
cat www/style.css | node -p "require('cssjanus').transform(fs.readFileSync('/dev/stdin').toString(), false, true)" > $DEST/style-rtl.css

# Browserify bundle
(cd client && browserify -p bundle-collapser/plugin app.js \
  | ( [[ "$NODE_ENV" != "development" ]] && uglifyjs -cm || cat ) ) \
  > $DEST/app.js

# Pre-render notfound.html
babel-node render-view.js '{"view":"error","error":"Page Not Found"}' > $DEST/notfound.html
