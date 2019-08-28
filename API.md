# Esplora HTTP API

JSON over RESTful HTTP. Amounts are always represented in satoshis.

## Transactions

### `GET /tx/:txid`

Returns information about the transaction.

Available fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout` and `status`
(see [transaction format](#transaction-format) for details).

### `GET /tx/:txid/status`

Returns the transaction confirmation status.

Available fields: `confirmed` (boolean), `block_height` (optional) and `block_hash` (optional).

### `GET /tx/:txid/hex`

Returns the raw transaction in hex.

### `GET /tx/:txid/merkle-proof`

Returns a merkle inclusion proof for the transaction.

Currently matches the merkle proof format used by Electrum's
[`blockchain.transaction.get_merkle`](https://electrumx.readthedocs.io/en/latest/protocol-methods.html#blockchain-transaction-get-merkle).
*Will eventually be changed to use bitcoind's `merkleblock` format instead.*

### `GET /tx/:txid/outspend/:vout`

Returns the spending status of a transaction output.

Available fields: `spent` (boolean), `txid` (optional), `vin` (optional) and `status` (optional, the status of the spending tx).

### `GET /tx/:txid/outspends`

Returns the spending status of all transaction outputs.

### `POST /tx`

Broadcast a raw transaction to the network.

The transaction should be provided as hex in the request body.
The `txid` will be returned on success.

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
Elements-based chains have an additional `asset` field.

## Blocks

### `GET /block/:hash`

Returns information about a block.

Available fields: `id`, `height`, `version`, `timestamp`, `bits`, `nonce`, `merkle_root`, `tx_count`, `size`, `weight` and `previousblockhash`.
Elements-based chains have an additional `proof` field.
See [block format](#block-format) for more details.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/status`

Returns the block status.

Available fields: `in_best_chain` (boolean, false for orphaned blocks), `next_best` (the hash of the next block, only available for blocks in the best chain).

### `GET /block/:hash/txs[/:start_index]`

Returns a list of transactions in the block (up to 25 transactions beginning at `start_index`).

Transactions returned here do not have the `status` field, since all the transactions share the same block and confirmation status.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/txids`

Returns a list of all txids in the block.

The response from this endpoint can be cached indefinitely.

### `GET /block/:hash/txid/:index`

Returns the transaction at index `:index` within the specified block.

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

The available confirmation targets are 2, 3, 4, 6, 10, 20, 144, 504 and 1008 blocks.

For example: `{ "2": 87.882, "3": 87.882, "4": 87.882, "6": 68.285, "10": 1.027, "20": 1.027, "144": 1.027, "504": 1.027, "1008": 1.027 }`

## Issued assets (Elements/Liquid only)

### `GET /asset/:asset_id`

Get information about an issued asset. Returns an object with:

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
- `chain_stats` and `mempool_stats`
  - `tx_count`: the number of transactions associated with this asset (does not include confidential transactions)
  - `issuance_count`: the number of (re)issuance transactions
  - `issued_amount`: the total known amount issued (should be considered a minimum bound when `has_blinded_issuances` is true)
  - `burned_amount`: the total amount provably burned
  - `has_blinded_issuances`: whether at least one of the (re)issuances were blind
  - `reissuance_tokens`: the number of reissuance tokens
  - `burned_reissuance_tokens`: the number of reissuance tokens burned

If the asset is available on the registry, the following fields are returned as well:

- `contract`: the full json contract json committed in the issuance
- `entity`: the entity linked to this asset. the only available type is currently `domain`, which is encoded as `{ "domain": "foobar.com>" }` (required)
- `ticker`: a 3-5 characters ticker associated with the asset (optional)
- `precision`: the number of decimal places for units of this asset (defaults to 0)
- `name`: a description for the asset (up to 255 characters)

Example:

```
{"asset_id":"4d4354944366ea1e33f27c37fec97504025d6062c551208f68597d1ed40ec53e","contract":{"entity":{"domain":"magicalcryptofriends.com"},"issuer_pubkey":"02d2b29fe8ffef6acb5e75d0cd7f9c55d502bd876434b87c39ae209fc57c57f52a","name":"Magical Crypto Token","nonce":"13158145","precision":0,"ticker":"MCT","version":0},"issuance_txin":{"txid":"d535ded7ce07a0bb9c61d0fefff8127da3fc4833302b05e2b8a0cf9e04446af1","vin":0},"issuance_prevout":{"txid":"839e819d74ac98110fce63a3dab3a1075bbddcad811e0e125641989581919ab0","vout":1},"name":"Magical Crypto Token","ticker":"MCT","precision":0,"entity":{"domain":"magicalcryptofriends.com"}}
```

### `GET /asset/:asset_id/txs`
### `GET /asset/:asset_id/txs/mempool`
### `GET /asset/:asset_id/txs/chain[/:last_seen]`

Returns the list of (re)issuance and burn transactions associated with this asset id.

Does not include regular transactions transferring this asset.

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
- `merkle_root`
- `tx_count`
- `size`
- `weight`
- `previousblockhash`
- *(Elements only)*
- `proof`
  - `challenge`
  - `challenge_asm`
  - `solution`
  - `solution_asm`
