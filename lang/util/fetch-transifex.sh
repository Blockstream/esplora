#!/bin/bash
set -eo pipefail

TRANSIFEX_PROJECT=esplora
TRANSIFEX_RESOURCE=esplora

for file in lang/*.po; do
  lang=`basename $file`
  lang=${lang%.*}
  lang=${lang%-*}

  # These are identified differently by transifex
  [ "$lang" == "me" ] && lang=sr_ME
  [ "$lang" == "jp" ] && lang=ja

  echo "Downloading $lang from transifex to $file"
  curl -s -L -u api:$TRANSIFEX_KEY "https://www.transifex.com/api/2/project/$TRANSIFEX_PROJECT/resource/$TRANSIFEX_RESOURCE/translation/$lang?file=po&mode=reviewed" > $file

  echo "Generating json from $file"
  ./lang/util/po2json.js < $file > ${file%.*}.json
done
