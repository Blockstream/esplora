FROM blockstream/esplora-base:latest AS build

FROM debian:stretch@sha256:802706fa62e75c96fff96ada0e8ca11f570895ae2e9ba4a9d409981750ca544c

COPY --from=build /srv/explorer /srv/explorer
COPY --from=build /root/.nvm /root/.nvm

RUN sed -i 's/deb.debian.org/httpredir.debian.org/g' /etc/apt/sources.list \
 && apt-get -yqq update \
 && apt-get -yqq upgrade \
 && apt-get -yqq install nginx supervisor tor git curl

RUN mkdir /tmp/explorer \
 && mkdir -p /srv/explorer/static

COPY ./ /tmp/explorer

ARG FOOT_HTML

WORKDIR /tmp/explorer

SHELL ["/bin/bash", "-c"]

# required to run some scripts as root (needed for docker)
RUN source /root/.nvm/nvm.sh \
 && npm config set unsafe-perm true \
 && npm run dist:bitcoin-testnet \
 && npm run dist:bitcoin-mainnet \
 && npm run dist:liquid-mainnet \
 && mv dist/* /srv/explorer/static

# configuration
RUN cp /tmp/explorer/contrib/*.conf.in /tmp/explorer/contrib/*torrc /tmp/explorer/run.sh /tmp/explorer/cli.sh.in /srv/explorer/

# cleanup
RUN apt-get --auto-remove remove -yqq --purge manpages git curl \
 && apt-get clean \
 && apt-get autoclean \
 && rm -rf /usr/share/doc* /usr/share/man /usr/share/postgresql/*/man /var/lib/apt/lists/* /var/cache/* /tmp/* /root/.cache /*.deb /root/.nvm /root/.cargo

WORKDIR /srv/explorer
