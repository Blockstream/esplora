#!/bin/bash
set -euo pipefail

$1 -rpcwait getblockchaininfo > /dev/null

while :; do
  chaininfo=$($1 getblockchaininfo)
  headers=$(echo "$chaininfo" | egrep -o '"headers": [0-9]+' | cut -d' ' -f2)
  blocks=$(echo "$chaininfo" | egrep -o '"blocks": [0-9]+' | cut -d' ' -f2)
  ibd=$(echo "$chaininfo" | egrep -o '"initialblockdownload": [a-z]+' | cut -d' ' -f2)

  echo "$blocks blocks of $headers headers (ibd: $ibd)"

  if [[ $ibd == "false" && $headers == $blocks ]]; then
    echo "done syncing"
    break
  fi

  sleep 30
done
