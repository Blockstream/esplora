#!/bin/bash

source="$1"
dest="$2"

curl -s $source/mempool/txids | jq -r .[] | while read txid; do
  echo pushing $txid
  curl -s $dest/tx -d $(curl -s $source/tx/$txid/hex)
  echo
done
