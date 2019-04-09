#!/bin/bash

curl_stream() {
  hex_tx=$(curl -s $source/tx/$1/hex)
  curl -s $dest/tx -d @- &>/dev/null <<TXHEX
  $hex_tx
TXHEX
}

export -f curl_stream

sync_mempool() {
  export source="$1"
  export dest="$2"
  comm -23 <(curl -s $source/mempool/txids | jq -r .[] | sort) \
           <(curl -s $dest/mempool/txids | jq -r .[] | sort) \
    | shuf \
    | parallel -j40 curl_stream
  echo "Done $source to $dest"
}

sync_mempool $1 $2
sync_mempool $2 $1

echo "All done"
