#!/bin/bash

[[ -d node_modules ]] || npm install

if [ "$1" == "--cluster" ]; then
  file=cluster
  shift
else
  file=server
fi

for flavor in "$@"; do source ../flavors/$flavor/config.env; done

if [ -d dist ] && [ "$NODE_ENV" != "development" ]; then
  node dist/$file.js "$@"
else
  babel-node src/$file.js "$@"
fi
