#!/bin/bash

[[ -d node_modules ]] || npm install

if [ -d dist ] && [ "$NODE_ENV" != "development" ]; then
  node dist/server.js "$@"
else
  babel-node src/server.js "$@"
fi
