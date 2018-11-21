#!/bin/bash
set -eo pipefail

FLAVOR=$1
MODE=$2

if [ "$FLAVOR" != "bitcoin-mainnet" ] && [ "$FLAVOR" != "bitcoin-testnet" ] && [ "$FLAVOR" != "liquid-mainnet" ]; then
    echo "Please provide bitcoin-testnet, bitcoin-mainnet or liquid-mainnet as a parameter"
    echo "For example run.sh bitcoin-mainnet explorer"
    exit 1
fi

EXPLORERAUTOSTART="false"
TORAUTOSTART="true"

if [ "$MODE" == "explorer" ]; then
    TORAUTOSTART="false"
    EXPLORERAUTOSTART="true"
elif [ "$MODE" != "private-bridge" ] && [ "$MODE" != "public-bridge" ]; then
    echo "Mode can only be private-bridge, public-bridge or explorer"
    exit 1
fi

echo "Enabled mode ${MODE}"

DAEMON=$(echo ${FLAVOR} | cut -d'-' -f1)
NETWORK=$(echo ${FLAVOR} | cut -d'-' -f2)
BTC_DAEMON_RPC_PORT=2002

ELECTRS_NETWORK=${NETWORK}

ISLIQUID="false"
NGINX_NOSLASH_PATH="unused"
if [ "${DAEMON}" != "liquid" ]; then
    if [ "${NETWORK}" == "testnet" ]; then
        NGINX_PATH="testnet/"
        NGINX_NOSLASH_PATH="testnet"
    fi
else
    ELECTRS_NETWORK="liquidv1"
    PARENT_NETWORK="--parent-network mainnet"
    NGINX_PATH="liquid/"
    NGINX_NOSLASH_PATH="liquid"
    ISLIQUID="true"
fi

function preprocess(){
   in_file=$1
   out_file=$2
   cat $in_file | \
   sed -e "s|{DAEMON}|$DAEMON|g" \
       -e "s|{BTC_DAEMON_RPC_PORT}|$BTC_DAEMON_RPC_PORT|g" \
       -e "s|{NETWORK}|$NETWORK|g" \
       -e "s|{PARENT_NETWORK}|$PARENT_NETWORK|g" \
       -e "s|{ELECTRS_NETWORK}|$ELECTRS_NETWORK|g" \
       -e "s|{NGINX_PATH}|$NGINX_PATH|g" \
       -e "s|{NGINX_NOSLASH_PATH}|$NGINX_NOSLASH_PATH|g" \
       -e "s|{EXPLORERAUTOSTART}|$EXPLORERAUTOSTART|g" \
       -e "s|{TORAUTOSTART}|$TORAUTOSTART|g" \
       -e "s|{ISLIQUID}|$ISLIQUID|g" \
   >$out_file
}

preprocess /srv/explorer/supervisord.conf.in /etc/supervisor/conf.d/supervisord.conf
preprocess /srv/explorer/${DAEMON}-${NETWORK}-${MODE}.conf.in /data/.${DAEMON}.conf
if [ "${DAEMON}" == "liquid" ]; then
    preprocess /srv/explorer/bitcoin-mainnet-pruned-for-liquid.conf.in /data/.bitcoin.conf
fi

if [ -f /data/public_nodes ]; then
    cat /data/public_nodes >> /data/.${DAEMON}.conf
fi

TORRCFILE="/srv/explorer/${DAEMON}-${NETWORK}-${MODE}-torrc"
if [ -f $TORRCFILE ]; then
    cp $TORRCFILE /etc/tor/torrc
    if [ -f /data/torrc ]; then
        # pick for random peers from the list (for private-bridge)
        shuf -n 4 /data/torrc >> /etc/tor/torrc
        tail -4 /etc/tor/torrc | awk '{print "connect="$2":10100"}' >> /data/.${DAEMON}.conf
    fi
fi

preprocess /srv/explorer/nginx.conf.in /etc/nginx/sites-enabled/default
preprocess /srv/explorer/cli.sh.in /usr/bin/cli
if [ "${DAEMON}" == "liquid" ]; then
    DAEMON=bitcoin
    preprocess /srv/explorer/cli.sh.in /usr/bin/cli_bitcoin
    DAEMON=liquid
    chmod +x /usr/bin/cli_bitcoin
fi

chmod +x /usr/bin/cli

if [ ! -d /data/logs ]; then
    # initial sync: initialize directories
    mkdir /data/logs /data/${DAEMON} /data/bitcoin_for_liquid
fi


/usr/bin/supervisord
