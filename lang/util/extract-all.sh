#!/bin/bash

# requires sponge from moreutils

(
  cat lang/strings.txt
  for file in client/src/{,**/}*.js; do ./lang/util/extract.js < $file; done
) | sort | uniq | sponge lang/strings.txt
