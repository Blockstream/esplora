# Esplora Block Explorer

[![build status](https://api.travis-ci.org/Blockstream/esplora.svg)](https://travis-ci.org/Blockstream/esplora)
[![docker release](https://img.shields.io/docker/pulls/blockstream/esplora.svg)](https://hub.docker.com/r/blockstream/esplora)
[![MIT license](https://img.shields.io/github/license/blockstream/esplora.svg)](https://github.com/blockstream/esplora/blob/master/LICENSE)
[![Pull Requests Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![IRC](https://img.shields.io/badge/chat-on%20freenode-brightgreen.svg)](https://webchat.freenode.net/?channels=bitcoin-explorers)

Block explorer web interface based on the [esplora-electrs](https://github.com/Blockstream/electrs) HTTP API.

Written as a single-page app in a reactive and functional style using
[rxjs](https://github.com/ReactiveX/rxjs) and [cycle.js](https://cycle.js.org/).

See live at [Blockstream.info](https://blockstream.info/).

API documentation [is available here](API.md).

Join the translation efforts on [Transifex](https://transifex.com/blockstream/esplora/).

![Esplora](https://raw.githubusercontent.com/Blockstream/esplora/master/flavors/blockstream/www/img/social-sharing.png)

## Features

- Explore blocks, transactions and addresses

- Support for Segwit and Bech32 addresses

- Shows previous output and spending transaction details

- Quick-search for txid, address, block hash or height by navigating to `/<query>`

- Advanced view with script hex/assembly, witness data, outpoints and more

- Mobile-ready responsive design

- Translated to 17 languages

- Light and dark themes

- Noscript support

- For Liquid and other Elements-based chains: support for CT, peg-in/out transactions and multi-asset

- Mainnet, Testnet and Elements high performance electrum server

## Developing

To start a development server with live babel/browserify transpilation, run:

```bash
$ git clone https://github.com/Blockstream/esplora && cd esplora
$ npm install
$ export API_URL=http://localhost:3000/ # or https://blockstream.info/api/ if you don't have a local API server
# (see more config options below)
$ npm run dev-server
```

The server will be available at http://localhost:5000/

To display debugging information for the Rx streams in the web developer console, set `localStorage.debug = '*'` and refresh.

## Building

To build the static assets directory for production deployment, set config options (see below)
and run `$ npm run dist`. The files will be created under `dist/`.

Because Esplora is a single-page app, the HTTP server needs to be configured to serve the `index.html` file in reply to missing pages.
See [`contrib/nginx.conf.in`](contrib/nginx.conf.in) for example nginx configuration (TL;DR: `try_files $uri /index.html`).

## Pre-rendering server (noscript)

To start a pre-rendering server that generates static HTML replies suitable for noscript users, run:

```bash
# (clone, cd, "npm install" and configure as above)

$ export STATIC_ROOT=http://localhost:5000/ # for loading CSS, images and fonts
$ npm run prerender-server
```

The server will be available at http://localhost:5001/

## Configuration options

All options are optional.

### GUI options

- `NODE_ENV` - set to `production` to enable js minification, or to `development` to disable (defaults to `production`)
- `BASE_HREF` - base href for user interface (defaults to `/`, change if not served from the root directory)
- `STATIC_ROOT` - root for static assets (defaults to `BASE_HREF`, change to load static assets from a different server)
- `API_URL` - URL for HTTP REST API (defaults to `/api`, change if the API is available elsewhere)
- `CANONICAL_URL` - absolute base url for user interface (optional, only required for opensearch and canonical link tags)
- `NATIVE_ASSET_LABEL` - the name of the network native asset (defaults to `BTC`)
- `SITE_TITLE` - website title for `<title>` (defaults to `Block Explorer`)
- `SITE_DESC` - meta description (defaults to `Esplora Block Explorer`)
- `HOME_TITLE` - text for homepage title (defaults to `SITE_TITLE`)
- `SITE_FOOTER` - text for page footer (defaults to `Powered by esplora`)
- `HEAD_HTML` - custom html to inject at the end of `<head>`
- `FOOT_HTML` - custom html to inject at the end of `<body>`
- `CUSTOM_ASSETS` - space separated list of static assets to add to the build
- `CUSTOM_CSS` - space separated list of css files to append into `style.css`
- `NOSCRIPT_REDIR` - redirect noscript users to `{request_path}?nojs` (should be captured server-side and redirected to the prerender server, also see `NOSCRIPT_REDIR_BASE` in dev server options)

Note that `API_URL` should be set to the publicly-reachable URL where the user's browser can issue requests at.
(that is, *not* via `localhost`, unless you're setting up a dev environment where the browser is running on the same machine as the API server.)

Elements-only configuration:

- `IS_ELEMENTS` - set to `1` to indicate this is an Elements-based chain (enables asset issuance and peg features)
- `NATIVE_ASSET_ID` - the ID of the native asset used to pay fees (defaults to `6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d`, the asset id for BTC)
- `BLIND_PREFIX` - the base58 address prefix byte used for confidential addresses (defaults to `12`)
- `PARENT_CHAIN_EXPLORER_TXOUT` - URL format for linking to transaction outputs on the parent chain, with `{txid}` and `{vout}` as placeholders. Example: `https://blockstream.info/tx/{txid}#output:{vout}`
- `PARENT_CHAIN_EXPLORER_ADDRESS` - URL format for linking to addresses on parent chain, with `{addr}` replaced by the address. Example: `https://blockstream.info/address/{addr}`
- `ASSET_MAP_URL` - url to load json asset map (in the "minimal" format)

Menu configuration (useful for inter-linking multiple instances on different networks):

- `MENU_ITEMS` - json map of menu items, where the key is the label and the value is the url
- `MENU_ACTIVE` - the active menu item identified by its label

### Development server options

All GUI options, plus:

- `PORT` - port to bind http development server (defaults to `5000`)
- `CORS_ALLOW` - value to set for `Access-Control-Allow-Origin` header (optional)
- `NOSCRIPT_REDIR_BASE` - base url for prerender server, for redirecting `?nojs` requests (should be set alongside `NOSCRIPT_REDIR`)

### Pre-rendering server options

All GUI options, plus:

- `PORT` - port to bind pre-rendering server (defaults to `5001`)

Note that unlike the regular JavaScript-based app that sends API requests from the client-side,
the pre-rendering server sends API requests from the server-side. This means that `API_URL` should
be configured to the URL reachable by the server, typically `http://localhost:3000/`.

## How to build the Docker image

```
docker build -t esplora .
```

## How to run the explorer for Bitcoin mainnet

```
docker run -p 50001:50001 -p 8080:80 \
           --volume $PWD/data_bitcoin_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-mainnet explorer"
```

## How to run the explorer for Liquid mainnet

```
docker run -p 50001:50001 -p 8082:80 \
           --volume $PWD/data_liquid_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh liquid-mainnet explorer"
```

## How to run the explorer for Bitcoin testnet3

```
docker run -p 50001:50001 -p 8084:80 \
           --volume $PWD/data_bitcoin_testnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-testnet explorer"
```

## How to run the explorer for Liquid regtest

```
docker run -p 50001:50001 -p 8092:80 \
           --volume $PWD/data_liquid_regtest:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh liquid-regtest explorer"
```

## How to run the explorer for Bitcoin regtest

```
docker run -p 50001:50001 -p 8094:80 \
           --volume $PWD/data_bitcoin_regtest:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-regtest explorer"
```

## Docker config options

Set `-e DEBUG=verbose` to enable more verbose logging.

Set `-e NO_PRECACHE=1` to disable pre-caching of statistics for "popular addresses",
which may take a long time and is not necessary for personal use.

Set `-e NO_ADDRESS_SEARCH=1` to disable the [by-prefix address search](https://github.com/Blockstream/esplora/blob/master/API.md#get-address-prefixprefix) index.

Set `-e ENABLE_LIGHTMODE=1` to enable [esplora-electrs's light mode](https://github.com/Blockstream/electrs/#light-mode).

Set `-e ONION_URL=http://xyz.onion` to enable the `Onion-Location` header.

## Build new esplora-base

```
docker build -t blockstream/esplora-base:latest -f Dockerfile.deps .
docker push blockstream/esplora-base:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/esplora-base
```

## Build new tor (or you can pull directly from Docker Hub - `blockstream/tor:latest`)

```
docker build --squash -t blockstream/tor:latest -f Dockerfile.tor .
docker push blockstream/tor:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/tor
```
Run: `docker -d --name hidden_service blockstream/tor:latest tor -f /home/tor/torrc` (could add a `-v /extra/torrc:/home/tor/torrc`, if you have a custom torrc)

Example torrc:
```
DataDirectory /home/tor/tor
PidFile /var/run/tor/tor.pid

ControlSocket /var/run/tor/control GroupWritable RelaxDirModeCheck
ControlSocketsGroupWritable 1
SocksPort unix:/var/run/tor/socks WorldWritable
SocksPort 9050

CookieAuthentication 1
CookieAuthFileGroupReadable 1
CookieAuthFile /var/run/tor/control.authcookie

Log [handshake]debug [*]notice stderr

HiddenServiceDir /home/tor/tor/hidden_service_v3/
HiddenServiceVersion 3
HiddenServicePort 80 127.0.0.1:80
```

## License

MIT
