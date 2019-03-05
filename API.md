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

<!--
### `GET /tx/:txid/merkle-proof`

Returns a merkle inclusion proof for the transaction.

*Currently uses Electrum's merkle proof format, will eventually be changed to use the `merkleblock` format.*
-->

### `GET /tx/:txid/outspend/:vout`

Returns the spending status of a transaction output.

Available fields: `spent` (boolean), `txid` (optional), `vin` (optional) and `status` (optional, the status of the spending tx).

### `GET /tx/:txid/outspends`

Returns the spending status of all transaction outputs.

### `GET /broadcast?tx=<rawtx>`

Broadcast `<rawtx>` (the raw transaction in hex) to the network.
Returns the `txid` on success.

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

- `vsize`: the total size of the mempool in virtual bytes

- `total_fee`: the total fee paid by mempool transactions (in satoshis)

- `fee_histogram`: mempool fee-rate distribution histogram (see below)

  An array of `(feerate, vsize)` tuples, where each entry's `vsize` is the total vsize of transactions
  paying more than `feerate` but less than the previous entry's `feerate` (except for the first entry, which has no upper bound).
  This matches the format used by the Electrum RPC protocol for `mempool.get_fee_histogram`.

```
{
  "count": 8134,
  "vsize": 3444604,
  "total_fee":29204625,
  "fee_histogram": [[53, 102131], [38, 110990], [34, 138976], [24, 112619], [3, 246346], [2, 239701], [1, 775272]]
}
```

### `GET /mempool/txids`

Get the full list of txids in the mempool as an array.

The order of the txids is arbitrary and does not match bitcoind's.

### `GET /mempool/recent`

Get a list of last 25 transactions to enter the mempool.

Each transaction object contains simplified overview data, with the following fields: `txid`, `fee`, `vsize` and `value`

## Fee estimates

### `GET /fee-estimates`

Get an object where the key is the confirmation target (in number of blocks)
and the value is the estimated feerate (in sat/vB).

The available confirmation targets are 2, 3, 4, 6, 10, 20, 144, 504 and 1008 blocks.

For example: `{ 2: 36.183, 3: 34.841, 4: 34.841, 6: 34.841, 10: 22.164, 20: 9.692, 144: 1, 501: 1, 1008:1 }`

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
  - `sequence`
  - `witness[]`
  - `prevout` (previous output in the same format as in `vout` below)
  - *(Elements only)*
  - `is_pegin`
  - `issuance` (available for asset issuance transactions, `null` otherwise)
    - `is_reissuance`
    - `asset_blinding_nonce`
    - `asset_entropy`
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
