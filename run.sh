#!/bin/bash
set -eo pipefail

FLAVOR=$1
MODE=$2
: ${DEBUG:=$3} # can be set either via DEBUG or using the argument

SYNC_SECRET=$4
SYNC_SOURCE=$5
NGINX_GCLB_IP=${NGINX_GCLB_IP:-34.36.36.12} # bs.info

if [ -z "$FLAVOR" ] || [ ! -d /srv/explorer/static/$FLAVOR ]; then
    echo "Please provide bitcoin-mainnet, bitcoin-testnet, bitcoin-signet, bitcoin-regtest, liquid-mainnet, liquid-testnet or liquid-regtest as a parameter"
    echo "For example run.sh bitcoin-mainnet explorer"
    exit 1
fi

echo "Enabled mode ${MODE}"

DAEMON=$(echo ${FLAVOR} | cut -d'-' -f1)
NETWORK=$(echo ${FLAVOR} | cut -d'-' -f2)
TEMPLATE=$(echo ${FLAVOR} | cut -d'-' -f3)
STATIC_DIR=/srv/explorer/static/$FLAVOR

ELECTRS_NETWORK=${NETWORK}

DAEMON_DIR="/data/$DAEMON"
if [ "$DAEMON-$NETWORK" == "bitcoin-testnet" ]; then
  DAEMON_DIR="$DAEMON_DIR/testnet3"
elif [ "$DAEMON-$NETWORK" == "bitcoin-signet" ]; then
  DAEMON_DIR="$DAEMON_DIR/signet"
elif [ "$DAEMON-$NETWORK" == "liquid-mainnet" ]; then
  DAEMON_DIR="$DAEMON_DIR/liquidv1"
elif [ "$DAEMON-$NETWORK" == "liquid-testnet" ]; then
  DAEMON_DIR="$DAEMON_DIR/liquidtestnet"
elif [ "$DAEMON-$NETWORK" == "bitcoin-regtest" ]; then
  DAEMON_DIR="$DAEMON_DIR/regtest"
elif [ "$DAEMON-$NETWORK" == "liquid-regtest" ]; then
  DAEMON_DIR="$DAEMON_DIR/liquidregtest"
fi


mkdir -p /etc/service/tor/log
mkdir -p /data/logs/tor
cp /srv/explorer/source/contrib/runits/tor.runit /etc/service/tor/run
cp /srv/explorer/source/contrib/runits/tor-log.runit /etc/service/tor/log/run
cp /srv/explorer/source/contrib/runits/tor-log-config.runit /data/logs/tor/config

mkdir -p /etc/service/socat
cp /srv/explorer/source/contrib/runits/socat.runit /etc/service/socat/run

NGINX_NOSLASH_PATH="unused"
NGINX_REWRITE_NOJS='return 301 " /nojs$uri"'
NGINX_CSP="default-src 'self'; script-src 'self' 'unsafe-eval'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; font-src 'self' data:; object-src 'none'"

if [ "${DAEMON}" != "liquid" ]; then
    if [ "$NETWORK" == "testnet" ] || [ "$NETWORK" == "signet" ] || [ "$NETWORK" == "regtest" ]; then
        NGINX_PATH="$NETWORK/"
        NGINX_NOSLASH_PATH="$NETWORK"
        NGINX_REWRITE='rewrite ^/'$NETWORK'(/.*)$ $1 break;'
        NGINX_REWRITE_NOJS='rewrite ^/'$NETWORK'(/.*)$ " /'$NETWORK'/nojs$1?" permanent'
    fi
