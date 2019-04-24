#!/bin/bash

while :
do
        sleep 30
        cli savemempool || true
        chmod 744 /data/{NGINX_MEMPOOL}/mempool.dat || true
done
