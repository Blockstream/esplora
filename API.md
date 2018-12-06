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

*Currently uses Electrum's merkle proof format, will eventually be changed to use the `merkleblock` format.*

### `GET /tx/:txid/outspend/:vout`

Returns the spending status of a transaction output.

Available fields: `spent` (boolean), `txid` (optional), `vin` (optional) and `status` (optional, the status of the spending tx).

### `GET /tx/:txid/outspends`

Returns the spending status of all transaction outputs.

## Addresses

### `GET /address/:address`

Returns information about an address.

Available fields: `address`, `tx_count`, `confirmed_balance`, `mempool_balance` and `total_received`.

Elements-based chains only have the `address` and `tx_count` fields.

### `GET /address/:address/txs[/:start_index]`

Returns transaction history for the specified adresss (up to 25 transactions beginning at `start_index`, newest first).

### `GET /address/:address/utxo`

Returns the list of unspent txos associated with the address.

Available fields: `txid`, `vout`, `value` and `status` (with the status of the funding tx).
Elements-based chains  have an additional `asset` field.

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
