# Esplora Block Explorer

Block explorer web interface based on the [esplora-electrs](https://github.com/Blockstream/electrs) HTTP API.

Written as a single-page app in a reactive and functional style using
[rxjs](https://github.com/ReactiveX/rxjs) and [cycle.js](https://cycle.js.org/).

See live at [Blockstream.info](https://blockstream.info/).

API documentation [is available here](API.md).

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

- For Liquid and other Elements-based chains: support for CT, peg-in/out transactions and multi-asset

## Developing

To start a development server with live babel/browserify transpilation, run:

```bash
$ git clone https://github.com/Blockstream/esplora && cd esplora
$ npm install
$ export API_URL=http://localhost:5000/ # or https://blockstream.info/api/ if you don't have a local API server
# (see more config options below)
$ npm start
```

## Building

To build the static assets directory for production deployment, set config options (see below)
and run `$ npm run dist`. The files will be created under `dist/`.

Because Esplora is a single-page app, the HTTP server needs to be configured to serve the `index.html` file in reply to missing pages.
See [`contrib/nginx.conf.in`](contrib/nginx.conf.in) for example nginx configuration (TL;DR: `try_files $uri /index.html`).

## Configuration options

All options are optional.

- `NODE_ENV` - set to `production` to enable js minification, or to `development` to disable (defaults to `production`)
- `BASE_HREF` - base href for user interface (defaults to `/`, change if not served from the root directory)
- `API_URL` - URL for HTTP REST API (defaults to `/api`, change if the API is available elsewhere)
- `PORT` - port to bind http development server (defaults to `3000`, has no effect when building)
- `BASE_URL` - absolute base url for user interface (no default, only required for opensearch functionality)
- `NATIVE_ASSET_LABEL` - the name of the network native asset (defaults to `BTC`)
- `SITE_TITLE` - website title for `<title>` (defaults to `Block Explorer`)
- `SITE_DESC` - meta description (defaults to `Esplora Block Explorer`)
- `HOME_TITLE` - text for homepage title (defaults to `SITE_TITLE`)
- `SITE_FOOTER` - text for page footer (defaults to `Powered by esplora`)
- `HEAD_HTML` - custom html to inject at the end of `<head>`
- `FOOT_HTML` - custom html to inject at the end of `<body>`
- `CUSTOM_ASSETS` - space separated list of static assets to add to the build
- `CUSTOM_CSS` - space separated list of css files to append into `style.css`

Elements-only configuration:

- `NATIVE_ASSET_ID` - the ID of the native asset used to pay fees (defaults to `6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d`, the asset id for BTC)
- `BLIND_PREFIX` - the base58 address prefix byte used for confidential addresses (defaults to `12`)
- `PARENT_CHAIN_EXPLORER_TXOUT` - URL format for linking to transaction outupts on the parent chain, with `{txid}` and `{vout}` as placeholders. Example: `https://blockstream.info/tx/{txid}#output:{vout}`
- `PARENT_CHAIN_EXPLORER_ADDRESS` - URL format for linking to addresses on parent chain, with `{addr}` replaced by the address. Example: `https://blockstream.info/address/{addr}`

Menu configuration (useful for inter-linking multiple instances on different networks):

- `MENU_ITEMS` - json map of menu items, where the key is the label and the value is the url
- `MENU_ACTIVE` - the active menu item identified by its label

## How to build the Docker image

```
docker build -t esplora .
```

## How to run the explorer for Bitcoin mainnet

```
docker run --port 8080:80 \
           --volume $PWD/data_bitcoin_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-mainnet explorer"
```

## How to run the explorer for Liquid mainnet

```
docker run --port 8082:80 \
           --volume $PWD/data_liquid_mainnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh liquid-mainnet explorer"
```

## How to run the explorer for Bitcoin testnet3

```
docker run --port 8084:80 \
           --volume $PWD/data_bitcoin_testnet:/data \
           --rm -i -t esplora \
           bash -c "/srv/explorer/run.sh bitcoin-testnet explorer"
```


## Build new esplora-base

```
docker build -t blockstream/esplora-base:latest -f Dockerfile.deps .
docker push blockstream/esplora-base:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/esplora-base
```

## Build new ci

```
docker build --squash -t blockstream/gcloud-docker:latest -f Dockerfile.ci .
docker push blockstream/gcloud-docker:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/gcloud-docker
```

# Build new gcloud-tor

```
docker build --squash -t blockstream/gcloud-tor:latest -f Dockerfile.tor .
docker push blockstream/gcloud-tor:latest
docker inspect --format='{{index .RepoDigests 0}}' blockstream/gcloud-tor
```

## License

MIT
