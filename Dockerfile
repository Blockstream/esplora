FROM blockstream/esplora-base:latest AS build

FROM debian:buster@sha256:e2cc6fb403be437ef8af68bdc3a89fd58e80b4e390c58f14c77c466002391193

COPY --from=build /srv/explorer /srv/explorer
COPY --from=build /srv/wally_wasm /srv/wally_wasm
COPY --from=build /root/.nvm /root/.nvm

RUN apt-get -yqq update \
 && apt-get -yqq upgrade \
 && apt-get -yqq install nginx libnginx-mod-http-lua tor git curl runit procps socat gpg

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
 && DEST=/srv/explorer/static/bitcoin-regtest \
    npm run dist -- bitcoin-regtest \
 && DEST=/srv/explorer/static/liquid-mainnet \
    npm run dist -- liquid-mainnet \
 && DEST=/srv/explorer/static/liquid-regtest \
    npm run dist -- liquid-regtest \
 && DEST=/srv/explorer/static/bitcoin-mainnet-blockstream \
    npm run dist -- bitcoin-mainnet blockstream \
 && DEST=/srv/explorer/static/bitcoin-testnet-blockstream \
    npm run dist -- bitcoin-testnet blockstream \
 && DEST=/srv/explorer/static/bitcoin-regtest-blockstream \
    npm run dist -- bitcoin-regtest blockstream \
 && DEST=/srv/explorer/static/liquid-mainnet-blockstream \
    npm run dist -- liquid-mainnet blockstream \
 && DEST=/srv/explorer/static/liquid-regtest-blockstream \
    npm run dist -- liquid-regtest blockstream

# symlink the libwally wasm files into liquid's www directories (for client-side unblinding)
RUN for dir in /srv/explorer/static/liquid*; do ln -s /srv/wally_wasm $dir/libwally; done

# configuration
RUN cp /srv/explorer/source/run.sh /srv/explorer/

# cleanup
RUN apt-get --auto-remove remove -yqq --purge manpages \
 && apt-get clean \
 && apt-get autoclean \
 && rm -rf /usr/share/doc* /usr/share/man /usr/share/postgresql/*/man /var/lib/apt/lists/* /var/cache/* /tmp/* /root/.cache /*.deb /root/.cargo

WORKDIR /srv/explorer
