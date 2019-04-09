#!/bin/bash
export source="$1"
export dest="$2"

curl -s $source/mempool/txids | jq -r .[] | sort - > tx_ids_src.txt
curl -s $dest/mempool/txids | jq -r .[] | sort - > tx_ids_dest.txt


comm -23 tx_ids_src.txt tx_ids_dest.txt > tx_ids_res.txt

wc -l tx_ids_src.txt
wc -l tx_ids_dest.txt
wc -l tx_ids_res.txt

curl_stream() {
  hex_tx=$(curl -s $source/tx/$1/hex)
  curl -s $dest/tx -d @- &>/dev/null <<TXHEX
  $hex_tx
TXHEX
  echo $1
  echo ${#hex_tx}
}

export -f curl_stream

shuf tx_ids_res.txt | parallel -j40 curl_stream

echo "All done"
