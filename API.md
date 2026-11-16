# Esplora HTTP API

JSON over RESTful HTTP. Amounts are always represented in satoshis.

The blockstream.info public APIs are available at:
- Bitcoin: https://blockstream.info/api/
- Bitcoin Testnet: https://blockstream.info/testnet/api/
- Bitcoin Testnet4: https://blockstream.info/testnet4/api/
- Bitcoin Signet: https://blockstream.info/signet/api/
- Liquid: https://blockstream.info/liquid/api/
- Liquid Testnet: https://blockstream.info/liquidtestnet/api/

For example:
```bash
$ curl https://blockstream.info/api/blocks/tip/hash
```

You can also [self-host the Esplora API server](https://github.com/Blockstream/esplora#how-to-run-the-explorer-for-bitcoin-mainnet), which provides better privacy and security.

## Transactions

### `GET /tx/:txid`

Returns information about the transaction.

Available fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout` and `status`
(see [transaction format](#transaction-format) for details).

### `GET /tx/:txid/status`

Returns the transaction confirmation status.

Available fields: `confirmed` (boolean), `block_height` (optional) and `block_hash` (optional).

### `GET /tx/:txid/hex`
### `GET /tx/:txid/raw`

Returns the raw transaction in hex or as binary data.

### `GET /tx/:txid/merkleblock-proof`

Returns a merkle inclusion proof for the transaction using
[bitcoind's merkleblock](https://bitcoin.org/en/glossary/merkle-block) format.

*Note:* This endpoint is not currently available for Liquid/Elements-based chains.

### `GET /tx/:txid/merkle-proof`

Returns a merkle inclusion proof for the transaction using
[Electrum's `blockchain.transaction.get_merkle`](https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get-merkle)
format.

### `GET /tx/:txid/outspend/:vout`

Returns the spending status of a transaction output.

Available fields: `spent` (boolean), `txid` (optional), `vin` (optional) and `status` (optional, the status of the spending tx).

### `GET /tx/:txid/outspends`

Returns the spending status of all transaction outputs.

### `POST /tx`

Broadcast a raw transaction to the network.

The transaction should be provided as hex in the request body.
The `txid` will be returned on success.

### `POST /txs/package`

Broadcast a package of raw transactions to the network.

A transaction package is a group of related transactions that may depend on each other (e.g., a child transaction spending outputs from an unconfirmed parent transaction). This is useful for CPFP (Child Pays For Parent) and other scenarios where transactions need to be evaluated together.

The request body should contain a JSON array of transaction hex strings.

Example request body:
```json
["02000000...", "02000000..."]
```

Returns a JSON object containing the package acceptance result. On success, returns information about each transaction in the package.

*Note:* This endpoint requires Bitcoin Core 28.0 or later.

## Addresses

### `GET /address/:address`
### `GET /scripthash/:hash`

Get information about an address/scripthash.

Available fields: `address`/`scripthash`, `chain_stats` and `mempool_stats`.

`{chain,mempool}_stats` each contain an object with `tx_count`, `funded_txo_count`, `funded_txo_sum`, `spent_txo_count` and `spent_txo_sum`.

Elements-based chains don't have the `{funded,spent}_txo_sum` fields.

### `GET /address/:address/txs`
### `GET /scripthash/:hash/txs`

Get transaction history for the specified address/scripthash, sorted with newest first.

Returns up to 50 mempool transactions plus the first 25 confirmed transactions.
You can request more confirmed transactions using `:last_seen_txid`(see below).

### `GET /address/:address/txs/chain[/:last_seen_txid]`
### `GET /scripthash/:hash/txs/chain[/:last_seen_txid]`

Get confirmed transaction history for the specified address/scripthash, sorted with newest first.

Returns 25 transactions per page. More can be requested by specifying the last txid seen by the previous query.

### `GET /address/:address/txs/mempool`
### `GET /scripthash/:hash/txs/mempool`

Get unconfirmed transaction history for the specified address/scripthash.

Returns up to 50 transactions (no paging).

### `GET /address/:address/utxo`
### `GET /scripthash/:hash/utxo`

Get the list of unspent transaction outputs associated with the address/scripthash.

Available fields: `txid`, `vout`, `value` and `status` (with the status of the funding tx).

Elements-based chains have a `valuecommitment` field that may appear in place of `value`, plus the following additional fields: `asset`/`assetcommitment`, `nonce`/`noncecommitment`, `surjection_proof` and `range_proof`.

### `GET /address-prefix/:prefix`

Search for addresses beginning with `:prefix`.

Returns a JSON array with up to 10 results.

## Blocks

### `GET /block/:hash`

Returns information about a block.

Available fields: `id`, `height`, `version`, `timestamp`, `mediantime`, `bits`, `nonce`, `merkle_root`, `tx_count`, `size`, `weight`, and `previousblockhash`.
Elements-based chains have an additional `proof` field.
See [block format](#block-format) for more details.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/header`

Returns the hex-encoded block header.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/status`

Returns the block status.

Available fields: `in_best_chain` (boolean, false for orphaned blocks), `next_best` (the hash of the next block, only available for blocks in the best chain).

### `GET /block/:hash/txs[/:start_index]`

Returns a list of transactions in the block (up to 25 transactions beginning at `start_index`).

*Note:* The `start_index` value must be a multiple of 25.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/txids`

Returns a list of all txids in the block.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/txid/:index`

Returns the transaction at index `:index` within the specified block.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/raw`

Returns the raw block representation in binary.

The response from this endpoint can be cached indefinitely.

### `GET /block-height/:height`

Returns the hash of the block currently at `height`.

### `GET /blocks[/:start_height]`

Returns the 10 newest blocks starting at the tip or at `start_height` if specified.

### `GET /blocks/tip/height`

Returns the height of the last block.

### `GET /blocks/tip/hash`

Returns the hash of the last block.

## Mempool

### `GET /mempool`

Get mempool backlog statistics. Returns an object with:

- `count`: the number of transactions in the mempool

- `vsize`: the total size of mempool transactions in virtual bytes

- `total_fee`: the total fee paid by mempool transactions in satoshis

- `fee_histogram`: mempool fee-rate distribution histogram

  An array of `(feerate, vsize)` tuples, where each entry's `vsize` is the total vsize of transactions
  paying more than `feerate` but less than the previous entry's `feerate` (except for the first entry, which has no upper bound).
  This matches the format used by the Electrum RPC protocol for `mempool.get_fee_histogram`.

Example output:

```
{
  "count": 8134,
  "vsize": 3444604,
  "total_fee":29204625,
  "fee_histogram": [[53.01, 102131], [38.56, 110990], [34.12, 138976], [24.34, 112619], [3.16, 246346], [2.92, 239701], [1.1, 775272]]
}
```

> In this example, there are transactions weighting a total of 102,131 vbytes that are paying more than 53 sat/vB,
110,990 vbytes of transactions paying between 38 and 53 sat/vB, 138,976 vbytes paying between 34 and 38, etc.


### `GET /mempool/txids`

Get the full list of txids in the mempool as an array.

The order of the txids is arbitrary and does not match bitcoind's.

### `GET /mempool/recent`

Get a list of the last 10 transactions to enter the mempool.

Each transaction object contains simplified overview data, with the following fields: `txid`, `fee`, `vsize` and `value`

## Fee estimates

### `GET /fee-estimates`

Get an object where the key is the confirmation target (in number of blocks)
and the value is the estimated feerate (in sat/vB).

The available confirmation targets are 1-25, 144, 504 and 1008 blocks.

For example: `{ "1": 87.882, "2": 87.882, "3": 87.882, "4": 87.882, "5": 81.129, "6": 68.285, ..., "144": 1.027, "504": 1.027, "1008": 1.027 }`

## Mining

### `GET /block-template`

Returns the daemon's [`getblocktemplate`](https://developer.bitcoin.org/reference/rpc/getblocktemplate.html)
template-mode response for mining.

This endpoint is available only when electrs is started with
`--enable-mining-rest`.

Successful responses are cached internally for up to 15 seconds and invalidated
when electrs indexes a new chain tip. Responses include `Cache-Control: no-store`.

## Assets (Elements/Liquid only)

### `GET /asset/:asset_id`

Get information about an asset.

For the network's native asset (i.e. LBTC in Liquid), returns an object with:

- `asset_id`
- `chain_stats` and `mempool_stats`, each with:
  - `tx_count`
  - `peg_in_count`
  - `peg_in_amount`
  - `peg_out_amount`
  - `peg_out_count`
  - `burn_count`
  - `burned_amount`

For user-issued assets, returns an object with:

- `asset_id`
- `issuance_txin`: the issuance transaction input
  - `txid`
  - `vin`
- `issuance_prevout`: the previous output spent for the issuance
  - `txid`
  - `vout`
- `status`: the confirmation status of the initial asset issuance transaction
- `contract_hash`: the contract hash committed as the issuance entropy
- `reissuance_token`: the asset id of the reissuance token
- `chain_stats` and `mempool_stats`, each with:
  - `tx_count`: the number of transactions associated with this asset (does not include confidential transactions)
  - `issuance_count`: the number of (re)issuance transactions
  - `issued_amount`: the total known amount issued (should be considered a minimum bound when `has_blinded_issuances` is true)
  - `burned_amount`: the total amount provably burned
  - `has_blinded_issuances`: whether at least one of the (re)issuances were blind
  - `reissuance_tokens`: the number of reissuance tokens
  - `burned_reissuance_tokens`: the number of reissuance tokens burned

If the asset is available on the configured asset registry, the following fields are returned as well:

- `contract`: the full JSON contract committed in the issuance, including custom fields
- `entity`: the entity linked to this asset, e.g. `{ "domain": "foobar.com" }` (omitted if null)
- `ticker`: the ticker associated with the asset (optional)
- `precision`: the number of decimal places for units of this asset
- `name`: the asset name
- `registry`: the registry v2 record, containing `asset_id`, `contract`, `initial_issuer_pubkey`, `initial_issuer_pubkey_source`, `current_issuer_pubkey`, `issuer_pubkey_history`, `mutable`, `admin`, `icon`, `status`, `created_at` and `updated_at`, plus any additional registry fields. `icon.href` is an absolute HTTP(S) URL; an invalid icon is returned as null.

The `registry_status` field and `X-Asset-Registry-Status` header report the metadata lookup result:

- `available`: fresh registry metadata is included.
- `not_found`: the registry has no entry for the asset; only local asset data is returned.
- `stale`: expired cached registry metadata is included.
- `unavailable`: the lookup failed with no cached metadata; only local asset data is returned.

Both are omitted when no registry is configured or the asset is the native asset.
An unknown local asset returns HTTP 404.

Successful registry lookups, including missing entries, are cached internally for 15 seconds.
Expired missing entries wait for a refresh. Responses with `stale` or `unavailable` use
`Cache-Control: no-store`; other successful responses use `Cache-Control: public, max-age=10`.

Example native asset:

```
{
  "asset_id": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "chain_stats": {"tx_count": 54, "peg_in_count": 2, "peg_in_amount": 1600000000, "peg_out_count": 51, "peg_out_amount": 250490000, "burn_count":0, "burned_amount": 0 },
  "mempool_stats": {"tx_count": 3, "peg_in_count": 0, "peg_in_amount": 0, "peg_out_count": 3, "peg_out_amount": 70020000, "burn_count": 0, "burned_amount": 0 }
}
```

Example user-issued asset:

```
{
  "asset_id": "d8a317ce2c14241192cbb3ebdb9696250ca1251a58ba6251c29fcfe126c9ca1f",
  "issuance_txin":{ "txid": "39affca34bd51ed080f89f1e7a5c7a49d6d9e4779c84424ae50df67dd60dcaf7", "vin": 0},
  "issuance_prevout": { "txid": "0cdd74c540af637d5a3874ce8500891fd8e94ec8e3d5d436d86e87b6759a7674", "vout": 0 },
  "reissuance_token": "eb8b210d42566699796dbf78649120fd5c9d9b04cabc8f480856e04bd5e9fc22",
  "contract_hash": "025d983cc774da665f412ccc6ccf51cb017671c2cb0d3c32d10d50ffdf0a57de",
  "status": { "confirmed": true, "block_height": 105, "block_hash": "7bf84f2aea30b02981a220943f543a6d6e7ac646d59ef76cff27dca8d27b2b67", "block_time": 1586248729 },
  "chain_stats": { "tx_count": 1, "issuance_count": 1, "issued_amount": 0, "burned_amount": 0, "has_blinded_issuances": true, "reissuance_tokens": 0, "burned_reissuance_tokens": 0 },
  "mempool_stats": { "tx_count": 0, "issuance_count": 0, "issued_amount": 0, "burned_amount": 0, "has_blinded_issuances": false, "reissuance_tokens": null, "burned_reissuance_tokens": 0 }
}
```

### `GET /asset/:asset_id/txs`
### `GET /asset/:asset_id/txs/mempool`
### `GET /asset/:asset_id/txs/chain[/:last_seen]`

Get transactions associated with the specified asset.

For the network's native asset, returns a list of peg in, peg out and burn transactions.

For user-issued assets, returns a list of issuance, reissuance and burn transactions.

Does not include regular transactions transferring this asset.

### `GET /asset/:asset_id/supply`
### `GET /asset/:asset_id/supply/decimal`

Get the current total supply of the specified asset.

For the native asset (LBTC), this is calculated as `{chain,mempool}_stats.peg_in_amount - {chain,mempool}_stats.peg_out_amount - {chain,mempool}_stats.burned_amount`.

For issued assets, this is calculated as `{chain,mempool}_stats.issued_amount - {chain,mempool}_stats.burned_amount`.

Not available for assets with blinded issuances.

If `/decimal` is specified, returns the supply as a decimal according to the asset's divisibility.
Otherwise, returned in base units.

Both return plain text. Decimal amounts are exact, with trailing fractional zeros omitted.
The native asset uses precision 8; issued assets use the registry contract's precision,
or 0 when no registry is configured or the registry has no entry.

`/decimal` includes the `X-Asset-Registry-Status` header described above. Stale metadata
uses `Cache-Control: no-store`. If the registry lookup fails with no cached metadata,
returns a registry error (see below). The base-unit endpoint does not consult the registry.
Other supply formats return HTTP 404.

### `GET /assets/registry`

Get the list of issued assets from the configured registry v2 service.

Query string parameters:

- `start_index`: the start index to use for paging. defaults to 0.
- `limit`: maximum number of assets to return. defaults to 25, maximum 100.
- `sort_field`: field to sort assets by. one of `name`, `ticker` or `domain`. defaults to `ticker`.
- `sort_dir`: sorting direction. one of `asc` or `desc`. defaults to `asc`.
- `sort`: one of `asset_id_asc`, `asset_id_desc`, `name_asc`, `name_desc`, `ticker_asc`, `ticker_desc`, `domain_asc`, `domain_desc`, `created_at_asc`, `created_at_desc`, `updated_at_asc` or `updated_at_desc`. Cannot be combined with `sort_field` or `sort_dir`.
- `asset_id`: asset ID filter, 1-64 hexadecimal characters.
- `domain`: valid ASCII domain name, 3-255 characters.
- `ticker`: ticker filter, up to 24 characters.
- `name`: name filter, up to 255 characters.
- `asset_type`: asset type filter.
- `category_tag`: category tag filter. May be repeated, e.g. `category_tag=stablecoin&category_tag=bond`.
- `trading_venue`: trading venue filter.
- `created_after`, `updated_after`: RFC 3339 date-time filters, e.g. `2026-01-01T00:00:00Z`.

Filters are optional and forwarded to the registry, which defines their matching rules and accepted values.
`asset_type`, `category_tag` and `trading_venue` must contain 1-64 ASCII letters, digits, `-`, `_` or `.`.
`ticker` and `name` cannot contain NUL. URL-encode query values, including `+` in time offsets.

Returns a JSON array of assets in the same format as `GET /asset/:asset_id`, including
`registry` metadata, but without `registry_status`. The `X-Total-Results` header contains
the registry's total matching count. `start_index` and `limit` page over the registry's
ordering; `limit=0` returns an empty array with the total count.

Responses use `Cache-Control: no-store`. With no registry configured, returns an empty
array with a total of 0. If a listed asset is not yet indexed locally, returns HTTP 503
with `Retry-After: 10` and `Cache-Control: no-store`, without `X-Total-Results`.

Registry errors from `/assets/registry` and `/asset/:asset_id/supply/decimal` return plain text:

- HTTP 400: invalid parameters or registry HTTP 400/422.
- HTTP 503: registry HTTP 429/503, overload, or local index failure.
- HTTP 504: registry timeout.
- HTTP 502: other registry errors, including connection failures or invalid responses.

`X-Asset-Registry-Status` and `X-Total-Results` are exposed to browser clients through
`Access-Control-Expose-Headers` on Elements/Liquid builds.

## Transaction format

- `txid`
- `version`
- `locktime`
- `size`
- `weight`
- `fee`
- `vin[]`
  - `txid`
  - `vout`
  - `is_coinbase`
  - `scriptsig`
  - `scriptsig_asm`
  - `inner_redeemscript_asm`
  - `inner_witnessscript_asm`
  - `sequence`
  - `witness[]`
  - `prevout` (previous output in the same format as in `vout` below)
  - *(Elements only)*
  - `is_pegin`
  - `issuance` (available for asset issuance transactions, `null` otherwise)
    - `asset_id`
    - `is_reissuance`
    - `asset_id`
    - `asset_blinding_nonce`
    - `asset_entropy`
    - `contract_hash`
    - `assetamount` or `assetamountcommitment`
    - `tokenamount` or `tokenamountcommitment`
- `vout[]`
  - `scriptpubkey`
  - `scriptpubkey_asm`
  - `scriptpubkey_type`
  - `scriptpubkey_address`
  - `value`
  - *(Elements only)*
  - `valuecommitment`
  - `asset` or `assetcommitment`
  - `pegout` (available for peg-out outputs, `null` otherwise)
    - `genesis_hash`
    - `scriptpubkey`
    - `scriptpubkey_asm`
    - `scriptpubkey_address`
- `status`
  - `confirmed` (boolean)
  - `block_height` (available for confirmed transactions, `null` otherwise)
  - `block_hash` (available for confirmed transactions, `null` otherwise)
  - `block_time` (available for confirmed transactions, `null` otherwise)

## Block format

- `id`
- `height`
- `version`
- `timestamp`
- `bits`
- `nonce`
- `difficulty`
- `merkle_root`
- `tx_count`
- `size`
- `weight`
- `previousblockhash`
- `mediantime` (median time-past)
- *(Elements only)*
- `proof`
  - `challenge`
  - `challenge_asm`
  - `solution`
  - `solution_asm`
