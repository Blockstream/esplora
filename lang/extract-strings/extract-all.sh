#!/bin/bash

for file in ../../client/src/{,**/}*.js; do
  ./extract.js < $file
done
