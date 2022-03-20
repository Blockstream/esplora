#!/bin/bash
set -eo pipefail

# Cleanup on exit
trap 'docker stop esplora-tests-explorer || true; [ -n "$datadir" ] && rm -rf "$datadir" || true' EXIT

# Build the Esplora docker image
(
    cd ..
    [ -n "$SKIP_BUILD_BASE" ]  || docker build -t blockstream/esplora-base:latest -f Dockerfile.deps .
    [ -n "$SKIP_BUILD_IMAGE" ] || docker build -t esplora .
)

# Run Esplora/Electrs in regtest mode
datadir=$(mktemp -d /tmp/esplora-tests.XXXXX)
docker run -v $datadir:/data --rm -t --name esplora-tests-explorer \
  -v $HOME/workspace/blockstream/esplora/run.sh:/srv/explorer/run.sh \
  -e EXPOSE_BITCOIND_RPC=1 \
  esplora bash -c "/srv/explorer/run.sh bitcoin-regtest explorer" \
  &
sleep 1

cont_ip=$(docker inspect esplora-tests-explorer | jq -r '.[0].NetworkSettings.IPAddress')
export BASE_URL=http://$cont_ip/regtest

# Wait for the HTTP REST API to become available
while ! curl $BASE_URL/api/blocks/tip/height; do
  sleep 0.5
done

# Load the default wallet (needed for the Cypress tests)
docker exec esplora-tests-explorer cli -rpcwait loadwallet default

# Grab the bitcoin cookie
bitcoind_cookie=$(docker exec esplora-tests-explorer cat /data/bitcoin/regtest/.cookie)
export BITCOIND_URL=http://$bitcoind_cookie@$cont_ip:18443/

# Build Cypress and run the tests
docker build -t esplora-tests-cypress .
docker run -it --rm \
  -v $PWD/cypress/videos:/tests/cypress/videos -v $PWD/cypress/screenshots:/tests/cypress/screenshots \
  -e BASE_URL -e BITCOIND_URL \
  esplora-tests-cypress

# TODO exit with an error code if the tests fail