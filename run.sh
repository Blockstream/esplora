#!/bin/bash
set -eo pipefail

FLAVOR=$1

if [ -z "$FLAVOR" ] || [ $FLAVOR != "bitcoin-mainnet" ]; then
    echo "Should be run on bitcoin-mainnet only"
    exit 1
fi

DAEMON=$(echo ${FLAVOR} | cut -d'-' -f1)
NETWORK=$(echo ${FLAVOR} | cut -d'-' -f2)

DB_DIR=/data/electrs_${DAEMON}_db/$NETWORK

/srv/explorer/electrs_$DAEMON/bin/popular-scripts --network $NETWORK --db-dir $DB_DIR > $DB_DIR/popular-scripts.txt
