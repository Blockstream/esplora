#!/bin/bash

[[ -d node_modules ]] || npm install

file=${1:-server}

if [ -d dist ] && [ "$NODE_ENV" != "development" ]; then
  node dist/$file.js "$@"
else
  babel-node src/$file.js "$@"
fi
