#!/bin/bash

network=$1
hosts=$2
server_version="electrs-esplora ${3:-0.4.1}"

if [[ $network != "mainnet" && $network != "testnet" ]]; then
  echo >&2 Invalid network
  exit 1
fi
if [ -z "$hosts" ]; then
  echo >&2 Missing hosts
  exit 1
fi

servers_file=servers-$network.txt

if [ ! -f $servers_file ]; then
  echo >&2 Missing servers file
  exit 1
fi

if [ $network == "mainnet" ]; then
  default_tcp_port=50001
  default_ssl_port=50002
  genesis_hash=000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f
else
  default_tcp_port=51001
  default_ssl_port=51002
  genesis_hash=000000000933ea01ad0ee984209779baaec3ced90fa3f408719526f8d77f4943
fi

features='{"hosts":'$hosts',"server_version":"'$server_version'","genesis_hash":"'$genesis_hash'","protocol_min":"1.4","protocol_max":"1.4","hash_function":"sha256","pruning":null}'

send_rpc() {
  host=$1; port=$2; transport=$3; method=$4; params=$5
  payload='{"jsonrpc":"2.0","id":1,"method":"'$method'","params":['$params']}'
  echo sending $method $params to $host:$port:$transport >&2

  torify=$([[ $host == *".onion" ]] && echo torsocks || echo '')

  if [ $transport == "t" ]; then
    echo "$payload" | $torify nc -q2 $host $port
  else
    echo "$payload" | $torify socat -T2 -t2 openssl:$host:$port,verify=0 stdio
  fi
}

cat $servers_file | sort | uniq | sponge $servers_file

servers=`shuf $servers_file`
for server in $servers; do
  echo Fetching servers from $server
  IFS=',' read host port transport <<< $server
  peers=`send_rpc $host $port $transport server.peers.subscribe`
  echo "$peers" | jq -c '.result[]' | while read peer; do
    peer_ip=`jq -r .[0] <<< $peer`
    peer_opt=`jq -r .[2] <<< $peer`
    peer_ssl=`jq -r '.[] | select(startswith("s")) | (if length > 1 then .[1:] else '$default_ssl_port' end + ",s")' <<< $peer_opt`
    peer_tcp=`jq -r '.[] | select(startswith("t")) | (if length > 1 then .[1:] else '$default_tcp_port' end + ",t")' <<< $peer_opt`
    echo $peer_ip,${peer_ssl:-${peer_tcp:-$default_tcp_port,t}} | sed -r 's/[^\d.:,ts]//g' | tee -a $servers_file
  done
done

cat $servers_file | sort | uniq | sponge $servers_file

shuf $servers_file | while read server; do
  echo Announcing to $server
  IFS=':' read host port transport <<< $server
  send_rpc $host $port $transport server.add_peer "$features"
done
