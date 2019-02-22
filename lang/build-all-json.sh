#!/bin/bash

set -xeo pipefail

for file in lang/*.po; do
  ./lang/po2json.js < $file > ${file%.*}.json
done
