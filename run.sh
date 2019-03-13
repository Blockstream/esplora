#!/bin/bash
set -eo pipefail

FLAVOR=$1
MODE=$2
DEBUG=$3

if [ -z "$FLAVOR" ] || [ ! -d /srv/explorer/static/$FLAVOR ]; then
    echo "Please provide bitcoin-testnet, bitcoin-mainnet or liquid-mainnet as a parameter"
    echo "For example run.sh bitcoin-mainnet explorer"
    exit 1
fi

echo "Enabled mode ${MODE}"

DAEMON=$(echo ${FLAVOR} | cut -d'-' -f1)
NETWORK=$(echo ${FLAVOR} | cut -d'-' -f2)
TEMPLATE=$(echo ${FLAVOR} | cut -d'-' -f3)
STATIC_DIR=/srv/explorer/static/$FLAVOR

ELECTRS_NETWORK=${NETWORK}


mkdir -p /etc/service/tor
cp /srv/explorer/source/contrib/runits/tor.runit /etc/service/tor/run

NGINX_NOSLASH_PATH="unused"
NGINX_REWRITE_NOJS='return 301 " /nojs$uri"'
if [ "${DAEMON}" != "liquid" ]; then
    if [ "${NETWORK}" == "testnet" ]; then
        NGINX_PATH="testnet/"
        NGINX_NOSLASH_PATH="testnet"
        NGINX_REWRITE='rewrite ^/testnet(/.*)$ $1 break;'
        NGINX_REWRITE_NOJS='rewrite ^/testnet(/.*)$ " /testnet/nojs$1?" permanent'
    fi
else
    ELECTRS_NETWORK="liquid"
    PARENT_NETWORK="--parent-network mainnet"
    NGINX_PATH="liquid/"
    NGINX_REWRITE='rewrite ^/liquid(/.*)$ $1 break;'
    NGINX_REWRITE_NOJS='rewrite ^/liquid(/.*)$ " /liquid/nojs$1?" permanent'
    NGINX_NOSLASH_PATH="liquid"
fi

NGINX_LOGGING="access_log off"

if [ "${DEBUG}" == "verbose" ]; then
    ELECTRS_DEBUG="-vvvv"
    NGINX_LOGGING="access_log /data/logs/nginx-access-debug-${FLAVOR}.log"
fi

function preprocess(){
   in_file=$1
   out_file=$2
   cat $in_file | \
   sed -e "s|{DAEMON}|$DAEMON|g" \
       -e "s|{NETWORK}|$NETWORK|g" \
       -e "s|{STATIC_DIR}|$STATIC_DIR|g" \
       -e "s|{PARENT_NETWORK}|$PARENT_NETWORK|g" \
       -e "s|{ELECTRS_NETWORK}|$ELECTRS_NETWORK|g" \
       -e "s|{ELECTRS_DEBUG}|$ELECTRS_DEBUG|g" \
       -e "s|{NGINX_LOGGING}|$NGINX_LOGGING|g" \
       -e "s|{NGINX_PATH}|$NGINX_PATH|g" \
       -e "s|{NGINX_REWRITE}|$NGINX_REWRITE|g" \
       -e "s|{NGINX_REWRITE_NOJS}|$NGINX_REWRITE_NOJS|g" \
       -e "s|{FLAVOR}|$DAEMON-$NETWORK $TEMPLATE|g" \
       -e "s|{NGINX_NOSLASH_PATH}|$NGINX_NOSLASH_PATH|g" \
   >$out_file
}

if [ "$MODE" == "explorer" ]; then
    mkdir -p /etc/service/prerenderer /etc/service/nginx /etc/service/electrs
    preprocess /srv/explorer/source/contrib/runits/electrs.runit /etc/service/electrs/run
    cp /srv/explorer/source/contrib/runits/nginx.runit /etc/service/nginx/run
    preprocess /srv/explorer/source/contrib/runits/prerenderer.runit /etc/service/prerenderer/run
    chmod +x /etc/service/prerenderer/run /etc/service/electrs/run
elif [ "$MODE" != "private-bridge" ] && [ "$MODE" != "public-bridge" ]; then
    echo "Mode can only be private-bridge, public-bridge or explorer"
    exit 1
fi

preprocess /srv/explorer/source/contrib/${DAEMON}-${NETWORK}-${MODE}.conf.in /data/.${DAEMON}.conf

if [ "${DAEMON}" == "liquid" ]; then
    mkdir -p /etc/service/bitcoin/control
    preprocess /srv/explorer/source/contrib/bitcoin-mainnet-pruned-for-liquid.conf.in /data/.bitcoin.conf
    cp /srv/explorer/source/contrib/runits/bitcoin_for_liquid.runit /etc/service/bitcoin/run
    cp /srv/explorer/source/contrib/runits/bitcoin_for_liquid_stop.runit /etc/service/bitcoin/control/X
fi

if [ -f /data/public_nodes ]; then
    cat /data/public_nodes >> /data/.${DAEMON}.conf
fi

if [ -f /data/private_nodes ]; then
    cat /data/private_nodes >> /data/.${DAEMON}.conf
fi

TORRCFILE="/srv/explorer/source/contrib/${DAEMON}-${NETWORK}-${MODE}-torrc"
if [ -f $TORRCFILE ]; then
    cp $TORRCFILE /etc/tor/torrc
    if [ -f /data/torrc ]; then
        # pick for random peers from the list (for private-bridge)
        shuf -n 4 /data/torrc >> /etc/tor/torrc
        tail -4 /etc/tor/torrc | awk '{print "connect="$2":10100"}' >> /data/.${DAEMON}.conf
    fi
else
    echo "ControlPort 9051" >> /etc/tor/torrc
fi

preprocess /srv/explorer/source/contrib/nginx.conf.in /etc/nginx/sites-enabled/default
preprocess /srv/explorer/source/cli.sh.in /usr/bin/cli
if [ "${DAEMON}" == "liquid" ]; then
    DAEMON=bitcoin
    preprocess /srv/explorer/source/cli.sh.in /usr/bin/cli_bitcoin
    DAEMON=liquid
    chmod +x /usr/bin/cli_bitcoin
fi

chmod +x /usr/bin/cli

if [ ! -d /data/logs ]; then
    # initial sync: initialize directories
    mkdir -p /data/logs /data/${DAEMON} /data/bitcoin
fi

mkdir -p /etc/service/${DAEMON}/control
preprocess /srv/explorer/source/contrib/runits/nodedaemon.runit /etc/service/${DAEMON}/run
preprocess /srv/explorer/source/contrib/runits/nodedaemon_stop.runit /etc/service/${DAEMON}/control/X
chmod +x /etc/service/${DAEMON}/run /etc/service/${DAEMON}/control/X

exec /srv/explorer/source/contrib/runit_boot.sh