else
    if [ "${NETWORK}" == "regtest" ]; then
        ELECTRS_NETWORK="liquidregtest"
        PARENT_NETWORK="--parent-network regtest"
        NGINX_PATH="liquidregtest/"
        NGINX_REWRITE='rewrite ^/liquidregtest(/.*)$ $1 break;'
        NGINX_REWRITE_NOJS='rewrite ^/liquidregtest(/.*)$ " /liquidregtest/nojs$1?" permanent'
        NGINX_NOSLASH_PATH="liquidregtest"

	# The --jsonrpc-import works around electrs not yet being aware of the magic number change for liquid regtest in elements 21.
        ELECTRS_ARGS="$ELECTRS_ARGS --jsonrpc-import"
    elif [ "${NETWORK}" == "testnet" ]; then
        ELECTRS_NETWORK="liquidtestnet"
        PARENT_NETWORK="--parent-network regtest"
        NGINX_PATH="liquidtestnet/"
        NGINX_REWRITE='rewrite ^/liquidtestnet(/.*)$ $1 break;'
        NGINX_REWRITE_NOJS='rewrite ^/liquidtestnet(/.*)$ " /liquidtestnet/nojs$1?" permanent'
        NGINX_NOSLASH_PATH="liquidtestnet"

        # The --jsonrpc-import works around electrs not yet being aware of the magic number change for liquid testnet
        ELECTRS_ARGS="$ELECTRS_ARGS --jsonrpc-import --asset-db-path /srv/liquid-assets-db"
        ASSETS_GIT=${ASSETS_GIT:-https://github.com/Blockstream/asset_registry_testnet_db}
        ASSETS_GPG=${ASSETS_GPG:-/srv/explorer/source/contrib/asset_registry_testnet_pubkey.asc}
    else
        ELECTRS_NETWORK="liquid"
        PARENT_NETWORK="--parent-network bitcoin"
        NGINX_PATH="liquid/"
        NGINX_REWRITE='rewrite ^/liquid(/.*)$ $1 break;'
        NGINX_REWRITE_NOJS='rewrite ^/liquid(/.*)$ " /liquid/nojs$1?" permanent'
        NGINX_NOSLASH_PATH="liquid"

        ELECTRS_ARGS="$ELECTRS_ARGS --asset-db-path /srv/liquid-assets-db"
        ASSETS_GIT=${ASSETS_GIT:-https://github.com/Blockstream/asset_registry_db}
        ASSETS_GPG=${ASSETS_GPG:-/srv/explorer/source/contrib/asset_registry_pubkey.asc}
    fi
fi

NGINX_LOGGING="access_log off"

ELECTRS_ARGS="$ELECTRS_ARGS --http-socket-file /var/electrs-rest.sock"

if [ "${DEBUG}" == "verbose" ]; then
    ELECTRS_ARGS="$ELECTRS_ARGS -vvvv"
    ELECTRS_BACKTRACE="export RUST_BACKTRACE=full"
    NGINX_LOGGING="access_log /data/logs/nginx-access-debug-${FLAVOR}.log"
else
  ELECTRS_ARGS="$ELECTRS_ARGS -vv"
fi

if [[ "$DAEMON-$NETWORK" = "bitcoin-mainnet" && -z "$NO_PRECACHE" ]]; then
    ELECTRS_ARGS="$ELECTRS_ARGS --precache-scripts /srv/explorer/popular-scripts.txt"
fi

if [ -z "$NO_ADDRESS_SEARCH" ]; then
    ELECTRS_ARGS="$ELECTRS_ARGS --address-search"
fi

if [ -n "$ENABLE_LIGHTMODE" ]; then
    ELECTRS_ARGS="$ELECTRS_ARGS --lightmode"
fi

if [ "$TEMPLATE" == "blockstream" ]; then
  d=/srv/explorer/source/flavors/blockstream
  ONION_URL=$(source $d/config.env && echo $ONION_V3)
  # the backtick subshell below is injected into electrs.runit as a literal string,
  # which is evaluated later when the runit service is run.
  ELECTRS_ARGS=$ELECTRS_ARGS' --electrum-public-hosts "`cat '$d'/electrum-hosts-'$DAEMON'-'$NETWORK'.json || echo {}`" --electrum-banner "`cat '$d'/electrum-banner.txt`"'
fi

function preprocess(){
   in_file=$1
   out_file=$2
   cat $in_file | \
   sed -e "s|{DAEMON}|$DAEMON|g" \
       -e "s|{DAEMON_DIR}|$DAEMON_DIR|g" \
       -e "s|{NETWORK}|$NETWORK|g" \
       -e "s|{STATIC_DIR}|$STATIC_DIR|g" \
       -e "s|{PARENT_NETWORK}|$PARENT_NETWORK|g" \
       -e "s|{ELECTRS_NETWORK}|$ELECTRS_NETWORK|g" \
       -e "s#{ELECTRS_ARGS}#$ELECTRS_ARGS#g" \
       -e "s|{ELECTRS_BACKTRACE}|$ELECTRS_BACKTRACE|g" \
       -e "s|{NGINX_LOGGING}|$NGINX_LOGGING|g" \
       -e "s|{NGINX_PATH}|$NGINX_PATH|g" \
       -e "s|{NGINX_CSP}|$NGINX_CSP|g" \
       -e "s|{NGINX_REWRITE}|$NGINX_REWRITE|g" \
       -e "s|{NGINX_REWRITE_NOJS}|$NGINX_REWRITE_NOJS|g" \
       -e "s|{FLAVOR}|$DAEMON-$NETWORK $TEMPLATE|g" \
       -e "s|{NGINX_NOSLASH_PATH}|$NGINX_NOSLASH_PATH|g" \
       -e "s|{ASSETS_GIT}|$ASSETS_GIT|g" \
       -e "s|{ASSETS_GPG}|$ASSETS_GPG|g" \
   >$out_file
}

if [ "$MODE" == "explorer" ]; then
    mkdir -p /etc/service/{prerenderer,nginx,electrs,websocket}/log
    mkdir -p /data/logs/{prerenderer,nginx,electrs,websocket}

    preprocess /srv/explorer/source/contrib/runits/electrs.runit /etc/service/electrs/run
    cp /srv/explorer/source/contrib/runits/electrs-log.runit /etc/service/electrs/log/run
    cp /srv/explorer/source/contrib/runits/electrs-log-config.runit /data/logs/electrs/config

    cp /srv/explorer/source/contrib/runits/nginx.runit /etc/service/nginx/run
    cp /srv/explorer/source/contrib/runits/nginx-log.runit /etc/service/nginx/log/run
    cp /srv/explorer/source/contrib/runits/nginx-log-config.runit /data/logs/nginx/config

    preprocess /srv/explorer/source/contrib/runits/prerenderer.runit /etc/service/prerenderer/run
    cp /srv/explorer/source/contrib/runits/prerenderer-log.runit /etc/service/prerenderer/log/run
    cp /srv/explorer/source/contrib/runits/prerenderer-log-config.runit /data/logs/prerenderer/config
    chmod +x /etc/service/prerenderer/run /etc/service/electrs/run

    cp /srv/explorer/source/contrib/runits/websocket.runit /etc/service/websocket/run
    cp /srv/explorer/source/contrib/runits/websocket-log.runit /etc/service/websocket/log/run
    cp /srv/explorer/source/contrib/runits/websocket-log-config.runit /data/logs/websocket/config
elif [ "$MODE" != "private-bridge" ] && [ "$MODE" != "public-bridge" ]; then
    echo "Mode can only be private-bridge, public-bridge or explorer"
    exit 1
fi

preprocess /srv/explorer/source/contrib/${DAEMON}-${NETWORK}-${MODE}.conf.in /data/.${DAEMON}.conf

if [ "$DAEMON" == "liquid" ]; then
    if [ "$NETWORK" == "mainnet" ]; then
        mkdir -p /etc/service/bitcoin/log /data/logs/bitcoin
        preprocess /srv/explorer/source/contrib/bitcoin-mainnet-pruned-for-liquid.conf.in /data/.bitcoin.conf
        cp /srv/explorer/source/contrib/runits/bitcoin_for_liquid.runit /etc/service/bitcoin/run
        cp /srv/explorer/source/contrib/runits/bitcoin_for_liquid-log.runit /etc/service/bitcoin/log/run
        cp /srv/explorer/source/contrib/runits/bitcoin_for_liquid-log-config.runit /data/logs/bitcoin/config
    fi

    if [ "$NETWORK" == "mainnet" ] || [ "$NETWORK" == "testnet" ]; then
        mkdir -p /etc/service/liquid-assets-poller/log /data/logs/poller
        preprocess /srv/explorer/source/contrib/runits/liquid-assets-poller.runit /etc/service/liquid-assets-poller/run
        cp /srv/explorer/source/contrib/runits/liquid-assets-poller-log.runit /etc/service/liquid-assets-poller/log/run
        cp /srv/explorer/source/contrib/runits/liquid-assets-poller-log-config.runit /data/logs/poller/config
        chmod +x /etc/service/liquid-assets-poller/run
    fi
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

    TOR_DIR=${TOR_DIR:-/dev/shm/tor}
    # pick random peers from a file (for private-bridge using torv3)
    cp ${TOR_DIR}/torv3rc /etc/tor/torrc
    shuf -n 4 ${TOR_DIR}/torv3_connect > /etc/tor/torv3_connect
    tail -4 /etc/tor/torv3_connect | awk -F: '{print "connect="$1".onion:10100"}' >> /data/.${DAEMON}.conf
else
    echo "ControlPort 9051" >> /etc/tor/torrc
fi

preprocess /srv/explorer/source/contrib/nginx.conf.in /etc/nginx/sites-enabled/default
sed -i 's/user www-data;/user root;/' /etc/nginx/nginx.conf

# Set real IP of service
if [ -n "NGINX_GCLB_IP" ]; then
  sed -i "/set_real_ip_from 35.191.0.0\/16;/a set_real_ip_from ${NGINX_GCLB_IP}\/32; # GCLB public IP" /etc/nginx/sites-enabled/default
fi

# Make mempool contents available over nginx, protected with SYNC_SECRET
if [ -n "$SYNC_SECRET" ]; then
    echo "sync:{PLAIN}$SYNC_SECRET" > /srv/explorer/htpasswd
    preprocess /srv/explorer/source/contrib/nginx-sync.conf.in /tmp/nginx-sync.conf
    # insert nginx-sync.conf inside the server {} block
    sed -i '/^server {/r /tmp/nginx-sync.conf' /etc/nginx/sites-enabled/default
    rm /tmp/nginx-sync.conf
fi

preprocess /srv/explorer/source/cli.sh.in /usr/bin/cli
if [ "${DAEMON}" == "liquid" ]; then
    DAEMON=bitcoin
    preprocess /srv/explorer/source/cli.sh.in /usr/bin/cli_bitcoin
    DAEMON=liquid
    chmod +x /usr/bin/cli_bitcoin

    # insert nginx-liquid-assets.conf into the server {  } block
    preprocess /srv/explorer/source/contrib/nginx-liquid-assets.conf.in /tmp/nginx-liquid-assets.conf
    sed -i '/^server {/r /tmp/nginx-liquid-assets.conf' /etc/nginx/sites-enabled/default
    rm /tmp/nginx-liquid-assets.conf
fi

if [ -n "$ONION_URL" ]; then
    # insert the Onion-Location `map` BEFORE the server { } block
    sed -i '/^server {/ i map $sent_http_content_type $onion_header { "~^text/html($|;)" '$ONION_URL'$request_uri; }' /etc/nginx/sites-enabled/default
    # insert the Onion-Location `add_header` directive INSIDE the server {} block
    sed -i '/^server {/ a add_header Onion-Location $onion_header always;' /etc/nginx/sites-enabled/default
fi

chmod +x /usr/bin/cli

# initialize directories
mkdir -p /data/logs /data/${DAEMON} /data/bitcoin

mkdir -p /etc/service/${DAEMON}/log
mkdir -p /data/logs/nodedaemon
preprocess /srv/explorer/source/contrib/runits/nodedaemon.runit /etc/service/${DAEMON}/run
cp /srv/explorer/source/contrib/runits/nodedaemon-log.runit /etc/service/${DAEMON}/log/run
cp /srv/explorer/source/contrib/runits/nodedaemon-log-config.runit /data/logs/nodedaemon/config
chmod +x /etc/service/${DAEMON}/run

if [ "${NETWORK}" == "regtest" ] && [ -z "${NO_REGTEST_MINING}" ]; then
    if [ "${DAEMON}" != "liquid" ]; then
        /srv/explorer/bitcoin/bin/bitcoind -conf=/data/.bitcoin.conf -datadir=/data/bitcoin -daemon -regtest
    else
        /srv/explorer/$DAEMON/bin/${DAEMON}d -conf=/data/.$DAEMON.conf -datadir=/data/$DAEMON -daemon
    fi
    echo "Creating default wallet"
    cli -rpcwait loadwallet default || cli createwallet default
    address=$(cli -rpcwait getnewaddress)
    cli generatetoaddress 100 ${address}
    cli stop
fi

# Sync mempool and feeestimation contents from SYNC_SOURCE
if [ -n "$SYNC_SOURCE" ]; then
  # wait for bitcoind to fully sync up,
  if [ "${DAEMON}-${NETWORK}" == "liquid-mainnet" ]; then
    /srv/explorer/bitcoin/bin/bitcoind -conf=/data/.bitcoin.conf -datadir=/data/bitcoin -daemon
    /srv/explorer/source/contrib/bitcoind-wait-sync.sh cli_bitcoin
  fi
  /srv/explorer/$DAEMON/bin/${DAEMON}d -conf=/data/.$DAEMON.conf -datadir=/data/$DAEMON -daemon
  /srv/explorer/source/contrib/bitcoind-wait-sync.sh cli
  # stop it,
  cli stop
  if [ "${DAEMON}-${NETWORK}" == "liquid-mainnet" ]; then
    cli_bitcoin stop
  fi
  sleep 2 # without this, the download below would occasionally start while the terminating bitcoind is still flushing its mempool.dat
  # then fetch a recent mempool.dat,
  curl -v -u sync:$SYNC_SECRET -o $DAEMON_DIR/mempool.dat $SYNC_SOURCE/mempool || true
  curl -v -u sync:$SYNC_SECRET -o $DAEMON_DIR/fee_estimates.dat $SYNC_SOURCE/fee_estimates || true
  ls -l $DAEMON_DIR/{mempool,fee_estimates}.dat || true
  # and let the runit services take over
fi

exec /srv/explorer/source/contrib/runit_boot.sh
