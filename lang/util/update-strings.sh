#!/bin/bash

# requires sponge from moreutils
(
  cat lang/strings.txt
  ./lang/util/extract-all.sh
) | sort | uniq | sponge lang/strings.txt
