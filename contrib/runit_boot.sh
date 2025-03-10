#!/bin/bash

shutdown() {
  echo "shutting down the container"

  # first shut down socat (avoid "Iterrupted by signal 15" error)
  sv -w "$SVWAIT" force-stop socat

  # next shut down electrs (avoid long wait + losing blocks in bitcoind)
  sv -w "$SVWAIT" force-stop electrs

  # next shut down bitcoin (longer timeout to allow for a clean shutdown)
  sv -w "$BCWAIT" force-stop bitcoin

  # then shutdown any other service started by runit
  for _srv in $(ls -1 /etc/service); do
    sv -w "$SVWAIT" force-stop "$_srv"
  done

  # shutdown runsvdir command
  kill -HUP "$RUNSVDIR"
  wait "$RUNSVDIR"

  # give processes time to stop
  sleep 0.5

  # kill any other processes still running in the container
  for _pid  in $(ps -eo pid | grep -v PID  | tr -d ' ' | grep -v '^1$' | head -n -6); do
    timeout 5 /bin/sh -c "kill $_pid && wait $_pid || kill -9 $_pid"
  done
  exit
}

# store environment variables
export > /etc/envvars

PATH=/usr/local/bin:/usr/local/sbin:/bin:/sbin:/usr/bin:/usr/sbin:/usr/X11R6/bin
SVWAIT=60  # wait process to end up to SVWAIT seconds before sending kill signal
BCWAIT=300 # custom timeout for bitcoind before sending kill signal

# run all scripts in the run_once folder
/bin/run-parts /etc/run_once

exec env - PATH=$PATH runsvdir -P /etc/service &

RUNSVDIR=$!
echo "Started runsvdir, PID is $RUNSVDIR"
echo "wait for processes to start...."

sleep 5
for _srv in $(ls -1 /etc/service); do
    sv status "$_srv"
done

# catch shutdown signals
trap shutdown SIGTERM SIGHUP SIGQUIT SIGINT
wait $RUNSVDIR

shutdown
