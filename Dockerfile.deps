FROM debian:stretch@sha256:724b0fbbda7fda6372ffed586670573c59e07a48c86d606bab05db118abe0ef5

SHELL ["/bin/bash", "-c"]

RUN mkdir -p /srv/explorer \
 && apt-get -yqq update \
 && apt-get -yqq upgrade \
 && apt-get -yqq install clang cmake curl git tor

RUN git clone --quiet --depth 1 --single-branch --branch v0.33.11 https://github.com/creationix/nvm.git /root/.nvm \
 && rm -rf /root/.nvm/.git \
 && source /root/.nvm/nvm.sh \
 && nvm install v8.11.4

ENV SHA256SUM_BITCOINCORE=5146ac5310133fbb01439666131588006543ab5364435b748ddfc95a8cb8d63f
RUN curl -sL -o bitcoin.tar.gz https://bitcoincore.org/bin/bitcoin-core-0.18.0/bitcoin-0.18.0-x86_64-linux-gnu.tar.gz \
 && echo "${SHA256SUM_BITCOINCORE}  bitcoin.tar.gz" | sha256sum --check \
 && tar xzf bitcoin.tar.gz -C /srv/explorer \
 && ln -s /srv/explorer/bitcoin-0.18.0 /srv/explorer/bitcoin \
 && rm bitcoin.tar.gz

ENV SHA256SUM_LIQUID=de1c4f7306b0b3f467e743c886a9b469f506acbfb91e19c617dd6a54c7cc9c41
RUN curl -sL -o liquid.tar.gz https://github.com/ElementsProject/elements/releases/download/elements-0.17.0/liquid-0.17.0-x86_64-linux-gnu.tar.gz \
 && echo "${SHA256SUM_LIQUID}  liquid.tar.gz" | sha256sum --check \
 && tar xzf liquid.tar.gz -C /srv/explorer \
 && ln -s /srv/explorer/liquid-0.17.0 /srv/explorer/liquid \
 && rm liquid.tar.gz

RUN curl https://sh.rustup.rs -sSf | sh -s -- -y --default-toolchain 1.34.1 \
 && source /root/.cargo/env \
 && mkdir -p /srv/explorer/electrs{,_liquid} \
 && git clone --no-checkout https://github.com/blockstream/electrs.git \
 && cd electrs \
 && git checkout 963d51dbaa55d08ca84be3168ee56b701a1fa3f7 \
 && cp contrib/popular-scripts.txt /srv/explorer \
 && cargo install --root /srv/explorer/electrs_bitcoin --path . \
 && cargo install --root /srv/explorer/electrs_liquid --path . --features "liquid" \
 && cd .. \
 && rm -fr /root/.cargo electrs \
 && strip /srv/explorer/electrs_*/bin/electrs


# cleanup
RUN apt-get --auto-remove remove -yqq --purge clang cmake manpages curl git \
 && apt-get clean \
 && apt-get autoclean \
 && rm -rf /usr/share/doc* /usr/share/man /usr/share/postgresql/*/man /var/lib/apt/lists/* /var/cache/* /tmp/* /root/.cache /*.deb /root/.cargo
