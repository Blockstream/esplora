# How to build the Docker image

```
docker build -t esplora .
```

# How to run the explorer for Bitcoin mainnet

```
docker run --port 8080:80 \
           --volume $PWD/data_bitcoin_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-mainnet explorer"
```

# How to run the explorer for Liquid mainnet

```
docker run --port 8082:80 \
           --volume $PWD/data_liquid_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh liquid-mainnet explorer"
```

# How to run the explorer for Bitcoin testnet3

```
docker run --port 8084:80 \
           --volume $PWD/data_bitcoin_testnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-testnet explorer"
```


# Build new esplora-base

```
docker build -t blockstream/esplora-base:latest -f Dockerfile.deps .
docker push blockstream/esplora-base:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/esplora-base
```

# Build new gcloud-docker

```
docker build --squash -t blockstream/gcloud-docker:latest -f Dockerfile.docker .
docker push blockstream/gcloud-docker:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/gcloud-docker
```

# Build new gcloud-terraform

```
docker build --squash -t blockstream/gcloud-terraform:latest -f Dockerfile.terraform .
docker push blockstream/gcloud-terraform:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/gcloud-terraform
```
