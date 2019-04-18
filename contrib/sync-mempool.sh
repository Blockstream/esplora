#!/bin/bash
export source="$1"
export dest="$2"

curl_stream() {
  hex_tx=$(curl -s $source/tx/$1/hex)
  curl -s $dest/tx -d @- &>/dev/null <<TXHEX
  $hex_tx
TXHEX
  echo $1
  echo ${#hex_tx}
}

export -f curl_stream

comm -23 <(curl -s $source/mempool/txids | jq -r .[] | sort) \
         <(curl -s $dest/mempool/txids | jq -r .[] | sort) \
  | shuf \
  | parallel -j40 curl_stream

echo "All done"
