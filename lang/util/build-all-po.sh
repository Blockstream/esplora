#!/bin/bash

# This script is only meant to be run once, initially.
# After that, the canonical files are the .po files and the
# .json files should no longer be updated.

for file in lang/*.json; do
  ./lang/util/json2po.js < $file > ${file%.*}.po
done
