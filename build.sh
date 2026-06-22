#!/bin/bash
set -xeo pipefail
shopt -s extglob

for flavor in "$@"; do source flavors/$flavor/config.env; done

export DEST=${DEST:-dist}
export NODE_ENV=${NODE_ENV:=production}
export BASE_HREF=${BASE_HREF:-/}
export API_URL=${API_URL:-"${BASE_HREF}api"}

# Optional path prefix for serving the whole site under a sub-directory (e.g. a preview
# deploy keyed by branch name). Applied *after* the flavor sets its per-network BASE_HREF,
# so the network paths are preserved: / -> /$BASE_PREFIX/, /signet/ -> /$BASE_PREFIX/signet/.
# API_URL is resolved above, before this, so it keeps pointing at the un-prefixed network
# API and a prefixed build still talks to the same backend.
if [ -n "$BASE_PREFIX" ]; then
  export BASE_HREF="/${BASE_PREFIX#/}${BASE_HREF}"
  export BASE_PREFIX="/${BASE_PREFIX#/}"
fi

mkdir -p $DEST
rm -rf $DEST/*

[[ -d node_modules ]] || npm install
(cd client && [[ -d node_modules ]] || npm install)

# Static assets
cp -RL www/* $CUSTOM_ASSETS $DEST/

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
# --no-dedupe needed due to https://github.com/substack/bundle-collapser/issues/20 https://github.com/browserify/browserify/issues/1450
(cd client && browserify --no-dedupe -p bundle-collapser/plugin src/run-browser.js \
  | ( [[ "$NODE_ENV" != "development" ]] && uglifyjs -cm || cat ) ) \
  > $DEST/app.js

# Pre-render notfound.html
babel-node render-view.js '{"view":"error","error":"Page Not Found"}' > $DEST/notfound.html
