#!/bin/bash

for file in client/src/{,**/}*.js; do ./lang/util/extract.js < $file; done
