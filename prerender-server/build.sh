#!/bin/bash

../node_modules/.bin/babel --root-mode upward --only src,../client/src -d dist src
(cd ../client && npm run dist)

rm -f client
ln -s ../client/dist client
