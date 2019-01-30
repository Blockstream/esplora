#!/bin/bash

../node_modules/.bin/babel -d dist src
(cd ../client && npm run dist)

rm -f client
ln -s ../client/dist client
