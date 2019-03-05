FROM alpine:latest AS build-tor

ARG TOR_VER=0.3.4.9
ARG TORGZ=https://dist.torproject.org/tor-$TOR_VER.tar.gz

RUN apk --no-cache add --update \
  alpine-sdk gnupg libevent libevent-dev zlib zlib-dev openssl openssl-dev

RUN wget $TORGZ.asc && wget $TORGZ

# Verify tar signature
RUN gpg --keyserver pool.sks-keyservers.net --recv-keys 0x6AFEE6D49E92B601 \
  && gpg --verify tor-$TOR_VER.tar.gz.asc \
  # Install tor
  && tar xfz tor-$TOR_VER.tar.gz && cd tor-$TOR_VER \
  && ./configure && make install

FROM alpine@sha256:621c2f39f8133acb8e64023a94dbdf0d5ca81896102b9e57c0dc184cadaf5528

RUN apk --no-cache add --update \
  bash alpine-sdk gnupg libevent libevent-dev zlib zlib-dev openssl openssl-dev

COPY --from=build-tor /usr/local/ /usr/local/

RUN adduser -s /bin/bash -D -u 2000 tor

RUN mkdir -p /var/run/tor && chown -R tor:tor /var/run/tor && chmod 2700 /var/run/tor

RUN mkdir -p /home/tor/tor && chown -R tor:tor /home/tor/tor  && chmod 2700 /home/tor/tor

USER tor
