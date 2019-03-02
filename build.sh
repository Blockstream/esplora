#!/bin/bash
set -xeo pipefail
shopt -s extglob

for flavor in "$@"; do source flavors/$flavor/config.env; done

export DEST=${DEST:-dist}
export NODE_ENV=${NODE_ENV:=production}
export BASE_HREF=${BASE_HREF:-/}
export API_URL=${API_URL:-"${BASE_HREF}api"}

mkdir -p $DEST
rm -rf $DEST/*

[[ -d node_modules ]] || npm install
(cd client && [[ -d node_modules ]] || npm install)

# Static assets
cp -rL www/* $CUSTOM_ASSETS $DEST/

# CSS customizations
[ -n "$CUSTOM_CSS" ] && cat $CUSTOM_CSS >> $DEST/style.css

# Index HTML
pug client/index.pug -o $DEST

# Open search (requires absolute CANONICAL_URL)
if [ -n "$CANONICAL_URL" ]; then
  pug client/opensearch.pug -E xml -o $DEST
fi

# RTLify CSS
cat $DEST/style.css | node -p "require('cssjanus').transform(fs.readFileSync('/dev/stdin').toString(), false, true)" > $DEST/style-rtl.css

# Browserify bundle
(cd client && browserify -p bundle-collapser/plugin src/run-browser.js \
  | ( [[ "$NODE_ENV" != "development" ]] && uglifyjs -cm || cat ) ) \
  > $DEST/app.js

# Pre-render notfound.html
babel-node render-view.js '{"view":"error","error":"Page Not Found"}' > $DEST/notfound.html
