FROM blockstream/esplora-base:latest AS build

FROM debian:stretch@sha256:58a80e0b6aa4d960ee2a5452b0230c406c47ed30a66555ba753c8e1710a434f5

COPY --from=build /srv/explorer /srv/explorer
COPY --from=build /root/.nvm /root/.nvm

RUN apt-get -yqq update \
 && apt-get -yqq upgrade \
 && apt-get -yqq install nginx supervisor tor git curl pkg-config libcairo2-dev libjpeg-dev libgif-dev build-essential libpixman-1-dev

RUN mkdir -p /srv/explorer/static

COPY ./ /srv/explorer/source

ARG FOOT_HTML

WORKDIR /srv/explorer/source

SHELL ["/bin/bash", "-c"]

# required to run some scripts as root (needed for docker)
RUN source /root/.nvm/nvm.sh \
 && npm config set unsafe-perm true \
 && npm install && (cd prerender-server && npm run dist) \
 && DEST=/srv/explorer/static/bitcoin-mainnet \
    npm run dist -- bitcoin-mainnet \
 && DEST=/srv/explorer/static/bitcoin-testnet \
    npm run dist -- bitcoin-testnet \
 && DEST=/srv/explorer/static/liquid-mainnet \
    npm run dist -- liquid-mainnet \
 && DEST=/srv/explorer/static/bitcoin-mainnet-blockstream \
    npm run dist -- bitcoin-mainnet blockstream \
 && DEST=/srv/explorer/static/bitcoin-testnet-blockstream \
    npm run dist -- bitcoin-testnet blockstream \
 && DEST=/srv/explorer/static/liquid-mainnet-blockstream \
    npm run dist -- liquid-mainnet blockstream

# configuration
RUN cp /srv/explorer/source/contrib/*.conf.in /srv/explorer/source/contrib/*torrc /srv/explorer/source/run.sh /srv/explorer/source/cli.sh.in /srv/explorer/

# cleanup
RUN apt-get --auto-remove remove -yqq --purge manpages git curl \
 && apt-get clean \
 && apt-get autoclean \
 && rm -rf /usr/share/doc* /usr/share/man /usr/share/postgresql/*/man /var/lib/apt/lists/* /var/cache/* /tmp/* /root/.cache /*.deb /root/.cargo

WORKDIR /srv/explorer
