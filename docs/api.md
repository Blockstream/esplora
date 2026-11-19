# Blockstream Explorer API: full reference

> REST (Esplora), Electrum RPC and QuickSync (Waterfalls) for Bitcoin and Liquid. Generated from the docs site.

Every endpoint and method has examples for both tiers, in cURL/Shell, Python and JavaScript: **Free** (no auth) and **Enterprise** (expects an access token in `ACCESS_TOKEN`; see Authentication for how to get one). QuickSync is Enterprise only. Examples use Bitcoin mainnet (Liquid-only endpoints use Liquid); for another network, swap the base URL or host.

## Overview

### Getting started

#### Introduction {#introduction}

<!-- keywords: overview tiers free enterprise pricing plans api key cors browser -->

The Blockstream Explorer API provides indexed Bitcoin & Liquid blockchain data for wallets, exchanges, data dashboards and fintech apps through 3 interfaces REST, Electrum RPC and QuickSync. This is the same infrastructure that powers [blockstream.info](https://blockstream.info) and the Blockstream App.

- REST Esplora HTTP API: JSON over HTTPS: transactions, addresses, UTXOs, blocks, mempool, fees and Liquid assets.

- RPC Electrum RPC: JSON-RPC over TLS with batching and push subscriptions for headers and script hashes.

- QuickSync Waterfalls: Full wallet history from a descriptor in one request, instead of one request per address.

##### The Explorer API is available in 2 tiers: Free & Enterprise

|  | Free API | Enterprise |
|---|---|---|
| Authentication | None | OAuth 2.0 client credentials → Bearer token ([details](#authentication) · [get API keys](https://blockstream.info/explorer-api)) |
| Interfaces | REST, Electrum | REST, Electrum, QuickSync |
| Networks | Bitcoin, Testnet3, Testnet4, Signet, Liquid, Liquid Testnet | Bitcoin, Testnet3, Testnet4, Liquid, Liquid Testnet |
| Rate limits | Mainnets (Bitcoin, Liquid) are rate-limited; testnets are more lenient to encourage development and prototyping | Set by your plan |
| Price | Free | [Monthly subscription plans](https://blockstream.info/explorer-api) |

Use the **Free / Enterprise** switch in the sidebar: every code example updates to match. Examples use Bitcoin mainnet; for other networks, swap the base URL.

#### Networks & base URLs {#networks}

<!-- keywords: base url urls host hosts endpoints mainnet testnet testnet3 testnet4 signet liquid liquidtestnet elements port 50002 50001 tls tcp rate limit rate-limit deprecated legacy -->

Every REST path in this reference is relative to a network base URL. QuickSync lives under `{enterprise base}/waterfalls`.

| Network | REST · Free | REST · Enterprise | Electrum · Free (TLS) | Electrum · Enterprise (TLS) | QuickSync · Enterprise |
|---|---|---|---|---|---|
| Bitcoin | `https://blockstream.info/api` | `https://enterprise.blockstream.info/api` | `bitcoin-mainnet.blockstream.info:50002` | `bitcoin-mainnet.enterprise.blockstream.info:50002` | `https://enterprise.blockstream.info/api/waterfalls` |
| Bitcoin Testnet3 | `https://blockstream.info/testnet/api` | `https://enterprise.blockstream.info/testnet/api` | `bitcoin-testnet.blockstream.info:50002` | `bitcoin-testnet.enterprise.blockstream.info:50002` | `https://enterprise.blockstream.info/testnet/api/waterfalls` |
| Bitcoin Testnet4 | `https://blockstream.info/testnet4/api` | `https://enterprise.blockstream.info/testnet4/api` | `bitcoin-testnet4.blockstream.info:50002` | `bitcoin-testnet4.enterprise.blockstream.info:50002` | `https://enterprise.blockstream.info/testnet4/api/waterfalls` |
| Bitcoin Signet | `https://blockstream.info/signet/api` | — | `bitcoin-signet.blockstream.info:50002` | — | — |
| Liquid | `https://blockstream.info/liquid/api` | `https://enterprise.blockstream.info/liquid/api` | `elements-mainnet.blockstream.info:50002` | `elements-mainnet.enterprise.blockstream.info:50002` | `https://enterprise.blockstream.info/liquid/api/waterfalls` |
| Liquid Testnet | `https://blockstream.info/liquidtestnet/api` | `https://enterprise.blockstream.info/liquidtestnet/api` | `elements-testnet.blockstream.info:50002` | `elements-testnet.enterprise.blockstream.info:50002` | `https://enterprise.blockstream.info/liquidtestnet/api/waterfalls` |

**Naming differs by interface.** Liquid REST paths use `liquid` / `liquidtestnet`, but Electrum hosts (Free and Enterprise) use `elements-mainnet` / `elements-testnet`. `/testnet/` and `bitcoin-testnet` are **testnet3**; Testnet4 has its own path and host.
**Free API rate limits:** Bitcoin and Liquid mainnet are rate-limited. The test networks (Testnet3, Testnet4, Signet, Liquid Testnet) are more lenient, to encourage development and prototyping. For production traffic, use Enterprise.
On the Free API, a path under an unknown network prefix (e.g. a typo like `blockstream.info/tesnet/api/…`) returns **200 with the explorer's HTML page**, not JSON. Always check `Content-Type`.

##### Deprecated Electrum hosts

Most of these legacy free Electrum endpoints are **already switched off**. Only `blockstream.info:995` (Liquid, TLS) still answers, and it will be switched off soon. Move to the new hosts over TLS:

| Deprecated | Transport | Network | Status | Use instead |
|---|---|---|---|---|
| `blockstream.info:700` | TLS | Bitcoin | Closed | `bitcoin-mainnet.blockstream.info:50002` |
| `blockstream.info:110` | TCP | Bitcoin | Closed | `bitcoin-mainnet.blockstream.info:50002` |
| `blockstream.info:993` | TLS | Bitcoin Testnet3 | Closed | `bitcoin-testnet.blockstream.info:50002` |
| `blockstream.info:143` | TCP | Bitcoin Testnet3 | Closed | `bitcoin-testnet.blockstream.info:50002` |
| `blockstream.info:995` | TLS | Liquid | Still answers | `elements-mainnet.blockstream.info:50002` |
| `blockstream.info:195` | TCP | Liquid | Closed | `elements-mainnet.blockstream.info:50002` |
| `blockstream.info:465` | TLS | Liquid Testnet | Closed | `elements-testnet.blockstream.info:50002` |
| `blockstream.info:587` | TCP | Liquid Testnet | Closed | `elements-testnet.blockstream.info:50002` |

#### Quickstart {#quickstart}

<!-- keywords: getting started first request example hello world -->

##### Free API (no key needed)

- Make a REST request to fetch the height of the most recent Bitcoin block:

```
curl https://blockstream.info/api/blocks/tip/height
```

- Make an Electrum RPC request to fetch the height and header of the most recent Bitcoin block:
Newline-delimited JSON-RPC over TLS. Send a request, read the reply line.

```
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.headers.subscribe","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

The [REST](#proto-rest) and [Electrum](#proto-electrum) references have examples in cURL, JavaScript, Python and Go for every endpoint and method.

##### Enterprise API (API key)

- Get an access token, then make a REST request to fetch the height of the most recent Bitcoin block:
Get your API key (client id and secret) at [blockstream.info/explorer-api](https://blockstream.info/explorer-api), exchange it for a token valid for 5 minutes, then send it as a Bearer header:

```
# export BS_CLIENT_ID="your_client_id" BS_CLIENT_SECRET="your_client_secret"
ACCESS_TOKEN=$(curl -s -X POST \
  "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  --data-urlencode "client_id=$BS_CLIENT_ID" \
  --data-urlencode "client_secret=$BS_CLIENT_SECRET" \
  --data-urlencode "grant_type=client_credentials" \
  --data-urlencode "scope=openid" | jq -r .access_token)

curl -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/blocks/tip/height"
```

- Make an authenticated Electrum RPC request to fetch the height and header of the most recent Bitcoin block:
Uses the token from step 1. Add an `authorization` member to the first request on the connection:

```
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.headers.subscribe","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

- Make a QuickSync request to fetch the full transaction history of a Bitcoin wallet from its descriptor:

```
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  "https://enterprise.blockstream.info/api/waterfalls/v2/waterfalls"
```

[See end-to-end examples](#auth-e2e) for REST, Electrum and QuickSync in four languages.

#### Authentication (Enterprise) {#authentication}

<!-- keywords: auth token access token api key keys client id client_id client secret client_secret bearer jwt oauth openid credits 401 402 login dashboard expiry expired lifetime cors -->

Enterprise endpoints use the OAuth 2.0 **client credentials** grant. Exchange your `client_id` and `client_secret` for an access token, then send it with every REST request, or on the first request of each Electrum connection.
Don't have credentials yet? **Get your API keys at [blockstream.info/explorer-api](https://blockstream.info/explorer-api)**.

##### 1 · Request an access token

| Endpoint | `POST https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token` |
|---|---|
| Content-Type | `application/x-www-form-urlencoded` |
| Body | `client_id`, `client_secret`, `grant_type=client_credentials`, `scope=openid` |

Code Example:
```
# pip install requests
import os
import time
import requests

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
_cache = {"token": None, "expires_at": 0.0}

def get_token() -> str:
    """Return a valid access token, requesting a new one ~30 s before expiry.
    There is no refresh token (refresh_expires_in = 0): just request again."""
    if _cache["token"] and time.time() < _cache["expires_at"] - 30:
        return _cache["token"]
    res = requests.post(TOKEN_URL, data={
        "client_id": os.environ["BS_CLIENT_ID"],
        "client_secret": os.environ["BS_CLIENT_SECRET"],
        "grant_type": "client_credentials",
        "scope": "openid",
    }, timeout=30)
    if not res.ok:
        raise RuntimeError(f"token request failed: {res.status_code} {res.text}")
    data = res.json()
    _cache.update(token=data["access_token"], expires_at=time.time() + data["expires_in"])
    return _cache["token"]

res = requests.get("https://enterprise.blockstream.info/api/blocks/tip/height",
                   headers={"Authorization": f"Bearer {get_token()}"}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text, "· credits left:", res.headers.get("x-credits-remaining"))
```

Token response 200 application/json:
```
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6…",
  "expires_in": 300,
  "refresh_expires_in": 0,
  "token_type": "Bearer",
  "id_token": "eyJhbGciOi…",
  "not-before-policy": 0,
  "scope": "openid email"
}
```

##### 2 · Use the access token

**REST and QuickSync:** send `Authorization: Bearer <access_token>`. Each authenticated response includes `X-Credits-Remaining`.
**Credits:** REST and Electrum cost 1 credit per request (each element of an Electrum batch counts); QuickSync costs depend on your plan. See [plans & pricing](https://blockstream.info/explorer-api).
**Electrum:** add a top-level `authorization` member, _including_ the `Bearer ` prefix, to the **first** request on the connection. Later requests on the same connection don't need it. If your first message is a batch, put it on the **first element** of the array.

```
{"jsonrpc":"2.0","id":1,"method":"server.version","params":["my-app","1.4"],"authorization":"Bearer eyJhbGciOi…"}
```

##### 3 · End-to-end examples {#auth-e2e}

Each example requests a token with your credentials (set `BS_CLIENT_ID` and `BS_CLIENT_SECRET`) and uses it for one call. REST fetches the current block height, Electrum gets an address's balance, and QuickSync scans a whole wallet from its descriptor in a single request, which would otherwise take one request per address.

REST GET /blocks/tip/height [Endpoint reference →](#rest-blocks-tip-height)
Requests an access token, then gets the current block height on Bitcoin mainnet from the REST API.
Code Example:
```
# pip install requests
import os
import time
import requests

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
_cache = {"token": None, "expires_at": 0.0}

def get_token() -> str:
    """Return a valid access token, requesting a new one ~30 s before expiry.
    There is no refresh token (refresh_expires_in = 0): just request again."""
    if _cache["token"] and time.time() < _cache["expires_at"] - 30:
        return _cache["token"]
    res = requests.post(TOKEN_URL, data={
        "client_id": os.environ["BS_CLIENT_ID"],
        "client_secret": os.environ["BS_CLIENT_SECRET"],
        "grant_type": "client_credentials",
        "scope": "openid",
    }, timeout=30)
    if not res.ok:
        raise RuntimeError(f"token request failed: {res.status_code} {res.text}")
    data = res.json()
    _cache.update(token=data["access_token"], expires_at=time.time() + data["expires_in"])
    return _cache["token"]

res = requests.get("https://enterprise.blockstream.info/api/blocks/tip/height",
                   headers={"Authorization": f"Bearer {get_token()}"}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text, "· credits left:", res.headers.get("x-credits-remaining"))
```
Response · Bitcoin mainnet example 200 text/plain:
```
971407
```

Electrum blockchain.scripthash.get_balance [Endpoint reference →](#rpc-scripthash-get-balance)
Requests an access token, opens a TLS connection to the Bitcoin mainnet Electrum server and asks for the confirmed and unconfirmed balance of an address (`bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq`, identified by its Electrum script hash). The token goes in the first request on the connection.
Code Example:
```
# pip install requests
import json
import os
import socket
import ssl
import time
import requests

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
_cache = {"token": None, "expires_at": 0.0}

def get_token() -> str:
    """Return a valid access token, requesting a new one ~30 s before expiry.
    There is no refresh token (refresh_expires_in = 0): just request again."""
    if _cache["token"] and time.time() < _cache["expires_at"] - 30:
        return _cache["token"]
    res = requests.post(TOKEN_URL, data={
        "client_id": os.environ["BS_CLIENT_ID"],
        "client_secret": os.environ["BS_CLIENT_SECRET"],
        "grant_type": "client_credentials",
        "scope": "openid",
    }, timeout=30)
    if not res.ok:
        raise RuntimeError(f"token request failed: {res.status_code} {res.text}")
    data = res.json()
    _cache.update(token=data["access_token"], expires_at=time.time() + data["expires_in"])
    return _cache["token"]

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
SCRIPTHASH = "f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"  # Electrum script hash of bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq (reversed sha256 of its scriptPubKey)

request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_balance",
    "params": [SCRIPTHASH],
    "authorization": f"Bearer {get_token()}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:
            print(msg["error"] if "error" in msg else msg["result"])  # {"confirmed": sats, "unconfirmed": sats}
            break
```
Response result · Bitcoin mainnet example:
```
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "confirmed": 17983134,
    "unconfirmed": 0
  }
}
```
Balances are in satoshis. The Python and JavaScript examples print only `result`.
QuickSync GET /api/waterfalls/v2/waterfalls?descriptor=… [Endpoint reference →](#wf-v2)
Requests an access token, then scans a whole Bitcoin mainnet wallet in one request: every receive and change address the descriptor derives. It prints how many transactions each part of the wallet has, which addresses are used, and the tip.
Code Example:
```
# pip install requests
import os
import time
import requests

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
_cache = {"token": None, "expires_at": 0.0}

def get_token() -> str:
    """Return a valid access token, requesting a new one ~30 s before expiry.
    There is no refresh token (refresh_expires_in = 0): just request again."""
    if _cache["token"] and time.time() < _cache["expires_at"] - 30:
        return _cache["token"]
    res = requests.post(TOKEN_URL, data={
        "client_id": os.environ["BS_CLIENT_ID"],
        "client_secret": os.environ["BS_CLIENT_SECRET"],
        "grant_type": "client_credentials",
        "scope": "openid",
    }, timeout=30)
    if not res.ok:
        raise RuntimeError(f"token request failed: {res.status_code} {res.text}")
    data = res.json()
    _cache.update(token=data["access_token"], expires_at=time.time() + data["expires_in"])
    return _cache["token"]

DESCRIPTOR = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"

# One request returns the history of every address the descriptor derives (receive and change)
res = requests.get("https://enterprise.blockstream.info/api/waterfalls/v2/waterfalls", params={"descriptor": DESCRIPTOR},
                   headers={"Authorization": f"Bearer {get_token()}"}, timeout=60)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
data = res.json()

# txs_seen: {descriptor: [[entries at index 0], [entries at index 1], ...]}, so position = derivation index
for desc, per_index in data["txs_seen"].items():
    used = [i for i, entries in enumerate(per_index) if entries]
    txids = {e["txid"] for entries in per_index for e in entries}
    print(f"{desc[:48]}…  {len(txids)} txs, used indexes: {used[:10]}")
print("tip:", data["tip"], "· has_more:", data.get("has_more", []), "· credits left:", res.headers.get("x-credits-remaining"))
```
Response · Bitcoin mainnet example, truncated 200 application/json:
```
{
  "txs_seen": {
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/0/*)#kj7aqcx6": [
      [
        {
          "txid": "0aa80eddc9a0af25709dae5db5f270ac39a9ecf210c2a0bed5b1f9a70c8b0fa5",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        {
          "txid": "8186157e7cbda13a3795c76248a19d5f638ba7767dd94a1d3d49ef46ab58f547",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        "… 98 more"
      ],
      [
        {
          "txid": "c62b53412353ec1c727dc31a58b69038ab045cb01d4d1ddb687308ab31cc2730",
          "height": 662792,
          "block_hash": "000000000000000000038c6573feae3c8d4416203feca3d4e54d90d14c5fc9b1",
          "block_timestamp": 1608815762
        },
        {
          "txid": "5a5947e08a64c25ec92bdfd5ff1dda2ad079ba85ac41536b1ed468f29de736db",
          "height": 664033,
          "block_hash": "0000000000000000000a521ce159c614ba7e7e31e0bf56b62ea98c4107cffea1",
          "block_timestamp": 1609525908
        },
        "… 6 more"
      ],
      "… 118 more"
    ],
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/1/*)#8xmuadkz": [
      [
        {
          "txid": "9f3dbe0da718398178955cbe386813f8f6ed709f525fb5bf2885ba3545276ed3",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        },
        {
          "txid": "c9fe41e18ba7f97e413a63e0ca1a8ed3bf550670a70417de8851ba5c0f530e5d",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        }
      ],
      [],
      "… 38 more"
    ]
  },
  "page": 0,
  "tip": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
  "has_more": [
    "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu"
  ]
}
```
The examples print a summary of this response: the number of transactions and the used derivation indexes for each descriptor (receive `/0/*` and change `/1/*`), then the tip.
Building a wallet? [LWK](#lwk) (Liquid) and [BDK](#bdk) (Bitcoin) support Enterprise authentication; LWK fetches and refreshes tokens for you.

##### Token lifetime

- Tokens expire after **300 s** by default. You can change the lifetime when managing your keys at [dashboard.blockstream.info](https://dashboard.blockstream.info/).

- There is **no refresh token** (`refresh_expires_in: 0`). Request a new token shortly before expiry, as the helper above does.

- An Electrum connection authenticated with a token stays usable after that token expires, but it can be closed at any time. On disconnect, get a fresh token, reconnect and re-subscribe.

- A short grace period may apply after a token expires; don't rely on it. Refresh about 30 s early.

##### Failures

| Interface | Response | Cause |
|---|---|---|
| REST | **401** HTML. `WWW-Authenticate: Bearer realm="blockstream-public"`, plus `error="invalid_token"` when a token was sent | Missing, invalid or expired token, or a token from another environment |
| REST | **400** HTML | Token sent without the `Bearer ` prefix |
| Electrum | `{"code":-32004,"message":"invalid authorization member"}` | Missing or invalid token, missing `Bearer ` prefix, or token placed in `params` |

**Keep credentials server-side.** Browsers can't call Enterprise endpoints directly: the CORS preflight for the `Authorization` header is rejected (401, no CORS headers). Never ship a `client_secret` in front-end code; proxy requests through your backend.
**Electrum RPC connection lifetime:** Electrum servers close each connection at a random age between 4 and 8 hours. Connections can also drop earlier during maintenance or deploys, sometimes without a clean disconnect. Reconnect with a **fresh token**, because new connections reject an expired one. [See Connecting](#electrum).

## REST API {#proto-rest}

### Transactions

#### GET /tx/:txid {#rest-tx}

**Get Transaction**

Returns information about the transaction, including every input's previous output (`prevout`), so you can compute amounts and fees without extra lookups.

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |

> Liquid adds `discount_vsize` and `discount_weight` for transactions confirmed after the Dec 2024 discount-CT policy, plus confidential-transaction fields in `vin`/`vout`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "txid": "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",
  "version": 2,
  "locktime": 0,
  "vin": [
    {
      "txid": "ec40eb2a00eb3ead495d8f12a95432ec292d4d56839733af3acaa01a94ccb97f",
      "vout": 0,
      "prevout": {
        "scriptpubkey": "5120b026db968db73f967f0a36fbb04150da05ea6c4d54edd5d6e76607e505243542",
        "scriptpubkey_asm": "OP_PUSHNUM_1 OP_PUSHBYTES_32 b026db968db73f967f0a36fbb04150da05ea6c4d54edd5d6e76607e505243542",
        "scriptpubkey_type": "v1_p2tr",
        "scriptpubkey_address": "bc1pkqndh95dkulevlc2xmamqs2smgz75mzd2nkat4h8vcr72pfyx4pqq7x4tl",
        "value": 2471128002
      },
      "scriptsig": "",
      "scriptsig_asm": "",
      "witness": [
        "924b2624416402a52ed7cf4eba6b2c535d2def8e649a74ed97aaca5ec54881ef3b34da68bb13d76d6b420e60297a9247cb081d1e59cb2c260b1509cff25d4b31",
        "204c04e894d5357840e324b24c959ca6a5082035f6ffae12f331202bc84bf4612eac0063036f7264010b2047f22ed15d3082f5e9a005864528e4f991ade841a9c5846e2c118425878b6be1010d09b530368c74df10a30368",
        "c04c04e894d5357840e324b24c959ca6a5082035f6ffae12f331202bc84bf4612e"
      ],
      "is_coinbase": false,
      "sequence": 0
    }
  ],
  "vout": [
    {
      "scriptpubkey": "51203b8b3ab1453eb47e2d4903b963776680e30863df3625d3e74292338ae7928da1",
      "scriptpubkey_asm": "OP_PUSHNUM_1 OP_PUSHBYTES_32 3b8b3ab1453eb47e2d4903b963776680e30863df3625d3e74292338ae7928da1",
      "scriptpubkey_type": "v1_p2tr",
      "scriptpubkey_address": "bc1p8w9n4v298668ut2fqwukxamxsr3ssc7lxcja8e6zjgec4euj3ksswckxz6",
      "value": 1797928002
    },
    {
      "scriptpubkey": "6a5d21020704b5e1d8e1c8eeb788a30705a02d039f3e01020680dc9afd2808c7e8430a64",
      "scriptpubkey_asm": "OP_RETURN OP_PUSHNUM_13 OP_PUSHBYTES_33 020704b5e1d8e1c8eeb788a30705a02d039f3e01020680dc9afd2808c7e8430a64",
      "scriptpubkey_type": "op_return",
      "value": 0
    }
  ],
  "size": 330,
  "weight": 747,
  "fee": 673200000,
  "status": {
    "confirmed": true,
    "block_height": 840000,
    "block_hash": "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5",
    "block_time": 1713571767
  }
}
```

#### GET /tx/:txid/status {#rest-tx-status}

**Get Transaction Status**

Returns the transaction confirmation status.

Fields: `confirmed`, `block_height`, `block_hash`, `block_time`

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |

> Unknown txids return `{"confirmed":false}` with **200**, not 404. Use [Get Transaction](#rest-tx) if you need to tell "unconfirmed" from "does not exist".

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/status"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/status"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/status", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/status", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/status`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/status`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "confirmed": true,
  "block_height": 840000,
  "block_hash": "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5",
  "block_time": 1713571767
}
```

#### GET /tx/:txid/hex {#rest-tx-hex}

**Get Transaction Hex**

Returns the raw transaction serialized as a hex string (`text/plain`).

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/hex"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/hex"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/hex", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/hex", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/hex`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/hex`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
020000000001017fb9cc941aa0ca3aaf339783564d2d29ec3254a9128f5d49ad3eeb002aeb40ec0000000000000000000242342a6b000000002251203b8b3ab1453eb47e2d4903b963776680e30863df3625d3e74292338ae792…
```

#### GET /tx/:txid/raw {#rest-tx-raw}

**Get Transaction Raw**

Returns the raw transaction as binary data (`application/octet-stream`).

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |

Example (cURL, Free):
```bash
curl \
  -o tx.bin \
  "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/raw"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o tx.bin \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/raw"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/raw", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
with open("out.bin", "wb") as f:
    f.write(res.content)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/raw", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
with open("out.bin", "wb") as f:
    f.write(res.content)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/raw`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = Buffer.from(await res.arrayBuffer());
await (await import("node:fs/promises")).writeFile("out.bin", data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/raw`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = Buffer.from(await res.arrayBuffer());
await (await import("node:fs/promises")).writeFile("out.bin", data);
```

Example response (200, application/octet-stream):
```
00000000: 0200 0000 0001 017f b9cc 941a a0ca 3aaf  ..............:.
00000010: 3397 8356 4d2d 29ec 3254 a912 8f5d 49ad  3..VM-).2T...]I.
00000020: 3eeb 002a eb40 ec00 0000 0000 0000 0000  >..*.@..........
00000030: 0242 342a 6b00 0000 0022 5120 3b8b 3ab1  .B4*k...."Q ;.:.
… (330 bytes in total, binary; shown here as a hex dump: xxd tx.bin)
```

#### GET /tx/:txid/merkleblock-proof {#rest-tx-merkleblock}

**Get Transaction Merkleblock Proof** · not on Liquid

Returns a merkle inclusion proof for a confirmed transaction in bitcoind's [merkleblock](https://bitcoin.org/en/glossary/merkle-block) format (hex).

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Confirmed transaction id. |

> Not available on Liquid. Unconfirmed transactions return **404** `Transaction not found or is unconfirmed`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/merkleblock-proof"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/merkleblock-proof"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/merkleblock-proof", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/merkleblock-proof", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/merkleblock-proof`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/merkleblock-proof`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
00e05f2aab948491071265ad552351d0ad625745668da54b0172010000000000000000004f89a5d73bd4d4887f25981fe81892ccafda10c27f52d6f3dd28183a7c411b03b7072366194203177d9863eaea0b00000dcf72c298f8…
```

#### GET /tx/:txid/merkle-proof {#rest-tx-merkle}

**Get Transaction Merkle Proof**

Returns a merkle inclusion proof in the format of [Electrum's blockchain.transaction.get_merkle](#rpc-transaction-get-merkle).

Fields: `block_height`, `merkle`, `pos`

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Confirmed transaction id. |

> `merkle` lists sibling hashes from the deepest level up; `pos` is the transaction's zero-based index in the block.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/merkle-proof"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/merkle-proof"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/merkle-proof", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/merkle-proof", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/merkle-proof`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/merkle-proof`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "block_height": 840000,
  "merkle": [
    "a0db149ace545beabbd87a8d6b20ffd6aa3b5a50e58add49a3d435f898c272cf",
    "9e3dbfd868233367c0dbb0536c9089033cd9b48e50930b11b9bee6a85d73455b",
    "904441e470acbe1d55898449df9d87a2fe9a8a781c374ee047023a0f325f38a0",
    "7ee60238e9fac3cf981597b4c1de47e052716c97d520055c90db3b74d390005b",
    "… 8 more"
  ],
  "pos": 1
}
```

#### GET /tx/:txid/outspend/:vout {#rest-tx-outspend}

**Get Transaction Outspend**

Returns the spending status of one transaction output.

Fields: `spent`, `txid`, `vin`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |
| `vout` | path | integer | Output index. |

> When `spent` is false, only `{"spent":false}` is returned. `status` describes the _spending_ transaction. An output index that doesn't exist also returns `{"spent":false}` (200), so check `vout` against the transaction first.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/outspend/0"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/outspend/0"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
vout = "0"

res = requests.get(f"{BASE_URL}/tx/{txid}/outspend/{vout}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
vout = "0"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/outspend/{vout}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";
const vout = "0";

const res = await fetch(`${BASE_URL}/tx/${txid}/outspend/${vout}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";
const vout = "0";

const res = await fetch(`${BASE_URL}/tx/${txid}/outspend/${vout}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "spent": true,
  "txid": "b6eb2be2cca8771e564262d3a5a18afd03e542aeffe05670d024fd25eee3fe5e",
  "vin": 0,
  "status": {
    "confirmed": true,
    "block_height": 840029,
    "block_hash": "000000000000000000031cabcdfb991a1b8fd20a617085e6e3261979aa383a1a",
    "block_time": 1713590836
  }
}
```

#### GET /tx/:txid/outspends {#rest-tx-outspends}

**Get Transaction Outspends**

Returns the spending status of every output of the transaction, as an array in output order.

| Param | In | Type | Description |
|---|---|---|---|
| `txid` | path | hex (64) | Transaction id. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/outspends"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/tx/2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e/outspends"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"

res = requests.get(f"{BASE_URL}/tx/{txid}/outspends", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/tx/{txid}/outspends", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/outspends`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txid = "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e";

const res = await fetch(`${BASE_URL}/tx/${txid}/outspends`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "spent": true,
    "txid": "b6eb2be2cca8771e564262d3a5a18afd03e542aeffe05670d024fd25eee3fe5e",
    "vin": 0,
    "status": {
      "confirmed": true,
      "block_height": 840029,
      "block_hash": "000000000000000000031cabcdfb991a1b8fd20a617085e6e3261979aa383a1a",
      "block_time": 1713590836
    }
  },
  {
    "spent": false
  }
]
```

#### POST /tx {#rest-post-tx}

**Post Transaction**

Broadcasts a raw transaction to the network. Send the transaction **hex as the plain-text request body**. Returns the `txid` on success.

| Param | In | Type | Description |
|---|---|---|---|
| `body` | body | hex string | Raw signed transaction, hex-encoded. Max request body 1 MB. |

> Rejections return **400** with the node's error text, e.g. `sendrawtransaction RPC error -26: min relay fee not met`. The example response below shows a rejection.

> **Re-sending a confirmed transaction** fails with `-27 Transaction outputs already in utxo set` (Liquid: `Transaction already in block chain`) while any of its outputs is unspent, and with `-25 bad-txns-inputs-missingorspent` once all are spent, the same error as a double-spend. Check [GET /tx/:txid/status](#rest-tx-status) before retrying. [Broadcast rejections](#broadcast-errors)

> A legacy `GET /broadcast?tx=<hex>` form still exists for backwards compatibility. Use `POST /tx`.

Example (cURL, Free):
```bash
curl -X POST \
  -d "$TX_HEX" \
  "https://blockstream.info/api/tx"
```

Example (cURL, Enterprise):
```bash
curl -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d "$TX_HEX" \
  "https://enterprise.blockstream.info/api/tx"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
tx_hex = "0200000001…"  # signed raw transaction

res = requests.post(f"{BASE_URL}/tx", data=tx_hex, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
tx_hex = "0200000001…"  # signed raw transaction
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.post(f"{BASE_URL}/tx", headers=headers, data=tx_hex, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const txHex = "0200000001…"; // signed raw transaction

const res = await fetch(`${BASE_URL}/tx`, {
  method: "POST",
  body: txHex
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const txHex = "0200000001…"; // signed raw transaction

const res = await fetch(`${BASE_URL}/tx`, {
  method: "POST",
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  body: txHex
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Response (success) (200, text/plain):
```
2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e
```

Response (error) (400, text/plain):
```
sendrawtransaction RPC error -22: TX decode failed. Make sure the tx has at least one input.
```

#### POST /txs/package {#rest-post-package}

**Post Transaction Package** · not on Liquid

Broadcasts a package of related transactions evaluated together (e.g. CPFP: a child spending an unconfirmed parent). The body is a JSON array of transaction hex strings, parents first. Requires Bitcoin Core 28.0+ on the backend.

| Param | In | Type | Description |
|---|---|---|---|
| `body` | body | JSON array | Array of 1–25 raw transaction hex strings. |
| `maxfeerate` (optional) | query | number | Reject transactions above this fee rate (BTC/kvB), forwarded to `submitpackage`. |
| `maxburnamount` (optional) | query | number | Reject outputs that burn more than this amount (BTC). |

> **A 200 doesn't mean accepted.** Check `package_msg`: `"success"`, or `"transaction failed"` with the reason in each `tx-results[wtxid].error` (e.g. `bad-txns-inputs-missingorspent`).

> Each item must be 120–800,000 hex chars; more than 25 transactions → **400** `Exceeded maximum of 25 transactions`. Undecodable transactions return a bare **400** `RPC error`; Electrum `broadcast_package` includes the node's message.

> **Bitcoin only.** Liquid doesn't support package relay: the request fails with **400** and an upstream `Method not found` error.

Example (cURL, Free):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '["0200000001…","0200000001…"]' \
  "https://blockstream.info/api/txs/package"
```

Example (cURL, Enterprise):
```bash
curl -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '["0200000001…","0200000001…"]' \
  "https://enterprise.blockstream.info/api/txs/package"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.post(f"{BASE_URL}/txs/package", json=["0200000001…", "0200000001…"], timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.post(f"{BASE_URL}/txs/package", headers=headers, json=["0200000001…", "0200000001…"], timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/txs/package`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(["0200000001…", "0200000001…"])
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/txs/package`, {
  method: "POST",
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, "Content-Type": "application/json" },
  body: JSON.stringify(["0200000001…", "0200000001…"])
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Response (success) (200, application/json):
```json
{
  "package_msg": "success",
  "tx-results": {
    "<wtxid>": {
      "txid": "<txid>",
      "vsize": 141,
      "fees": {
        "base": 0.000005,
        "effective-feerate": 0.000025,
        "effective-includes": [
          "<wtxid>"
        ]
      }
    }
  },
  "replaced-transactions": []
}
```

Response (error) (400, text/plain):
```
RPC error
```

### Addresses

#### GET /address/:address {#rest-address}

**Get Address**

Returns statistics for an address (or script hash): funded/spent output counts and sums, for confirmed (`chain_stats`) and unconfirmed (`mempool_stats`) activity.

Also: `GET /scripthash/:scripthash`

Fields: `address`, `chain_stats`, `mempool_stats`

`/scripthash/:scripthash` returns a `scripthash` field instead of `address`. Each `*_stats` object has `tx_count`, `funded_txo_count`, `funded_txo_sum`, `spent_txo_count`, `spent_txo_sum`. Balance = `funded_txo_sum − spent_txo_sum`.

| Param | In | Type | Description |
|---|---|---|---|
| `address` | path | string | An address valid for the selected network. |

> **Script hash byte order.** On REST, `:hash` is `sha256(scriptPubKey)` in normal hex. Electrum RPC uses the **byte-reversed** hex. A reversed hash on REST silently returns an empty result. [See the worked example.](#scripthash)

> Liquid omits `funded_txo_sum`/`spent_txo_sum`: amounts are confidential, so the server can't add them up. To get a balance, fetch the address's transactions, unblind your outputs with your blinding keys, and sum them per asset. [LWK](#lwk) does this for you.

> An address for another network returns **400** `Address on invalid network`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"

res = requests.get(f"{BASE_URL}/address/{address}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address/{address}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
  "chain_stats": {
    "funded_txo_count": 117,
    "funded_txo_sum": 17997427,
    "spent_txo_count": 1,
    "spent_txo_sum": 14293,
    "tx_count": 118
  },
  "mempool_stats": {
    "funded_txo_count": 0,
    "funded_txo_sum": 0,
    "spent_txo_count": 0,
    "spent_txo_sum": 0,
    "tx_count": 0
  }
}
```

#### GET /address/:address/txs {#rest-address-txs}

**Get Address Transactions**

Returns transaction history, newest first: **up to 50 mempool transactions plus the first 25 confirmed** transactions. Page further with [Get Address Transactions Chain](#rest-address-txs-chain).

Also: `GET /scripthash/:scripthash/txs`

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `address` | path | string | Address. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"

res = requests.get(f"{BASE_URL}/address/{address}/txs", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address/{address}/txs", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "efeb2d7d43c20f81d38bbc74447e71de0fe12150845bb27f51c7d59ee6b8d131",
    "version": 1,
    "locktime": 0,
    "vin": [
      {
        "txid": "93ff65e8102e19bd1582eb9316d19cd64095aede4bcc8938cdb893a15bf1aa23",
        "vout": 14,
        "prevout": {
          "scriptpubkey": "0014f9bcff4f09f3be601f0873c6c7791db5992a4047",
          "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 f9bcff4f09f3be601f0873c6c7791db5992a4047",
          "scriptpubkey_type": "v0_p2wpkh",
          "scriptpubkey_address": "bc1qlx707ncf7wlxq8cgw0rvw7gakkvj5sz8eq7e6q",
          "value": 17454
        },
        "scriptsig": "",
        "scriptsig_asm": "",
        "witness": [
          "304402204de918429625e1985d5854eca6074189a4d1f6da754524bd05f6ad234bee516d02203838868cdd5ea5342da04ea6a35939dc06336871a98044d0792eb223b5e7555401",
          "… 1 more"
        ],
        "is_coinbase": false,
        "sequence": 4294967293
      }
    ],
    "vout": [
      {
        "scriptpubkey": "0014e8df018c7e326cc253faac7e46cdc51e68542c42",
        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 e8df018c7e326cc253faac7e46cdc51e68542c42",
        "scriptpubkey_type": "v0_p2wpkh",
        "scriptpubkey_address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        "value": 5905
      },
      "… 1 more"
    ],
    "size": 222,
    "weight": 561,
    "fee": 146,
    "status": {
      "confirmed": true,
      "block_height": 969728,
      "block_hash": "0000000000000000000150443e753415f20a699d7521045086783430dc9b5388",
      "block_time": 1791029141
    }
  },
  "… 24 more"
]
```

#### GET /address/:address/txs/chain[/:last_seen_txid] {#rest-address-txs-chain}

**Get Address Transactions Chain**

Returns confirmed history, newest first, **25 per page**. To get the next page, pass the `txid` of the last transaction you received as `:last_seen_txid`. An empty array means you've reached the end.

Also: `GET /scripthash/:scripthash/txs/chain[/:last_seen_txid]`

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `address` | path | string | Address. |
| `last_seen_txid` (optional) | path | hex (64) | Last txid from the previous page. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs/chain"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs/chain"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"

res = requests.get(f"{BASE_URL}/address/{address}/txs/chain", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address/{address}/txs/chain", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs/chain`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs/chain`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "efeb2d7d43c20f81d38bbc74447e71de0fe12150845bb27f51c7d59ee6b8d131",
    "version": 1,
    "locktime": 0,
    "vin": [
      {
        "txid": "93ff65e8102e19bd1582eb9316d19cd64095aede4bcc8938cdb893a15bf1aa23",
        "vout": 14,
        "prevout": {
          "scriptpubkey": "0014f9bcff4f09f3be601f0873c6c7791db5992a4047",
          "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 f9bcff4f09f3be601f0873c6c7791db5992a4047",
          "scriptpubkey_type": "v0_p2wpkh",
          "scriptpubkey_address": "bc1qlx707ncf7wlxq8cgw0rvw7gakkvj5sz8eq7e6q",
          "value": 17454
        },
        "scriptsig": "",
        "scriptsig_asm": "",
        "witness": [
          "304402204de918429625e1985d5854eca6074189a4d1f6da754524bd05f6ad234bee516d02203838868cdd5ea5342da04ea6a35939dc06336871a98044d0792eb223b5e7555401",
          "… 1 more"
        ],
        "is_coinbase": false,
        "sequence": 4294967293
      }
    ],
    "vout": [
      {
        "scriptpubkey": "0014e8df018c7e326cc253faac7e46cdc51e68542c42",
        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 e8df018c7e326cc253faac7e46cdc51e68542c42",
        "scriptpubkey_type": "v0_p2wpkh",
        "scriptpubkey_address": "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
        "value": 5905
      },
      "… 1 more"
    ],
    "size": 222,
    "weight": 561,
    "fee": 146,
    "status": {
      "confirmed": true,
      "block_height": 969728,
      "block_hash": "0000000000000000000150443e753415f20a699d7521045086783430dc9b5388",
      "block_time": 1791029141
    }
  },
  "… 24 more"
]
```

#### GET /address/:address/txs/mempool {#rest-address-txs-mempool}

**Get Address Transactions Mempool**

Returns unconfirmed transactions for the address: up to 50, no paging.

Also: `GET /scripthash/:scripthash/txs/mempool`

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `address` | path | string | Address. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs/mempool"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/txs/mempool"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"

res = requests.get(f"{BASE_URL}/address/{address}/txs/mempool", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address/{address}/txs/mempool", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs/mempool`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/txs/mempool`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[]
```

#### GET /address/:address/utxo {#rest-address-utxo}

**Get Address UTXO**

Returns the unspent outputs of the address, including unconfirmed ones.

Also: `GET /scripthash/:scripthash/utxo`

Fields: `txid`, `vout`, `value`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `address` | path | string | Address. |

> Busy addresses can be rejected with **400**, and the result isn't paginated. **Free** limits the number of UTXOs: `Too many unspent outputs` (the genesis address fails; an address with 1,253 UTXOs is served). **Enterprise** has two limits: a long history returns `Scripthash history too large to scan` even when there are few UTXOs (an exchange address with 2.37 million transactions and 19 UTXOs fails), and many UTXOs return `Too many unspent outputs` (1,253 UTXOs fails). Handle the 400 status, not the text. On Bitcoin mainnet the address's stats and `/txs` history still work, so you can rebuild the UTXO set from the history. On Testnet3, very busy addresses are refused there too (see [Common pitfalls](#gotchas)).

> Liquid: `valuecommitment` may appear instead of `value`, plus `asset`/`assetcommitment`, `noncecommitment`, `surjection_proof` and `range_proof`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/utxo"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address/bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq/utxo"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"

res = requests.get(f"{BASE_URL}/address/{address}/utxo", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address/{address}/utxo", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/utxo`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const address = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";

const res = await fetch(`${BASE_URL}/address/${address}/utxo`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "fc97dd48729220f1417ee95af118fa0839dc3080ddc962c1cc9a654800cfc63b",
    "vout": 0,
    "status": {
      "confirmed": true,
      "block_height": 890893,
      "block_hash": "00000000000000000000900128aedfdc50dccb846b7d0c2734e133e77dde9f58",
      "block_time": 1743775029
    },
    "value": 60301
  },
  {
    "txid": "7376089ab5408fa2f66c780bdd6bfc3638431453e785c60917ba8e0d2591d4a6",
    "vout": 0,
    "status": {
      "confirmed": true,
      "block_height": 947895,
      "block_hash": "0000000000000000000215d07246061ca069c7389f1125e224e739e701159ee7",
      "block_time": 1777912259
    },
    "value": 100000
  },
  "… 114 more"
]
```

#### GET /address-prefix/:prefix {#rest-address-prefix}

**Get Address Prefix**

Searches for addresses beginning with `:prefix` and returns up to 10 matches.

| Param | In | Type | Description |
|---|---|---|---|
| `prefix` | path | string | Address prefix. |

> **Disabled on Blockstream-hosted APIs** (free and Enterprise), except **Free Signet**: returns **400** `address search disabled`. Otherwise available only on self-hosted Esplora with address search enabled.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/address-prefix/bc1qar0s"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/address-prefix/bc1qar0s"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
prefix = "bc1qar0s"

res = requests.get(f"{BASE_URL}/address-prefix/{prefix}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
prefix = "bc1qar0s"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/address-prefix/{prefix}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const prefix = "bc1qar0s";

const res = await fetch(`${BASE_URL}/address-prefix/${prefix}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const prefix = "bc1qar0s";

const res = await fetch(`${BASE_URL}/address-prefix/${prefix}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (400, text/plain):
```
address search disabled
```

### Blocks

#### GET /block/:hash {#rest-block}

**Get Block**

Returns information about a block. Cacheable indefinitely.

Fields: `id`, `height`, `version`, `timestamp`, `mediantime`, `bits`, `nonce`, `difficulty`, `merkle_root`, `tx_count`, `size`, `weight`, `previousblockhash`

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |

> Liquid blocks have an `ext` object (dynamic federation / signblock data) and no `bits`, `nonce` or `difficulty`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "id": "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5",
  "height": 840000,
  "version": 710926336,
  "timestamp": 1713571767,
  "tx_count": 3050,
  "size": 2325617,
  "weight": 3993281,
  "merkle_root": "031b417c3a1828ddf3d6527fc210daafcc9218e81f98257f88d4d43bd7a5894f",
  "previousblockhash": "0000000000000000000172014ba58d66455762add0512355ad651207918494ab",
  "mediantime": 1713570208,
  "nonce": 3932395645,
  "bits": 386089497,
  "difficulty": 86388558925171.02
}
```

#### GET /block/:hash/header {#rest-block-header}

**Get Block Header**

Returns the hex-encoded block header.

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/header"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/header"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}/header", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/header", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/header`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/header`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
00e05f2aab948491071265ad552351d0ad625745668da54b0172010000000000000000004f89a5d73bd4d4887f25981fe81892ccafda10c27f52d6f3dd28183a7c411b03b7072366194203177d9863ea
```

#### GET /block/:hash/status {#rest-block-status}

**Get Block Status**

Returns whether the block is in the best chain, its height and the next block's hash.

Fields: `in_best_chain`, `height`, `next_best`

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |

> `in_best_chain` is false for orphaned (stale) blocks. `next_best` is `null` for the tip and for stale blocks.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/status"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/status"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}/status", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/status", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/status`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/status`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "in_best_chain": true,
  "height": 840000,
  "next_best": "00000000000000000001b48a75d5a3077913f3f441eb7e08c13c43f768db2463"
}
```

#### GET /block/:hash/txs[/:start_index] {#rest-block-txs}

**Get Block Transactions**

Returns up to **25 transactions** of the block, starting at `start_index`.

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |
| `start_index` (optional) | path | integer | Offset; must be a multiple of 25. |

> `start_index` must be a multiple of 25, otherwise **400** `start index must be a multiple of 25`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txs"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txs"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}/txs", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/txs", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/txs`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/txs`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "a0db149ace545beabbd87a8d6b20ffd6aa3b5a50e58add49a3d435f898c272cf",
    "version": 1,
    "locktime": 0,
    "vin": [
      {
        "txid": "0000000000000000000000000000000000000000000000000000000000000000",
        "vout": 4294967295,
        "prevout": null,
        "scriptsig": "0340d10c192f5669614254432f4d696e65642062792062757a7a3132302f2cfabe6d6d144b553283a6e1a150c9989428c0695e3a1bef7d482ed1f829bbe25897fd37dc10000000000000001058a4c9000cc3a31889b38ae08249…",
        "scriptsig_asm": "OP_PUSHBYTES_3 40d10c OP_PUSHBYTES_25 2f5669614254432f4d696e65642062792062757a7a3132302f OP_PUSHBYTES_44 fabe6d6d144b553283a6e1a150c9989428c0695e3a1bef7d482ed1f829bbe25897fd37dc100…",
        "witness": [
          "0000000000000000000000000000000000000000000000000000000000000000"
        ],
        "is_coinbase": true,
        "sequence": 4294967295
      }
    ],
    "vout": [
      {
        "scriptpubkey": "76a914536ffa992491508dca0354e52f32a3a7a679a53a88ac",
        "scriptpubkey_asm": "OP_DUP OP_HASH160 OP_PUSHBYTES_20 536ffa992491508dca0354e52f32a3a7a679a53a OP_EQUALVERIFY OP_CHECKSIG",
        "scriptpubkey_type": "p2pkh",
        "scriptpubkey_address": "18cBEMRxXHqzWWCxZNtU91F5sbUNKhL5PX",
        "value": 4075061499
      },
      "… 2 more"
    ],
    "size": 316,
    "weight": 1156,
    "fee": 0,
    "status": {
      "confirmed": true,
      "block_height": 840000,
      "block_hash": "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5",
      "block_time": 1713571767
    }
  },
  "… 24 more"
]
```

#### GET /block/:hash/txids {#rest-block-txids}

**Get Block Txids**

Returns all txids in the block, in block order.

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txids"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txids"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}/txids", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/txids", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/txids`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/txids`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  "a0db149ace545beabbd87a8d6b20ffd6aa3b5a50e58add49a3d435f898c272cf",
  "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",
  "152b928e97bb9e874da1bd4abdf766ae0cdc7a2f260dad5542967cb414c58489",
  "… 3047 more"
]
```

#### GET /block/:hash/txid/:index {#rest-block-txid}

**Get Block Txid by Index**

Returns the txid at position `:index` within the block.

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |
| `index` | path | integer | Zero-based position (0 = coinbase). |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txid/1"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/txid/1"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
index = "1"

res = requests.get(f"{BASE_URL}/block/{hash}/txid/{index}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
index = "1"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/txid/{index}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";
const index = "1";

const res = await fetch(`${BASE_URL}/block/${hash}/txid/${index}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";
const index = "1";

const res = await fetch(`${BASE_URL}/block/${hash}/txid/${index}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e
```

#### GET /block/:hash/raw {#rest-block-raw}

**Get Block Raw**

Returns the raw block in binary (`application/octet-stream`).

| Param | In | Type | Description |
|---|---|---|---|
| `hash` | path | hex (64) | Block hash. |

Example (cURL, Free):
```bash
curl \
  -o block.bin \
  "https://blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/raw"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -o block.bin \
  "https://enterprise.blockstream.info/api/block/0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5/raw"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"

res = requests.get(f"{BASE_URL}/block/{hash}/raw", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
with open("out.bin", "wb") as f:
    f.write(res.content)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block/{hash}/raw", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
with open("out.bin", "wb") as f:
    f.write(res.content)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/raw`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = Buffer.from(await res.arrayBuffer());
await (await import("node:fs/promises")).writeFile("out.bin", data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const hash = "0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5";

const res = await fetch(`${BASE_URL}/block/${hash}/raw`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = Buffer.from(await res.arrayBuffer());
await (await import("node:fs/promises")).writeFile("out.bin", data);
```

Example response (200, application/octet-stream):
```
00000000: 00e0 5f2a ab94 8491 0712 65ad 5523 51d0  .._*......e.U#Q.
00000010: ad62 5745 668d a54b 0172 0100 0000 0000  .bWEf..K.r......
00000020: 0000 0000 4f89 a5d7 3bd4 d488 7f25 981f  ....O...;....%..
00000030: e818 92cc afda 10c2 7f52 d6f3 dd28 183a  .........R...(.:
… (2,325,617 bytes in total, binary; shown here as a hex dump: xxd block.bin)
```

#### GET /block-height/:height {#rest-block-height}

**Get Block Hash by Height**

Returns the hash of the block currently at `height` in the best chain.

| Param | In | Type | Description |
|---|---|---|---|
| `height` | path | integer | Block height. |

> Recent heights can change on a reorg; responses for blocks with fewer than 10 confirmations are only cached for 10 s.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block-height/840000"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block-height/840000"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"
height = "840000"

res = requests.get(f"{BASE_URL}/block-height/{height}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
height = "840000"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block-height/{height}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";
const height = "840000";

const res = await fetch(`${BASE_URL}/block-height/${height}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const height = "840000";

const res = await fetch(`${BASE_URL}/block-height/${height}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
0000000000000000000320283a032748cef8227873ff4872689bf23f1cda83a5
```

#### GET /blocks[/:start_height] {#rest-blocks}

**Get Blocks**

Returns the 10 newest blocks, or 10 blocks going down from `start_height`.

Fields: `id`, `height`, `version`, `timestamp`, `mediantime`, `bits`, `nonce`, `difficulty`, `merkle_root`, `tx_count`, `size`, `weight`, `previousblockhash`

| Param | In | Type | Description |
|---|---|---|---|
| `start_height` (optional) | path | integer | Height to start from (descending). |

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/blocks"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/blocks"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/blocks", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/blocks", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/blocks`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/blocks`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "id": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
    "height": 971407,
    "version": 565190656,
    "timestamp": 1791982778,
    "tx_count": 1281,
    "size": 496980,
    "weight": 1234719,
    "merkle_root": "e245f9f47d41b99a2f9c35d6290b221f10398dd229af57e26cfdbe7a52a3d42a",
    "previousblockhash": "00000000000000000001683456a25f022a1b10007155003472367c9e3a58f810",
    "mediantime": 1791980417,
    "nonce": 4185016041,
    "bits": 386014960,
    "difficulty": 132716002350731.27
  },
  "… 9 more"
]
```

#### GET /blocks/tip/height {#rest-blocks-tip-height}

**Get Tip Height**

Returns the height of the last block.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/blocks/tip/height"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/blocks/tip/height"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/blocks/tip/height", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/blocks/tip/height", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/blocks/tip/height`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/blocks/tip/height`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```json
971407
```

#### GET /blocks/tip/hash {#rest-blocks-tip-hash}

**Get Tip Hash**

Returns the hash of the last block.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/blocks/tip/hash"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/blocks/tip/hash"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/blocks/tip/hash", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/blocks/tip/hash", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/blocks/tip/hash`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/blocks/tip/hash`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57
```

### Mempool

#### GET /mempool {#rest-mempool}

**Get Mempool**

Returns mempool backlog statistics.

Fields: `count`, `vsize`, `total_fee`, `fee_histogram`

`fee_histogram` is an array of `[feerate, vsize]` pairs (sat/vB, vbytes), highest fee rate first. Each entry's `vsize` is the total size of transactions paying more than `feerate` but less than the previous entry's rate. Same format as [Electrum's mempool.get_fee_histogram](#rpc-mempool-get-fee-histogram).

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/mempool"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/mempool"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/mempool", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/mempool", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/mempool`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/mempool`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "count": 66510,
  "vsize": 33626464,
  "total_fee": 5904258,
  "fee_histogram": [
    [
      4.534971644612476,
      50502
    ],
    [
      2.9587073608617596,
      50393
    ],
    [
      2.047145784263036,
      56526
    ],
    [
      1.9102333931777378,
      51898
    ],
    "… 158 more"
  ]
}
```

#### GET /mempool/txids {#rest-mempool-txids}

**Get Mempool Txids**

Returns every txid in the mempool. Order is arbitrary and differs from bitcoind's.

> This response is large (tens of thousands of txids, several MB) and counts against your Enterprise credits like any other call. Prefer [Get Mempool Recent](#rest-mempool-recent) for dashboards.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/mempool/txids"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/mempool/txids"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/mempool/txids", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/mempool/txids", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/mempool/txids`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/mempool/txids`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  "071e34248bab2883fa7fc50ff1380beabf99f2ceedeb45efbe38b8fe999a54e6",
  "0e41de192dbafd583850814ceb0b374674c42d73a3f4683c7cb89ecb7dbb96c6",
  "bb5a8a9bfa269729de5176250318b27c5e2b47d090e201edb602a85adf6c38cf",
  "… 66530 more"
]
```

#### GET /mempool/recent {#rest-mempool-recent}

**Get Mempool Recent**

Returns the last 10 transactions to enter the mempool, as summaries.

Fields: `txid`, `fee`, `vsize`, `value`

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/mempool/recent"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/mempool/recent"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/mempool/recent", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/mempool/recent", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/mempool/recent`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/mempool/recent`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "8ad52601cda1d9d4214d6bdc4ce7492cb9035be90b05efa037bb7d529c72ecf9",
    "fee": 465,
    "vsize": 209,
    "value": 151307
  },
  {
    "txid": "e3276212b66be6ff278bdbde88d5a3b7249ac627379bb390652a1b13c40a51f2",
    "fee": 380,
    "vsize": 218,
    "value": 368321
  },
  "… 8 more"
]
```

### Fee Estimates

#### GET /fee-estimates {#rest-fee-estimates}

**Get Fee Estimates**

Returns an object mapping a confirmation target (in blocks) to an estimated fee rate in **sat/vB**. Targets: 1–25, 144, 504 and 1008.

> Keys are strings and arrive unordered. Parse them as integers and sort before choosing a target.

> Targets can be missing when the node has too little data: test networks often return only `144`, `504` and `1008`. Fall back to the nearest available target.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/fee-estimates"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/fee-estimates"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/fee-estimates", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/fee-estimates", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/fee-estimates`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/fee-estimates`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "1": 1.0030000000000001,
  "2": 1.0030000000000001,
  "3": 1.0030000000000001,
  "4": 0.301,
  "5": 0.301,
  "6": 0.301,
  "7": 0.273,
  "8": 0.273,
  "9": 0.259,
  "10": 0.259,
  "11": 0.259,
  "12": 0.259,
  "13": 0.259,
  "14": 0.259,
  "15": 0.259,
  "16": 0.259,
  "17": 0.259,
  "18": 0.259,
  "19": 0.259,
  "20": 0.259,
  "21": 0.259,
  "22": 0.259,
  "23": 0.259,
  "24": 0.259,
  "25": 0.259,
  "144": 0.222,
  "504": 0.222,
  "1008": 0.09999999999999999
}
```

### Mining

#### GET /block-template {#rest-block-template}

**Get Block Template**

Returns the node's [getblocktemplate](https://developer.bitcoin.org/reference/rpc/getblocktemplate.html) response (template mode) for mining.

> Cached server-side for up to 15 s and refreshed on every new tip. Responses carry `Cache-Control: no-store`. If the node fails, you get **502** with a JSON `error` object.

Example (cURL, Free):
```bash
curl "https://blockstream.info/api/block-template"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/block-template"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/api"

res = requests.get(f"{BASE_URL}/block-template", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/block-template", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/api";

const res = await fetch(`${BASE_URL}/block-template`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/block-template`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200):
```json
{
  "bits": "17021ef0",
  "capabilities": [
    "proposal"
  ],
  "coinbaseaux": {},
  "coinbasevalue": 313672870,
  "curtime": 1791982988,
  "default_witness_commitment": "6a24aa21a9ed0da2c4a862b5a990e7a19f6d0a9702c7dc0a1e21193175ca74d951a125…",
  "height": 971408,
  "longpollid": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57795940…",
  "mintime": 1791980418,
  "mutable": [
    "time",
    "… 2 more"
  ],
  "noncerange": "00000000ffffffff",
  "previousblockhash": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
  "rules": [
    "csv",
    "… 2 more"
  ],
  "sigoplimit": 80000,
  "sizelimit": 4000000,
  "target": "000000000000000000021ef00000000000000000000000000000000000000000",
  "transactions": [
    "… 5683 transactions"
  ],
  "vbavailable": {},
  "vbrequired": 0,
  "version": 536870912,
  "weightlimit": 4000000
}
```

### Assets

#### GET /asset/:asset_id {#rest-asset}

**Get Asset** · Liquid only

Returns information about a Liquid asset. The native asset (L-BTC) returns peg and burn statistics. Issued assets return issuance details and stats and, when registered, their metadata from the Blockstream Asset Registry: `name`, `ticker`, `precision`, `entity`, `contract` and the full `registry` record.

Fields: `asset_id`, `issuance_txin`, `issuance_prevout`, `status`, `contract_hash`, `reissuance_token`, `chain_stats`, `mempool_stats`, `contract`, `entity`, `name`, `ticker`, `precision`, `registry`, `registry_status`

| Param | In | Type | Description |
|---|---|---|---|
| `asset_id` | path | hex (64) | Asset id. |

> **Native asset (L-BTC) ids:** mainnet `6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d`, testnet `144c654344aa716d6f3abcc1ca90e5641e4e2a7f633bc09fe3baf64585819a49`. Its response has a different shape: `asset_id` plus `chain_stats`/`mempool_stats` with `tx_count`, `peg_in_count`, `peg_in_amount`, `peg_out_count`, `peg_out_amount`, `burn_count`, `burned_amount` (no issuance fields).

> `issued_amount` is a lower bound when `has_blinded_issuances` is true.

> **The `registry` object** holds the asset's registry record: `current_issuer_pubkey` and `issuer_pubkey_history` (issuer keys can be rotated), `mutable` (`category_tags`, `trading_venues`, `custom`), `admin` (`delisted`, `malicious`, `featured`, `asset_type`), `icon` (an object with the PNG's `href`, or `null`), `status`, `created_at` and `updated_at`.

> Check `registry.admin.malicious` and `registry.admin.delisted` before showing an asset's name, ticker or icon to your users.

> **Version 2 contracts** (`contract.version` `2`) have `initial_issuer_pubkey` instead of `issuer_pubkey`. To get the issuer's key for any contract version, read `registry.current_issuer_pubkey`.

> **`registry_status`**, also sent in the `X-Asset-Registry-Status` header: `available`; `stale` (normal: the server answered from its cached copy of the metadata, usually seconds old, while it refreshes it from the registry; during a registry outage the copy is the last one it fetched); `not_found` (the asset isn't registered: no `contract`, `name`, `ticker` or `registry`); `unavailable` (the registry couldn't be reached: chain data only). When the status isn't `available`, the response is sent with `Cache-Control: no-store`. L-BTC has no registry fields.

Example (cURL, Free):
```bash
curl "https://blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"

res = requests.get(f"{BASE_URL}/asset/{asset_id}", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/asset/{asset_id}", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/liquid/api";
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/liquid/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "asset_id": "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2",
  "issuance_txin": {
    "txid": "abb4080d91849e933ee2ed65da6b436f7c385cf363fb4aa08399f1e27c58ff3d",
    "vin": 0
  },
  "issuance_prevout": {
    "txid": "9596d259270ef5bac0020435e6d859aea633409483ba64e232b8ba04ce288668",
    "vout": 0
  },
  "reissuance_token": "59fe4d2127ba9f16bd6850a3e6271a166e7ed2e1669f6c107d655791c94ee98f",
  "contract_hash": "3c7f0a53c2ff5b99590620d7f6604a7a3a7bfbaaa6aa61f7bfc7833ca03cde82",
  "status": {
    "confirmed": true,
    "block_height": 365526,
    "block_hash": "24b1250f84c63d6232a33903bedc558e9ee0dabe44f5a02907c475362e77d270",
    "block_time": 1561718158
  },
  "chain_stats": {
    "tx_count": 13,
    "issuance_count": 12,
    "issued_amount": 9756160000000000,
    "burned_amount": 50000000000,
    "has_blinded_issuances": false,
    "reissuance_tokens": 1,
    "burned_reissuance_tokens": 0
  },
  "mempool_stats": {
    "tx_count": 0,
    "issuance_count": 0,
    "issued_amount": 0,
    "burned_amount": 0,
    "has_blinded_issuances": false,
    "reissuance_tokens": null,
    "burned_reissuance_tokens": 0
  },
  "contract": {
    "entity": {
      "domain": "tether.to"
    },
    "issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
    "name": "Tether USD",
    "precision": 8,
    "ticker": "USDt",
    "version": 0
  },
  "entity": {
    "domain": "tether.to"
  },
  "precision": 8,
  "name": "Tether USD",
  "ticker": "USDt",
  "registry": {
    "asset_id": "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2",
    "contract": {
      "entity": {
        "domain": "tether.to"
      },
      "issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
      "name": "Tether USD",
      "precision": 8,
      "ticker": "USDt",
      "version": 0
    },
    "initial_issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
    "initial_issuer_pubkey_source": "registry_registration",
    "current_issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
    "issuer_pubkey_history": [
      {
        "pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
        "valid_from_audit_id": 30,
        "valid_until_audit_id": null
      }
    ],
    "mutable": {
      "category_tags": [],
      "custom": {},
      "trading_venues": []
    },
    "admin": {
      "admin_notes": null,
      "asset_type": null,
      "delisted": false,
      "featured": false,
      "last_admin_action": null,
      "malicious": false
    },
    "icon": {
      "href": "https://assets.blockstream.info/v2/assets/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/icon/4848c0baa5e76c13694e9781a204240a85c6f236a13c7e66015a1ab4356b7fcd.png"
    },
    "status": "active",
    "created_at": "2026-07-16T15:08:27.774628Z",
    "updated_at": "2026-08-17T15:35:14.442979Z",
    "issuance_prevout": {
      "txid": "9596d259270ef5bac0020435e6d859aea633409483ba64e232b8ba04ce288668",
      "vout": 0
    },
    "issuance_txin": {
      "txid": "abb4080d91849e933ee2ed65da6b436f7c385cf363fb4aa08399f1e27c58ff3d",
      "vin": 0
    }
  },
  "registry_status": "available"
}
```

Native asset (L-BTC) (200, application/json):
```json
{
  "asset_id": "6f0279e9ed041c3d710a9f57d0c02928416460c4b722ae3457a11eec381c526d",
  "chain_stats": {
    "tx_count": 128700,
    "peg_in_count": 117346,
    "peg_in_amount": 1838758482936,
    "peg_out_count": 10414,
    "peg_out_amount": 1414279839199,
    "burn_count": 987,
    "burned_amount": 1002779324
  },
  "mempool_stats": {
    "tx_count": 0,
    "peg_in_count": 0,
    "peg_in_amount": 0,
    "peg_out_count": 0,
    "peg_out_amount": 0,
    "burn_count": 0,
    "burned_amount": 0
  }
}
```

#### GET /asset/:asset_id/txs {#rest-asset-txs}

**Get Asset Transactions** · Liquid only

Returns issuance, reissuance and burn transactions for an issued asset, or peg-in, peg-out and burn transactions for L-BTC. **Ordinary transfers are not included.** Also available: `/asset/:asset_id/txs/mempool` and `/asset/:asset_id/txs/chain[/:last_seen]` (25 per page).

Fields: `txid`, `version`, `locktime`, `size`, `weight`, `fee`, `vin`, `vout`, `status`

| Param | In | Type | Description |
|---|---|---|---|
| `asset_id` | path | hex (64) | Asset id. |

Example (cURL, Free):
```bash
curl "https://blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/txs"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/txs"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"

res = requests.get(f"{BASE_URL}/asset/{asset_id}/txs", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/asset/{asset_id}/txs", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/liquid/api";
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}/txs`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/liquid/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}/txs`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "txid": "edc743d0913474c98fd2eb3aeec09062d1f080fe945fb4beeedf6e0f9629fbaa",
    "version": 2,
    "locktime": 0,
    "vin": [
      {
        "txid": "5461db457c284287879e70174fb8b35b240373b09e4b31f3cda4a7575d7bab93",
        "vout": 2,
        "prevout": {
          "scriptpubkey": "0020c1c2bbc72e462f23cb2b334dcc7af69938d934935d83413ab81c8c0c86d6c6ef",
          "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_32 c1c2bbc72e462f23cb2b334dcc7af69938d934935d83413ab81c8c0c86d6c6ef",
          "scriptpubkey_type": "v0_p2wsh",
          "scriptpubkey_address": "ex1qc8pth3ewgchj8jetxdxuc7hknyudjdyntkp5zw4crjxqepkkcmhsgsdh45",
          "valuecommitment": "0879cd2cbad752aa7d21cc65e8715780c8af383710a2b8a8302177c8e6391df523",
          "assetcommitment": "0bef228b2ad0d0409492b8e1db035fa67edd542549cba153e03c8bfe7af907d35a"
        },
        "scriptsig": "",
        "scriptsig_asm": "",
        "witness": [
          "",
          "… 3 more"
        ],
        "is_coinbase": false,
        "sequence": 4294967295,
        "inner_witnessscript_asm": "OP_PUSHNUM_2 OP_PUSHBYTES_33 023a8bc1b241f8f1d256771e4bc686fa5a9faf08e8fa090579e824af458eb9d877 OP_PUSHBYTES_33 033c79ab5522c9ec6fd5ce5524e4d20dcf9aec20de7a5e801f9841a3877c42ef02 O…",
        "is_pegin": false
      },
      "… 1 more"
    ],
    "vout": [
      {
        "scriptpubkey": "002067aa2928891030b56b93f395d1bc8b73ffe7386723753438f3f7af3a27bf4445",
        "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_32 67aa2928891030b56b93f395d1bc8b73ffe7386723753438f3f7af3a27bf4445",
        "scriptpubkey_type": "v0_p2wsh",
        "scriptpubkey_address": "ex1qv74zj2yfzqct26un7w2ar0ytw0l7wwr8yd6ngw8n77hn5falg3zs42q3ce",
        "valuecommitment": "097c46905061b7a2dd382fef28103ebf1735477ed265031c92c65c679878076700",
        "assetcommitment": "0a67724ee381973f6b151495bcd860c9c3fca5c2df407d2dcdd26bc44ccdbf8316"
      },
      "… 3 more"
    ],
    "size": 14043,
    "weight": 15849,
    "fee": 57,
    "status": {
      "confirmed": true,
      "block_height": 3419139,
      "block_hash": "cd95edde05d318c1919a6986898a0133d7f9fc1a4f1e8f964f4ca6de089c025f",
      "block_time": 1750164490
    },
    "discount_vsize": 564,
    "discount_weight": 2256
  },
  "… 12 more"
]
```

#### GET /asset/:asset_id/supply[/decimal] {#rest-asset-supply}

**Get Asset Supply** · Liquid only

Returns the current circulating supply in base units, or with `/decimal` as a decimal adjusted for the asset's registered precision (the response also carries `X-Asset-Registry-Status`).

| Param | In | Type | Description |
|---|---|---|---|
| `asset_id` | path | hex (64) | Asset id. |

> Not available for assets with blinded issuances: **400** `Asset supply is blinded`.

Example (cURL, Free):
```bash
curl "https://blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/supply"
```

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/liquid/api/asset/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/supply"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"

res = requests.get(f"{BASE_URL}/asset/{asset_id}/supply", timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.text)
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/liquid/api"
asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/asset/{asset_id}/supply", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/liquid/api";
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}/supply`);
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.text();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/liquid/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const asset_id = "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2";

const res = await fetch(`${BASE_URL}/asset/${asset_id}/supply`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```json
9756110000000000
```

#### GET /assets/registry {#rest-assets-registry}

**Get Asset Registry** · Liquid only

Lists the assets registered in the Blockstream Asset Registry. Each item has the same fields as [Get Asset](#rest-asset), including `registry` (but no `registry_status`). Filter and sort with the query parameters below. The number of matching assets is returned in the `X-Total-Results` header (exposed to browsers via CORS on the free API).

| Param | In | Type | Description |
|---|---|---|---|
| `start_index` (optional) | query | integer | Paging offset. Default 0. |
| `limit` (optional) | query | integer | Page size. Default 25, max 100 (larger values are capped). |
| `sort` (optional) | query | string | `<field>_asc` or `<field>_desc`, where the field is `asset_id`, `name`, `ticker`, `domain`, `created_at` or `updated_at`. Example: `sort=updated_at_desc`. Default: by ticker, ascending. |
| `sort_field` (optional) | query | string | Older form of `sort`: `name`, `ticker` (default) or `domain`. |
| `sort_dir` (optional) | query | string | `asc` (default) or `desc`. Used with `sort_field`. |
| `ticker` (optional) | query | string | Ticker prefix, case-insensitive. Example: `USD`. |
| `name` (optional) | query | string | Name prefix, case-insensitive. |
| `asset_id` (optional) | query | hex | Asset id prefix. |
| `domain` (optional) | query | string | Issuer domain, exact match. Example: `tether.to`. |
| `category_tag` (optional) | query | string | Only assets with this category tag. |
| `trading_venue` (optional) | query | string | Only assets listed on this trading venue. |
| `asset_type` (optional) | query | string | Only assets of this type. |
| `created_after` (optional) | query | RFC 3339 | Only assets registered after this time. Example: `2026-08-01T00:00:00Z`. |
| `updated_after` (optional) | query | RFC 3339 | Only assets whose registry record changed after this time. |

> Filters can be combined, and `X-Total-Results` counts only the assets that match. Unknown query parameters are ignored.

> **400** errors: `invalid asset registry sort` (bad `sort` value); `cannot combine sort with sort_field or sort_dir`; `invalid created_after: expected an RFC 3339 date-time` (same for `updated_after`); `asset registry returned HTTP status 422` (a `category_tag`, `trading_venue` or `asset_type` value the registry doesn't recognise).

> **503** `listed assets are not yet indexed by this server; retry shortly`, with `Retry-After: 10`: retry after the delay.

Example (cURL, Free):
```bash
curl -G \
  --data-urlencode "domain=tether.to" \
  "https://blockstream.info/liquid/api/assets/registry"
```

Example (cURL, Enterprise):
```bash
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "domain=tether.to" \
  "https://enterprise.blockstream.info/liquid/api/assets/registry"
```

Example (Python, Free):
```python
# pip install requests
import requests

BASE_URL = "https://blockstream.info/liquid/api"

res = requests.get(f"{BASE_URL}/assets/registry", params={"domain": "tether.to"}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print(res.json())
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/liquid/api"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/assets/registry", headers=headers, params={"domain": "tether.to"}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://blockstream.info/liquid/api";

const res = await fetch(`${BASE_URL}/assets/registry?` + new URLSearchParams({ domain: "tether.to" }));
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
const data = await res.json();
console.log(data);
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/liquid/api";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/assets/registry?` + new URLSearchParams({ domain: "tether.to" }), {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
[
  {
    "asset_id": "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2",
    "issuance_txin": {
      "txid": "abb4080d91849e933ee2ed65da6b436f7c385cf363fb4aa08399f1e27c58ff3d",
      "vin": 0
    },
    "issuance_prevout": {
      "txid": "9596d259270ef5bac0020435e6d859aea633409483ba64e232b8ba04ce288668",
      "vout": 0
    },
    "reissuance_token": "59fe4d2127ba9f16bd6850a3e6271a166e7ed2e1669f6c107d655791c94ee98f",
    "contract_hash": "3c7f0a53c2ff5b99590620d7f6604a7a3a7bfbaaa6aa61f7bfc7833ca03cde82",
    "status": {
      "confirmed": true,
      "block_height": 365526,
      "block_hash": "24b1250f84c63d6232a33903bedc558e9ee0dabe44f5a02907c475362e77d270",
      "block_time": 1561718158
    },
    "chain_stats": {
      "tx_count": 13,
      "issuance_count": 12,
      "issued_amount": 9756160000000000,
      "burned_amount": 50000000000,
      "has_blinded_issuances": false,
      "reissuance_tokens": 1,
      "burned_reissuance_tokens": 0
    },
    "mempool_stats": {
      "tx_count": 0,
      "issuance_count": 0,
      "issued_amount": 0,
      "burned_amount": 0,
      "has_blinded_issuances": false,
      "reissuance_tokens": null,
      "burned_reissuance_tokens": 0
    },
    "contract": {
      "entity": {
        "domain": "tether.to"
      },
      "issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
      "name": "Tether USD",
      "precision": 8,
      "ticker": "USDt",
      "version": 0
    },
    "entity": {
      "domain": "tether.to"
    },
    "precision": 8,
    "name": "Tether USD",
    "ticker": "USDt",
    "registry": {
      "asset_id": "ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2",
      "contract": {
        "entity": {
          "domain": "tether.to"
        },
        "issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
        "name": "Tether USD",
        "precision": 8,
        "ticker": "USDt",
        "version": 0
      },
      "initial_issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
      "initial_issuer_pubkey_source": "registry_registration",
      "current_issuer_pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
      "issuer_pubkey_history": [
        {
          "pubkey": "0337cceec0beea0232ebe14cba0197a9fbd45fcf2ec946749de920e71434c2b904",
          "valid_from_audit_id": 30,
          "valid_until_audit_id": null
        }
      ],
      "mutable": {
        "category_tags": [],
        "custom": {},
        "trading_venues": []
      },
      "admin": {
        "admin_notes": null,
        "asset_type": null,
        "delisted": false,
        "featured": false,
        "last_admin_action": null,
        "malicious": false
      },
      "icon": {
        "href": "https://assets.blockstream.info/v2/assets/ce091c998b83c78bb71a632313ba3760f1763d9cfcffae02258ffa9865a37bd2/icon/4848c0baa5e76c13694e9781a204240a85c6f236a13c7e66015a1ab4356b7fcd.png"
      },
      "status": "active",
      "created_at": "2026-07-16T15:08:27.774628Z",
      "updated_at": "2026-08-17T15:35:14.442979Z",
      "issuance_prevout": {
        "txid": "9596d259270ef5bac0020435e6d859aea633409483ba64e232b8ba04ce288668",
        "vout": 0
      },
      "issuance_txin": {
        "txid": "abb4080d91849e933ee2ed65da6b436f7c385cf363fb4aa08399f1e27c58ff3d",
        "vin": 0
      }
    }
  }
]
```

### Data formats

#### Transaction format {#fmt-tx}

<!-- keywords: schema fields json transaction object vin vout -->

| Field | Description |
|---|---|
| `txid` | Transaction id |
| `version, locktime` | Consensus fields |
| `size, weight` | Bytes and weight units (vsize = weight / 4) |
| `fee` | Fee in satoshis (computed from prevouts) |
| `vin[]` | `txid`, `vout`, `is_coinbase`, `scriptsig`, `scriptsig_asm`, `inner_redeemscript_asm`, `inner_witnessscript_asm`, `sequence`, `witness[]`, `prevout` (same shape as vout) |
| `vout[]` | `scriptpubkey`, `scriptpubkey_asm`, `scriptpubkey_type` (p2pkh, p2sh, v0_p2wpkh, v0_p2wsh, v1_p2tr, op_return, p2pk, empty, fee (Liquid), unknown), `scriptpubkey_address`, `value` |
| `status` | `confirmed`, `block_height`, `block_hash`, `block_time` |
| `Liquid only` | vin: `is_pegin`, `issuance` · vout: `valuecommitment`, `asset`/`assetcommitment`, `pegout` · tx: `discount_vsize`, `discount_weight` |

#### Block format {#fmt-block}

<!-- keywords: schema fields json block object header -->

| Field | Description |
|---|---|
| `id` | Block hash |
| `height` | Height |
| `version` | Block version |
| `timestamp` | Header time |
| `mediantime` | Median time past |
| `bits, nonce, difficulty` | Proof of work (Bitcoin only) |
| `merkle_root` | Merkle root |
| `tx_count, size, weight` | Counts and sizes |
| `previousblockhash` | Parent hash (absent for genesis) |
| `ext` | Liquid only: signblock / dynafed data |

## Electrum RPC {#proto-electrum}

### Getting started

#### Connecting {#electrum}

<!-- keywords: connect connection tls tcp ssl port 50002 50001 ping keepalive timeout idle batch batching subscribe reconnect openssl -->

Electrum RPC is JSON-RPC 2.0 over a TLS socket. Each message is one JSON object, or an array for batches, terminated by `\n`. The server runs `electrs-esplora` and speaks protocol **1.4**.

##### Use TLS

Connect to Electrum over **TLS on port 50002**. The free hosts also accept unencrypted TCP on `50001`, but avoid it on the public internet. Without TLS, anyone on the network path (Wi-Fi operator, ISP, proxy) can:

- **see which addresses you query** (script hashes map directly to addresses), which links your wallet to your IP address;

- **tamper with responses**: hide or invent history, balances and UTXOs, or drop your broadcasts. Merkle proofs can verify inclusion, but nothing proves a history is _complete_.

Plain TCP only makes sense when the transport is already protected: connecting through a **Tor onion service** (Tor encrypts and authenticates end to end), or to your **own server** on localhost or a private network.

##### Batching

Send a JSON array to run several calls in one round trip. The response is an array in the same order.

```
[{"jsonrpc":"2.0","id":1,"method":"server.ping","params":[]},
 {"jsonrpc":"2.0","id":2,"method":"blockchain.block.header","params":[0]}]
```

##### Subscriptions

`blockchain.headers.subscribe` and `blockchain.scripthash.subscribe` push notifications on the same socket. Notifications have a `method` and no `id`, so route messages by checking for `id`.

##### Connection lifetime

- **Idle connections are closed after about 2 minutes** (Free and Enterprise), and server notifications don't count as activity. Send `server.ping` every 60–90 s to keep a connection open.
- **Connections last 4 to 8 hours at most.** The server closes each connection at a random age in that range, so clients reconnect gradually rather than all at once. Plan for it: a long-running client will reconnect several times a day.

- Expect other disconnects too: servers restart during maintenance and deploys. Some disconnects are clean (EOF), others reset, and some connections go silent without closing.

- **Detect silent drops:** if a `server.ping` isn't answered within about 30 s, treat the connection as dead and reconnect.

- On reconnect: back off, get a **fresh token** (Enterprise; an expired token is rejected on a new connection), re-send `server.version` and re-subscribe, since subscriptions don't survive the connection.
- Request lines are limited to 1 MiB.
**Enterprise:** include `"authorization": "Bearer <token>"` as a top-level member of the first request. [See Authentication](#authentication).

#### Differences from ElectrumX {#electrum-diff}

<!-- keywords: electrumx differences unsupported verbose protocol 1.4 -->

Blockstream runs `electrs-esplora`. It implements the ElectrumX protocol 1.4 method set with these differences.

| Method | Behaviour here |
|---|---|
| `blockchain.transaction.get` | `verbose=true` unsupported (`-32603`) |
| `blockchain.transaction.get_merkle` | Height must match the confirmation height |
| `blockchain.scripthash.get_balance` | Not on Liquid |
| `blockchain.scripthash.listunspent` | Liquid adds `asset`, `nonce` (tagged arrays); fails for very busy script hashes |
| `blockchain.scripthash.get_history` | Unpaged; can be very large on mainnet (some servers cap it) |
| `blockchain.transaction.broadcast_package` | Extension (not in ElectrumX); not on Liquid |
| `blockchain.transaction.get_tsc_merkle` | Not available |
| `server.add_peer` | Not supported (servers don't take part in peer discovery): `-32603 discovery is disabled` |
| `server.donation_address` | Returns `null` |
| `server.version` | Protocol 1.4 only; returns `electrs-esplora <version>` |
| `masternode.*`, `protx.*` | Not applicable (Dash-only) |

### Server

#### server.version {#rpc-server-version}

Identifies the client and negotiates the protocol version. Send it first on every connection.

| Param | Type | Description |
|---|---|---|
| `client_name` | string | Your client name and version. |
| `protocol_version` | string \| [min,max] | Requested protocol version or range. |

Result: `[server_software_version, protocol_version]`

> The server speaks protocol **1.4** only (`electrs-esplora`).

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.version","params":["docs","1.4"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["docs","1.4"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.version","params":["docs","1.4"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.version",
    "params": ["docs", "1.4"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.version",
    "params": ["docs", "1.4"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.version", params: ["docs","1.4"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.version", params: ["docs","1.4"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    "electrs-esplora 0.4.1",
    "1.4"
  ]
}
```

#### server.features {#rpc-server-features}

Returns the server's feature list: genesis hash, hosts, protocol range, hash function.

Result: Object.

> Free and Enterprise servers return an empty `hosts` object: they don't take part in peer discovery. To check which network you're connected to, use `blockchain.block.header` at height 0, which works on every server.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.features","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.features","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.features","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.features",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.features",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.features", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.features", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "genesis_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
    "hash_function": "sha256",
    "hosts": {},
    "protocol_max": "1.4",
    "protocol_min": "1.4",
    "pruning": null,
    "server_version": "electrs-esplora 0.4.1"
  }
}
```

#### server.ping {#rpc-server-ping}

Keep-alive. Returns `null`.

Result: `null`

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.ping","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.ping","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.ping","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.ping",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.ping",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.ping", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.ping", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": null
}
```

#### server.banner {#rpc-server-banner}

Returns the server banner string.

Result: string

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.banner","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.banner","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.banner","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.banner",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.banner",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.banner", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.banner", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "\"Welcome to electrum.blockstream.info - no logs and Tor support - Please learn about running your own server!\""
}
```

#### server.donation_address {#rpc-server-donation}

Always returns `null` on Blockstream servers.

Result: `null`

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.donation_address","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.donation_address","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.donation_address","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.donation_address",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.donation_address",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.donation_address", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.donation_address", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": null
}
```

#### server.peers.subscribe {#rpc-server-peers}

Returns known peer servers as `[ip, host, features]` triples. Despite the name, this is not a subscription.

Result: Array.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"server.peers.subscribe","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.peers.subscribe","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"server.peers.subscribe","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.peers.subscribe",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "server.peers.subscribe",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.peers.subscribe", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "server.peers.subscribe", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    [
      "bces3gc6h6imsoy7bzclmlassli52xrlnrihovl5rw23uk4aehezjkqd.onion",
      "bces3gc6h6imsoy7bzclmlassli52xrlnrihovl5rw23uk4aehezjkqd.onion",
      [
        "v1.6",
        "t50001"
      ]
    ],
    [
      "theuplinkx4yobmvepa7v7mc5hrxbhqzmjcp2iqxvtt7cdxl3ruv62ad.onion",
      "theuplinkx4yobmvepa7v7mc5hrxbhqzmjcp2iqxvtt7cdxl3ruv62ad.onion",
      [
        "v1.6",
        "t50001"
      ]
    ],
    [
      "fulcrumwnoak45vtxkmdewwedaujulf6xkzvqiqfon5b6i5xbhs6igad.onion",
      "fulcrumwnoak45vtxkmdewwedaujulf6xkzvqiqfon5b6i5xbhs6igad.onion",
      [
        "v1.6",
        "t50001"
      ]
    ],
    "… 21 more"
  ]
}
```

### Headers

#### blockchain.headers.subscribe {#rpc-headers-subscribe}

Returns the current tip and subscribes to new tips.

Result: `{"height": int, "hex": raw_header}`

Notification: `{"method":"blockchain.headers.subscribe","params":[{"height":…,"hex":…}]}` on each new tip. Intermediate blocks may be skipped if several arrive at once; on a reorg, walk back to the common ancestor yourself.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.headers.subscribe","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.headers.subscribe","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.headers.subscribe","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.headers.subscribe",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.headers.subscribe",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.headers.subscribe", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.headers.subscribe", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "height": 971407,
    "hex": "0020b02110f8583a9e7c36723400557100101b2a025fa2563468010000000000000000002ad4a3527abefd6ce257af29d28d39101f220b29d6359c2f9ab9417df4f945e2ba7ccf6af01e0217e94672f9"
  }
}
```

#### blockchain.block.header {#rpc-block-header}

Returns a block header by height, optionally with a merkle proof to a checkpoint height.

| Param | Type | Description |
|---|---|---|
| `height` | integer | Block height. |
| `cp_height` (optional) | integer | Checkpoint height (≥ height). 0 = no proof. |

Result: Hex header, or `{header, root, branch}` when `cp_height` > 0.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.block.header","params":[840000]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.block.header","params":[840000]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.block.header","params":[840000],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.block.header",
    "params": [840000],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.block.header",
    "params": [840000],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.block.header", params: [840000] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.block.header", params: [840000],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "00e05f2aab948491071265ad552351d0ad625745668da54b0172010000000000000000004f89a5d73bd4d4887f25981fe81892ccafda10c27f52d6f3dd28183a7c411b03b7072366194203177d9863ea"
}
```

#### blockchain.block.headers {#rpc-block-headers}

Returns a run of consecutive headers, concatenated as hex.

| Param | Type | Description |
|---|---|---|
| `start_height` | integer | First height. |
| `count` | integer | Number of headers; capped at **2016**. |
| `cp_height` (optional) | integer | Checkpoint for a proof of the last header. |

Result: `{count, hex, max}` (+ `root`, `branch` with cp_height)

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.block.headers","params":[840000,2]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.block.headers","params":[840000,2]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.block.headers","params":[840000,2],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.block.headers",
    "params": [840000, 2],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.block.headers",
    "params": [840000, 2],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.block.headers", params: [840000,2] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.block.headers", params: [840000,2],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "count": 2,
    "hex": "00e05f2aab948491071265ad552351d0ad625745668da54b0172010000000000000000004f89a5d73bd4d4887f25981fe81892ccafda10c27f52d6f3dd28183a7c411b03b7072366194203177d9863ea…",
    "max": 2016
  }
}
```

### Script hashes

#### blockchain.scripthash.get_balance {#rpc-scripthash-get-balance}

Returns the confirmed and unconfirmed balance in satoshis.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: `{"confirmed": int, "unconfirmed": int}`

> **Not available on Liquid** (`-32601 unknown method`): amounts are confidential, so the server can't add them up. Compute the balance in your wallet: get each script's history, fetch the transactions, unblind your outputs with your blinding keys, and sum them per asset. [LWK](#lwk) does this for you.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_balance","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_balance","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_balance","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_balance",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_balance",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_balance", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_balance", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "confirmed": 17983134,
    "unconfirmed": 0
  }
}
```

#### blockchain.scripthash.get_history {#rpc-scripthash-get-history}

Returns confirmed history in block order, followed by mempool transactions.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: Array of `{height, tx_hash}`; mempool entries add `fee` and use height `0` (or `-1` if they have unconfirmed parents).

> The full history comes back in one response, with no paging: on mainnet a busy address returned 66,934 entries (about 6 MB) for a single request. Some servers cap it (the free Signet server returns code `1`, `Too many history entries`). For busy addresses, prefer REST paging (`/txs/chain`) or QuickSync.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_history","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_history","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_history","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_history",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_history",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_history", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_history", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    {
      "height": 497677,
      "tx_hash": "4ef47f6eb681d5d9fa2f7e16336cd629303c635e8da51e425b76088be9c8744c"
    },
    {
      "height": 507209,
      "tx_hash": "1aabe0464403151fdd8fb7edbf231501d15feaaa8c1764839f7078b6f2779c4d"
    },
    {
      "height": 511283,
      "tx_hash": "ca38f092f8c148716aed22882b67e6d66099a2dd90e92fa26c4d3dae2c2e08cf"
    },
    "… 115 more"
  ]
}
```

#### blockchain.scripthash.get_mempool {#rpc-scripthash-get-mempool}

Returns unconfirmed transactions only.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: Array of `{tx_hash, height (0 | -1), fee}`

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_mempool","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_mempool","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.get_mempool","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_mempool",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.get_mempool",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_mempool", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.get_mempool", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": []
}
```

#### blockchain.scripthash.listunspent {#rpc-scripthash-listunspent}

Returns unspent outputs, including mempool outputs; outputs spent in the mempool are excluded.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: Array of `{height, tx_hash, tx_pos, value}`. Liquid adds `asset` and `nonce`.

> Busy script hashes can fail with code `1`, with the same limits as [REST /utxo](#rest-address-utxo): Free limits the UTXO count (`Too many unspent outputs`); Enterprise also rejects long histories (`Scripthash history too large to scan`) and fails at a lower UTXO count. On Bitcoin mainnet `get_balance` and `get_history` still work; on Testnet3, very busy script hashes also fail `get_history` (`Too many history entries`).

> **Liquid** encodes `value`, `asset` and `nonce` as tagged arrays, not plain numbers: `[0]` = none, `[1, …]` = explicit, `[2|3, hex]` = confidential commitment. For example `"value":[2,"08ca…"]`, `"asset":[1,"144c…"]`, `"nonce":[0]`.

> A mempool output whose transaction has unconfirmed parents shows `height: 0` here, but `-1` in `get_history`/`get_mempool`.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.listunspent","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.listunspent","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.listunspent","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.listunspent",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.listunspent",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.listunspent", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.listunspent", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    {
      "height": 937849,
      "tx_hash": "d05806c87ceae62e8f47daafb9fe4842c837fa3f333864cd5a5ec9d2a38cf96b",
      "tx_pos": 0,
      "value": 10000
    },
    {
      "height": 930887,
      "tx_hash": "8ed30b80efc7e984e23b1b417176b720bf6cecb4e7e3504f9157aaa46358bc2e",
      "tx_pos": 0,
      "value": 569303
    },
    {
      "height": 833584,
      "tx_hash": "01fdbe66cc2b67282dd62ed82d742fdcb943586f3ea06c8bc61d2ac0e291e865",
      "tx_pos": 0,
      "value": 22000
    },
    "… 113 more"
  ]
}
```

#### blockchain.scripthash.subscribe {#rpc-scripthash-subscribe}

Returns the script hash's current status and subscribes to changes.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: Status hash (hex) or `null` if the script has no history.

Notification: `{"method":"blockchain.scripthash.subscribe","params":[scripthash, status]}` whenever history changes. Status = `sha256` of the concatenation `tx_hash:height:` over the history (Electrum protocol definition).

> Up to **10,000** subscriptions per connection.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.subscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.subscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.subscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.subscribe",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.subscribe",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.subscribe", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.subscribe", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "008a87b4917f1e39da0eff9afae54d6d1721c36166d1014905072705bf8cf87c"
}
```

#### blockchain.scripthash.unsubscribe {#rpc-scripthash-unsubscribe}

Stops notifications for a script hash.

| Param | Type | Description |
|---|---|---|
| `scripthash` | hex (64) | Electrum script hash: **reversed** `sha256(scriptPubKey)`. [How to compute](#scripthash). |

Result: `true` if it was subscribed, else `false`.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.unsubscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.unsubscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.scripthash.unsubscribe","params":["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.unsubscribe",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.scripthash.unsubscribe",
    "params": ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.unsubscribe", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.scripthash.unsubscribe", params: ["f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": true
}
```

### Transactions

#### blockchain.transaction.get {#rpc-transaction-get}

Returns a raw transaction as hex.

| Param | Type | Description |
|---|---|---|
| `tx_hash` | hex (64) | Transaction id. |
| `verbose` (optional) | boolean | Must be omitted or false. |

Result: Raw transaction hex.

> `verbose=true` is **not supported**: `-32603 verbose transactions are currently unsupported`. Decode the hex client-side, or use [REST GET /tx/:txid](#rest-tx).

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.get",
    "params": ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.get",
    "params": ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.get", params: ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.get", params: ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "020000000001017fb9cc941aa0ca3aaf339783564d2d29ec3254a9128f5d49ad3eeb002aeb40ec0000000000000000000242342a6b000000002251203b8b3ab1453eb47e2d4903b963776680e30863df…"
}
```

#### blockchain.transaction.get_merkle {#rpc-transaction-get-merkle}

Returns the merkle branch proving a confirmed transaction's inclusion.

| Param | Type | Description |
|---|---|---|
| `tx_hash` | hex (64) | Transaction id. |
| `height` | integer | The transaction's confirmation height. |

Result: `{block_height, merkle, pos}`

> The height must be correct; otherwise `-32602 invalid confirmation height provided`.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get_merkle","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",840000]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get_merkle","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",840000]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.get_merkle","params":["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",840000],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.get_merkle",
    "params": ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e", 840000],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.get_merkle",
    "params": ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e", 840000],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.get_merkle", params: ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",840000] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.get_merkle", params: ["2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e",840000],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "block_height": 840000,
    "merkle": [
      "a0db149ace545beabbd87a8d6b20ffd6aa3b5a50e58add49a3d435f898c272cf",
      "9e3dbfd868233367c0dbb0536c9089033cd9b48e50930b11b9bee6a85d73455b",
      "904441e470acbe1d55898449df9d87a2fe9a8a781c374ee047023a0f325f38a0",
      "… 9 more"
    ],
    "pos": 1
  }
}
```

#### blockchain.transaction.id_from_pos {#rpc-transaction-id-from-pos}

Returns the txid at a position in a block, optionally with its merkle branch.

| Param | Type | Description |
|---|---|---|
| `height` | integer | Block height. |
| `tx_pos` | integer | Zero-based position. |
| `merkle` (optional) | boolean | Include merkle branch. |

Result: txid, or `{tx_hash, merkle}`

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.id_from_pos","params":[840000,1]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.id_from_pos","params":[840000,1]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.id_from_pos","params":[840000,1],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.id_from_pos",
    "params": [840000, 1],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.id_from_pos",
    "params": [840000, 1],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.id_from_pos", params: [840000,1] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.id_from_pos", params: [840000,1],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": "2bb85f4b004be6da54f766c17c1e855187327112c231ef2ff35ebad0ea67c69e"
}
```

#### blockchain.transaction.broadcast {#rpc-transaction-broadcast}

Broadcasts a raw transaction. Returns the txid.

| Param | Type | Description |
|---|---|---|
| `raw_tx` | hex | Signed raw transaction. |

Result: txid (hex)

> Rejections return error code `2` with the node's message (the example shows a decode failure).

> **Re-sending a confirmed transaction** returns code `2` with `sendrawtransaction RPC error -27: Transaction outputs already in utxo set` (Liquid: `…already in block chain`) while any output is unspent, or `-25: bad-txns-inputs-missingorspent` once all are spent. [Broadcast rejections](#broadcast-errors)

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast","params":["0200"]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast","params":["0200"]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast","params":["0200"],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.broadcast",
    "params": ["0200"],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.broadcast",
    "params": ["0200"],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.broadcast", params: ["0200"] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.broadcast", params: ["0200"],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "error": {
    "code": 2,
    "message": "sendrawtransaction RPC error -22: TX decode failed. Make sure the tx has at least one input."
  },
  "id": 1,
  "jsonrpc": "2.0"
}
```

#### blockchain.transaction.broadcast_package {#rpc-transaction-broadcast-package}

**Blockstream extension** (not in ElectrumX): submits a package of related transactions, like [REST POST /txs/package](#rest-post-package).

| Param | Type | Description |
|---|---|---|
| `raw_txs` | array of hex | Transactions, parents first. |
| `verbose` (optional) | boolean | Return per-transaction details. |

Result: Package acceptance result: same shape as REST `POST /txs/package` (`package_msg`, `tx-results`). Check `package_msg`, as for REST.

> **Bitcoin only.** On Liquid it fails with `-32603` and an upstream `Method not found` error.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast_package","params":[["<parent_hex>","<child_hex>"],false]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast_package","params":[["<parent_hex>","<child_hex>"],false]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.transaction.broadcast_package","params":[["<parent_hex>","<child_hex>"],false],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.broadcast_package",
    "params": [["<parent_hex>", "<child_hex>"], False],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.transaction.broadcast_package",
    "params": [["<parent_hex>", "<child_hex>"], False],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.broadcast_package", params: [["<parent_hex>","<child_hex>"],false] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.transaction.broadcast_package", params: [["<parent_hex>","<child_hex>"],false],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

### Mempool & fees

#### mempool.get_fee_histogram {#rpc-mempool-get-fee-histogram}

Returns the mempool fee histogram as `[fee_rate, vsize]` pairs (sat/vB, vbytes).

Result: Array of pairs.

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"mempool.get_fee_histogram","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"mempool.get_fee_histogram","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"mempool.get_fee_histogram","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "mempool.get_fee_histogram",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "mempool.get_fee_histogram",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "mempool.get_fee_histogram", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "mempool.get_fee_histogram", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": [
    [
      4.646319569120287,
      50085
    ],
    [
      3.001510574018127,
      50883
    ],
    [
      2.0719424460431655,
      50040
    ],
    "… 160 more"
  ]
}
```

#### blockchain.estimatefee {#rpc-estimatefee}

Estimated fee rate for confirmation within `number` blocks.

| Param | Type | Description |
|---|---|---|
| `number` | integer | Confirmation target in blocks. |

Result: Fee rate in **BTC per kilobyte** (float).

> Unit differs from REST: `3.01e-06` BTC/kB = **0.301 sat/vB**. Multiply by 100,000 to get sat/vB.

> Fails with `-32603 cannot estimate fee for N blocks` when the node has no estimate for that target (common on test networks) or the target is out of range (e.g. `0`).

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.estimatefee","params":[6]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.estimatefee","params":[6]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.estimatefee","params":[6],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.estimatefee",
    "params": [6],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.estimatefee",
    "params": [6],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.estimatefee", params: [6] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.estimatefee", params: [6],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": 0.00000301
}
```

#### blockchain.relayfee {#rpc-relayfee}

Minimum relay fee.

Result: BTC per kilobyte (float).

Request:
```json
{"jsonrpc":"2.0","id":1,"method":"blockchain.relayfee","params":[]}
```

Example (Shell, Free):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.relayfee","params":[]}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.blockstream.info:50002 2>/dev/null
```

Example (Shell, Enterprise):
```bash
# sleep keeps stdin open until the reply arrives; -no_ign_eof then exits; 2>/dev/null hides the TLS handshake log
{ echo '{"jsonrpc":"2.0","id":1,"method":"blockchain.relayfee","params":[],"authorization":"Bearer '"$ACCESS_TOKEN"'"}'; sleep 2; } \
  | openssl s_client -quiet -no_ign_eof -connect bitcoin-mainnet.enterprise.blockstream.info:50002 2>/dev/null
```

Example (Python, Free):
```python
import json
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.relayfee",
    "params": [],
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (Python, Enterprise):
```python
import json
import os
import socket
import ssl

HOST, PORT = "bitcoin-mainnet.enterprise.blockstream.info", 50002
request = {
    "jsonrpc": "2.0",
    "id": 1,
    "method": "blockchain.relayfee",
    "params": [],
    "authorization": f"Bearer {os.environ['ACCESS_TOKEN']}",  # first request on the connection
}

ctx = ssl.create_default_context()
with socket.create_connection((HOST, PORT)) as raw, ctx.wrap_socket(raw, server_hostname=HOST) as sock:
    sock.sendall((json.dumps(request) + "\n").encode())
    for line in sock.makefile("r", encoding="utf-8"):  # newline-delimited JSON-RPC
        msg = json.loads(line)
        if msg.get("id") == 1:  # skip subscription notifications
            print(msg["error"] if "error" in msg else msg["result"])
            break
```

Example (JavaScript, Free):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.blockstream.info", port: 50002, servername: "bitcoin-mainnet.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.relayfee", params: [] }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
import tls from "node:tls";

const socket = tls.connect({ host: "bitcoin-mainnet.enterprise.blockstream.info", port: 50002, servername: "bitcoin-mainnet.enterprise.blockstream.info" });
socket.setEncoding("utf8");
socket.on("secureConnect", () => {
  socket.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "blockchain.relayfee", params: [],
    authorization: `Bearer ${process.env.ACCESS_TOKEN}`, // first request on the connection
  }) + "\n");
});
let buf = "";
socket.on("data", (chunk) => {
  buf += chunk;
  for (let i; (i = buf.indexOf("\n")) >= 0; buf = buf.slice(i + 1)) {
    const msg = JSON.parse(buf.slice(0, i)); // newline-delimited JSON-RPC
    if (msg.id === 1) { console.log(msg.error ?? msg.result); socket.end(); }
  }
});
```

Response:
```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": 0.000001
}
```

## QuickSync (Waterfalls) {#proto-quicksync}

### Getting started

#### Overview (Enterprise) {#quicksync}

<!-- keywords: waterfalls descriptor xpub wallet scan sync credits gap limit -->

Traditional wallet sync derives addresses client-side and queries each one, which means hundreds of requests. QuickSync takes the **descriptor** and returns the full wallet history in a single response. In benchmarks, a first scan of a 65-transaction wallet went from 294 requests to 70, and a re-sync from 164 requests to 2.

##### Base URL

`https://enterprise.blockstream.info/api/waterfalls`. Available on every Enterprise network.

##### Which version?

- **v2**: recommended. Returns `tip` (hash).
- **v4**: same with `tip_meta` (hash, time, height).
- **v1**: (deprecated), no tip.

##### Descriptor tips

- URL-encode the descriptor (`curl -G --data-urlencode`, or `URLSearchParams`).

- Use multipath `<0;1>` to scan receive and change in one call.

- Mainnet descriptors (`xpub`) are rejected on test networks (`WrongNetwork`).

- For privacy in logs, encrypt the descriptor with [age](https://age-encryption.org) to the key from [/v1/server_recipient](#wf-recipient) and pass the base64 result instead.

- Test-network example (public BIP84 test key): `wpkh(tpubDC8msFGeGuwnKG9Upg7DM2b4DaRqg3CUZa5g8v2SRQ6K4NSkxUgd7HsL2XVWbVm39yBA4LAxysQAm397zwQSQoQgewGiYZqrA9DsP4zbQ1M/<0;1>/*)`. Use the same key with `elwpkh(…)` on Liquid testnet.

**Every `/waterfalls/…` request is billed at your plan's QuickSync rate**, including utility routes like `/blocks/tip/hash`, `/fee-estimates` and `/v1/build_info`. For data REST also offers, the REST call is cheaper (1 credit).

##### From a scan to a balance {#qs-balance}

A scan tells you **which transactions** touched which addresses. It doesn't return amounts. To get amounts, a balance or UTXOs, follow up with REST calls for the data you need:

| Approach | Calls after the scan | Best for |
|---|---|---|
| **Per transaction**: [`GET /tx/:txid`](#rest-tx) for each txid | 1 per new txid. Confirmed transactions never change, so cache them and only fetch new txids on later syncs. | History with amounts, balance and UTXOs, with cheap re-syncs |
| **Per address**: [`GET /address/:address/utxo`](#rest-address-utxo) for each used address | 1 per used address, on every sync (UTXOs change) | Balance and UTXOs only, for wallets with many transactions on few addresses |

- Scan: One QuickSync call, billed at your plan's QuickSync rate. Positions in `txs_seen` are derivation indexes, so derive the matching addresses locally from the descriptor with any wallet library.

- Fetch what's new: Collect the txids you haven't cached and request `GET /tx/:txid` for each (1 credit). Cache a transaction once it has 10 confirmations; re-fetch mempool ones on the next sync.

- Compute: Outputs whose `scriptpubkey_address` is one of your addresses are received funds; inputs whose `prevout.scriptpubkey_address` is yours are spends. Balance = received − spent. Your UTXOs are the received outputs that no wallet transaction spends.

Example: a wallet with 65 transactions on 20 used addresses costs 1 scan + 65 REST calls on the first sync, and 1 scan + 1 REST call when one new payment arrives. `utxo_only=true` narrows the scan to transactions with unspent outputs, but it still has no amounts. On **Liquid**, amounts are confidential and need your blinding keys, so use [LWK](#lwk), which syncs over QuickSync and unblinds locally.

##### Signed responses

Scan responses are signed with Bitcoin message signing:

- `X-Content-Digest`: the Bitcoin signed-message hash of the raw body, `sha256d("\x18Bitcoin Signed Message:\n" + varint(len) + body)`, not a plain sha256.

- `X-Content-Signature`: base64 compact signature (65 bytes) over the raw body.

- `X-Server-Address`: the signing address. It's a testnet-format P2PKH address on every network, including mainnet.

Verify the body exactly as received: request `Accept-Encoding: identity`, or hash the decompressed body.

### Wallet scan

#### GET /api/waterfalls/v2/waterfalls {#wf-v2}

**Scan Wallet (v2)** · Enterprise only (QuickSync)

Returns the transaction history of a whole wallet in one request. The server derives the descriptor's addresses (or takes your address list), scans until the gap limit, and returns the txids grouped per descriptor and derivation index, with the current tip.

Fields: `txs_seen`, `has_more`, `page`, `tip`

| Param | In | Type | Description |
|---|---|---|---|
| `descriptor` | query | string | Output descriptor (URL-encoded), e.g. `wpkh(xpub…/<0;1>/*)`. Plain or age-encrypted with the server key. Mutually exclusive with `addresses`. |
| `addresses` (optional) | query | string | Comma-separated addresses (non-confidential). Mutually exclusive with `descriptor`. |
| `page` (optional) | query | integer | Descriptor: which derivation window to scan (page 0 scans from index 0 until the gap limit). Single address: next page of confirmed history. Default 0. |
| `to_index` (optional) | query | integer | Highest derivation index to include for descriptors. |
| `utxo_only` (optional) | query | boolean | Return only unspent outputs. |

> **`txs_seen` values are arrays of arrays**: one inner list per derivation index (descriptor) or per address, in order, with `[]` for indexes without history (so the position is the derivation index). A multipath descriptor `<0;1>` comes back as two keys (receive `/0/*` and change `/1/*`), each normalized with a checksum.

> History is capped at **100** confirmed entries per script. Truncated addresses are listed in `has_more` (the field is omitted when nothing was truncated); continue them with `addresses=<addr>&page=1…` until the address no longer appears in `has_more`. Mempool entries appear on page 0 only.

> **Entries are oldest first.** Each index lists its confirmed entries from the oldest block up, then its mempool entries. For a script with more than 100 confirmed entries, page 0 holds the **oldest** 100 and its newest confirmed history is on the last page. To catch new payments to a busy address, re-fetch its last page, not just page 0.

> `utxo_only=true` on a script with history above the cap → **400** `UtxoOnlyHistoryTooLarge`.

> **Entry shape:** `txid`, `height`, and for confirmed entries `block_hash` and `block_timestamp`. Mempool entries have `height: 0` and no block fields. Mempool entries also carry `v`, which says how the transaction touches the script: `v > 0` pays to it at output `v − 1`; `v < 0` spends from it at input `−v − 1`. A mempool transaction appears once per matching input and output, so the same txid can be listed several times. Confirmed entries have no `v`: to see amounts and direction, fetch the transaction (see [From a scan to a balance](#qs-balance)). Mempool entries aren't capped.

Example (cURL, Enterprise):
```bash
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  "https://enterprise.blockstream.info/api/waterfalls/v2/waterfalls"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v2/waterfalls", headers=headers, params={"descriptor": descriptor}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)";

const res = await fetch(`${BASE_URL}/v2/waterfalls?` + new URLSearchParams({ descriptor: descriptor }), {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "txs_seen": {
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/0/*)#kj7aqcx6": [
      [
        {
          "txid": "0aa80eddc9a0af25709dae5db5f270ac39a9ecf210c2a0bed5b1f9a70c8b0fa5",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        {
          "txid": "8186157e7cbda13a3795c76248a19d5f638ba7767dd94a1d3d49ef46ab58f547",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        "… 98 more"
      ],
      [
        {
          "txid": "c62b53412353ec1c727dc31a58b69038ab045cb01d4d1ddb687308ab31cc2730",
          "height": 662792,
          "block_hash": "000000000000000000038c6573feae3c8d4416203feca3d4e54d90d14c5fc9b1",
          "block_timestamp": 1608815762
        },
        {
          "txid": "5a5947e08a64c25ec92bdfd5ff1dda2ad079ba85ac41536b1ed468f29de736db",
          "height": 664033,
          "block_hash": "0000000000000000000a521ce159c614ba7e7e31e0bf56b62ea98c4107cffea1",
          "block_timestamp": 1609525908
        },
        "… 6 more"
      ],
      "… 118 more"
    ],
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/1/*)#8xmuadkz": [
      [
        {
          "txid": "9f3dbe0da718398178955cbe386813f8f6ed709f525fb5bf2885ba3545276ed3",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        },
        {
          "txid": "c9fe41e18ba7f97e413a63e0ca1a8ed3bf550670a70417de8851ba5c0f530e5d",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        }
      ],
      [],
      "… 38 more"
    ]
  },
  "page": 0,
  "tip": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
  "has_more": [
    "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu"
  ]
}
```

Addresses query (200, application/json):
```json
{
  "txs_seen": {
    "addresses": [
      [
        {
          "txid": "4ef47f6eb681d5d9fa2f7e16336cd629303c635e8da51e425b76088be9c8744c",
          "height": 497677,
          "block_hash": "0000000000000000003cf6561bf9c83e72dc202e6af301b5147ae8ceda1c96a9",
          "block_timestamp": 1512456008
        },
        {
          "txid": "1aabe0464403151fdd8fb7edbf231501d15feaaa8c1764839f7078b6f2779c4d",
          "height": 507209,
          "block_hash": "0000000000000000005a71f8e328807aff7d28ac200d5ebe8ff3f51196d7c37c",
          "block_timestamp": 1517545607
        },
        "… 98 more"
      ]
    ]
  },
  "page": 0,
  "tip": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
  "has_more": [
    "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
  ]
}
```

#### GET /api/waterfalls/v4/waterfalls {#wf-v4}

**Scan Wallet (v4)** · Enterprise only (QuickSync)

Same as v2, but returns `tip_meta` (`b` hash, `t` timestamp, `h` height) instead of `tip`. Useful on Bitcoin, where height can't be derived from the header alone.

Fields: `txs_seen`, `has_more`, `page`, `tip_meta`

| Param | In | Type | Description |
|---|---|---|---|
| `descriptor` | query | string | Output descriptor (URL-encoded), e.g. `wpkh(xpub…/<0;1>/*)`. Plain or age-encrypted with the server key. Mutually exclusive with `addresses`. |
| `addresses` (optional) | query | string | Comma-separated addresses (non-confidential). Mutually exclusive with `descriptor`. |
| `page` (optional) | query | integer | As in v2. |
| `to_index` (optional) | query | integer | As in v2. |
| `utxo_only` (optional) | query | boolean | As in v2. |

Example (cURL, Enterprise):
```bash
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  "https://enterprise.blockstream.info/api/waterfalls/v4/waterfalls"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v4/waterfalls", headers=headers, params={"descriptor": descriptor}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)";

const res = await fetch(`${BASE_URL}/v4/waterfalls?` + new URLSearchParams({ descriptor: descriptor }), {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "txs_seen": {
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/0/*)#kj7aqcx6": [
      [
        {
          "txid": "0aa80eddc9a0af25709dae5db5f270ac39a9ecf210c2a0bed5b1f9a70c8b0fa5",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        {
          "txid": "8186157e7cbda13a3795c76248a19d5f638ba7767dd94a1d3d49ef46ab58f547",
          "height": 607985,
          "block_hash": "000000000000000000128c97f658c4a345334d63c1bbba98ba14c15833353dfc",
          "block_timestamp": 1576273304
        },
        "… 98 more"
      ],
      [
        {
          "txid": "c62b53412353ec1c727dc31a58b69038ab045cb01d4d1ddb687308ab31cc2730",
          "height": 662792,
          "block_hash": "000000000000000000038c6573feae3c8d4416203feca3d4e54d90d14c5fc9b1",
          "block_timestamp": 1608815762
        },
        {
          "txid": "5a5947e08a64c25ec92bdfd5ff1dda2ad079ba85ac41536b1ed468f29de736db",
          "height": 664033,
          "block_hash": "0000000000000000000a521ce159c614ba7e7e31e0bf56b62ea98c4107cffea1",
          "block_timestamp": 1609525908
        },
        "… 6 more"
      ],
      "… 118 more"
    ],
    "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/1/*)#8xmuadkz": [
      [
        {
          "txid": "9f3dbe0da718398178955cbe386813f8f6ed709f525fb5bf2885ba3545276ed3",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        },
        {
          "txid": "c9fe41e18ba7f97e413a63e0ca1a8ed3bf550670a70417de8851ba5c0f530e5d",
          "height": 718069,
          "block_hash": "00000000000000000004b20143435b0c72535135b9962c452aedd9a81809a9cc",
          "block_timestamp": 1641854101
        }
      ],
      [],
      "… 38 more"
    ]
  },
  "page": 0,
  "tip_meta": {
    "b": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57",
    "t": 1791982778,
    "h": 971407
  },
  "has_more": [
    "bc1qcr8te4kr609gcawutmrza0j4xv80jy8z306fyu"
  ]
}
```

#### GET /api/waterfalls/v2/waterfalls.cbor {#wf-cbor}

**Scan Wallet (CBOR)** · Enterprise only (QuickSync)

The v2 response encoded as [CBOR](https://cbor.io) (`application/cbor`), typically much smaller than JSON. It has the same structure as the JSON response; decode it with any CBOR library. `/v4/waterfalls.cbor` is also available.

| Param | In | Type | Description |
|---|---|---|---|
| `descriptor` | query | string | Output descriptor (URL-encoded), e.g. `wpkh(xpub…/<0;1>/*)`. Plain or age-encrypted with the server key. Mutually exclusive with `addresses`. |
| `addresses` (optional) | query | string | Comma-separated addresses (non-confidential). Mutually exclusive with `descriptor`. |

Example (cURL, Enterprise):
```bash
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  -o wallet.cbor \
  "https://enterprise.blockstream.info/api/waterfalls/v2/waterfalls.cbor"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v2/waterfalls.cbor", headers=headers, params={"descriptor": descriptor}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
with open("out.bin", "wb") as f:
    f.write(res.content)
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)";

const res = await fetch(`${BASE_URL}/v2/waterfalls.cbor?` + new URLSearchParams({ descriptor: descriptor }), {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = Buffer.from(await res.arrayBuffer());
await (await import("node:fs/promises")).writeFile("out.bin", data);
```

#### GET /api/waterfalls/v1/last_used_index {#wf-last-used}

**Get Last Used Index** · Enterprise only (QuickSync)

Returns the highest used derivation index on the external (receive) and internal (change) chains, without downloading history. The next fresh receive address is `external + 1` (or 0 if null).

Fields: `external`, `internal`, `tip`

| Param | In | Type | Description |
|---|---|---|---|
| `descriptor` | query | string | Output descriptor (URL-encoded), plain or age-encrypted. `addresses` isn't accepted here. |

Example (cURL, Enterprise):
```bash
curl -G \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/last_used_index"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/last_used_index", headers=headers, params={"descriptor": descriptor}, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)";

const res = await fetch(`${BASE_URL}/v1/last_used_index?` + new URLSearchParams({ descriptor: descriptor }), {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "external": 93,
  "internal": 0,
  "tip": "0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57"
}
```

#### SSE /api/waterfalls/v1/subscribe {#wf-subscribe}

**Subscribe to Wallet** · Enterprise only (QuickSync)

Opens a Server-Sent Events stream that hints when a wallet may have new activity. Events are **invalidation hints**: on any `update`, run a normal scan.

The stream opens with `: ready` and sends `: keepalive` every 30 s. Event types: `mempool`, `block` (a watched script changed), `tip` (new block, no change), `reorg` (rescan). Recommended flow: open the subscription **first**, then scan; on reconnect, subscribe again and rescan.

| Param | In | Type | Description |
|---|---|---|---|
| `descriptor` | query | string | Wildcard output descriptor (URL-encoded). |

> A wallet with many used addresses can exceed the number of scripts a subscription can watch: the request fails with **500** `TooManyScripts` (the limit isn't published). The same descriptor still scans with [v2/waterfalls](#wf-v2), so fall back to polling scans.

Example (cURL, Enterprise):
```bash
curl -G -N \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  --data-urlencode "descriptor=wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/subscribe"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/subscribe", headers=headers, params={"descriptor": descriptor}, stream=True, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
for line in res.iter_lines(decode_unicode=True):
    print(line)  # "event: update" → run a scan
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication
const descriptor = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/<0;1>/*)";

const res = await fetch(`${BASE_URL}/v1/subscribe?` + new URLSearchParams({ descriptor: descriptor }), { headers: { Authorization: `Bearer ${ACCESS_TOKEN}`, Accept: "text/event-stream" } });
const decoder = new TextDecoder();
for await (const chunk of res.body) {
  process.stdout.write(decoder.decode(chunk)); // "event: update" → run a scan
}
```

Event stream (text/event-stream):
```
: ready

event: update
data: {"type":"mempool","tip":{"height":971390,"block_hash":"0000…35a6","timestamp":1791973077}}

: keepalive

```

### Utility

#### GET /api/waterfalls/v1/server_recipient {#wf-recipient}

**Get Server Recipient** · Enterprise only (QuickSync)

Returns the server's [age](https://age-encryption.org) public key. Encrypt descriptors with it so they don't appear in plain text in logs or browser history.

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/server_recipient"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/server_recipient", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/v1/server_recipient`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
age1herv7uvntn4gcw394vy49swf27sm7waxwrd8e3lgwak9pfkx33hqfwuw55
```

#### GET /api/waterfalls/v1/server_address {#wf-address}

**Get Server Address** · Enterprise only (QuickSync)

Returns the address whose key signs responses (see `X-Content-Signature`).

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/server_address"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/server_address", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/v1/server_address`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
mgaJXVthwXvpheDy4JoeFqLCPS5iHkgxq7
```

#### GET /api/waterfalls/v1/build_info {#wf-build}

**Get Build Info** · Enterprise only (QuickSync)

Returns the server version and git commit.

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/build_info"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/build_info", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/v1/build_info`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "version": "0.10.0",
  "git_commit": "976497d48afb2850d10a96346a277b2b0e41d013"
}
```

#### GET /api/waterfalls/v1/time_since_last_block {#wf-freshness}

**Time Since Last Block** · Enterprise only (QuickSync)

Plain-text freshness check. Returns **503** when the last block is older than 10× the expected interval.

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/v1/time_since_last_block"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/v1/time_since_last_block", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/v1/time_since_last_block`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
242 seconds since last block, less than 100 minutes
```

#### GET /api/waterfalls/blocks/tip/hash {#wf-tip}

**Get Tip Hash** · Enterprise only (QuickSync)

Esplora-compatible tip hash.

> Billed as a QuickSync call (plan rate, e.g. 5 credits on Advanced). The same data costs **1 credit** from [REST GET /blocks/tip/hash](#rest-blocks-tip-hash), so prefer REST unless you only use QuickSync.

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/blocks/tip/hash"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/blocks/tip/hash", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.text)
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/blocks/tip/hash`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.text();
console.log(data);
```

Example response (200, text/plain):
```
0000000000000000000028a9247f1980f24d9cac49cf36d130fb3351d0f6da57
```

#### GET /api/waterfalls/fee-estimates {#wf-fees}

**Get Fee Estimates** · Enterprise only (QuickSync)

Esplora-compatible fee estimates (sat/vB), cached 30 s.

> Billed as a QuickSync call (plan rate, e.g. 5 credits on Advanced). The same data costs **1 credit** from [REST GET /fee-estimates](#rest-fee-estimates), so prefer REST unless you only use QuickSync.

Example (cURL, Enterprise):
```bash
curl \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  "https://enterprise.blockstream.info/api/waterfalls/fee-estimates"
```

Example (Python, Enterprise):
```python
# pip install requests
import os
import requests

BASE_URL = "https://enterprise.blockstream.info/api/waterfalls"
headers = {"Authorization": f"Bearer {os.environ['ACCESS_TOKEN']}"}  # see Authentication

res = requests.get(f"{BASE_URL}/fee-estimates", headers=headers, timeout=30)
if not res.ok:
    raise RuntimeError(f"{res.status_code} {res.text}")
print("credits left:", res.headers.get("x-credits-remaining"))
print(res.json())
```

Example (JavaScript, Enterprise):
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
const BASE_URL = "https://enterprise.blockstream.info/api/waterfalls";
const ACCESS_TOKEN = process.env.ACCESS_TOKEN; // see Authentication

const res = await fetch(`${BASE_URL}/fee-estimates`, {
  headers: { Authorization: `Bearer ${ACCESS_TOKEN}` }
});
if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
console.log("credits left:", res.headers.get("x-credits-remaining"));
const data = await res.json();
console.log(data);
```

Example response (200, application/json):
```json
{
  "1": 1.0030000000000001,
  "2": 1.0030000000000001,
  "3": 1.0030000000000001,
  "4": 0.301,
  "5": 0.301,
  "6": 0.301,
  "7": 0.273,
  "8": 0.273,
  "9": 0.259,
  "10": 0.259,
  "11": 0.259,
  "12": 0.259,
  "13": 0.259,
  "14": 0.259,
  "15": 0.259,
  "16": 0.259,
  "17": 0.259,
  "18": 0.259,
  "19": 0.259,
  "20": 0.259,
  "21": 0.259,
  "22": 0.259,
  "23": 0.259,
  "24": 0.259,
  "25": 0.259,
  "144": 0.222,
  "504": 0.09999999999999999,
  "1008": 0.09999999999999999
}
```

## Libraries & References

### Libraries

#### LWK (Liquid only) {#lwk}

<!-- keywords: liquid wallet kit library sdk rust python kotlin swift -->

[Liquid Wallet Kit](https://github.com/Blockstream/lwk) (LWK) is Blockstream's library for Liquid wallets, available for Rust (`lwk_wollet`) and Python (`lwk`), with more bindings. Since **0.19**, all three of its blockchain clients (Esplora REST, QuickSync and Electrum) authenticate to Enterprise with a **token provider**: give it your client id and secret, and LWK fetches and refreshes the token for you.

| Client | Liquid mainnet | Liquid testnet |
|---|---|---|
| Esplora (REST) | `https://enterprise.blockstream.info/liquid/api` | `https://enterprise.blockstream.info/liquidtestnet/api` |
| QuickSync (Waterfalls) | `https://enterprise.blockstream.info/liquid/api/waterfalls` | `https://enterprise.blockstream.info/liquidtestnet/api/waterfalls` |
| Electrum | `ssl://elements-mainnet.enterprise.blockstream.info:50002` | `ssl://elements-testnet.enterprise.blockstream.info:50002` |

For testnet, also switch the network: `Network::TestnetLiquid` in Rust, `Network.testnet()` in Python. Each example reads `BS_CLIENT_ID` and `BS_CLIENT_SECRET` from the environment and prints the chain tip.

```toml
[dependencies]
lwk_wollet = "0.19"  # electrum_oidc (Electrum auth) is a default feature
```

##### Language support

LWK's bindings are generated from the same definitions as the Rust crate, so `TokenProvider` is available wherever those bindings are, from version 0.19:

| Language | Package | Enterprise auth |
|---|---|---|
| Rust | `lwk_wollet` (crates.io) | ✓ `TokenProvider::Blockstream` |
| Python | `lwk` (PyPI) | ✓ `TokenProvider.BLOCKSTREAM` |
| Kotlin | `com.blockstream:lwk` (Maven Central) | ✓ |
| Swift | LWK Swift bindings | ✓ |
| Go, C#, C++ | third-party generators (built and tested in the LWK repo) | ✓ |
| JavaScript (wasm) | `lwk_wasm` | — not yet |

##### Esplora (REST)

Code Example:
```rust
use lwk_wollet::clients::blocking::BlockchainBackend; // provides tip()
use lwk_wollet::clients::{EsploraClientBuilder, TokenProvider};
use lwk_wollet::Network;

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = EsploraClientBuilder::new("https://enterprise.blockstream.info/liquid/api", Network::Liquid)
        .token_provider(TokenProvider::Blockstream {
            url: TOKEN_URL.to_string(),
            client_id: std::env::var("BS_CLIENT_ID")?,
            client_secret: std::env::var("BS_CLIENT_SECRET")?,
        })
        .build_blocking()?; // the token is fetched on first use and refreshed automatically

    let tip = client.tip()?;
    println!("Liquid tip height: {}", tip.height);
    Ok(())
}
```
Code Example:
```python
# pip install lwk
import os
from lwk import EsploraClient, EsploraClientBuilder, Network, TokenProvider

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
token = TokenProvider.BLOCKSTREAM(
    url=TOKEN_URL,
    client_id=os.environ["BS_CLIENT_ID"],
    client_secret=os.environ["BS_CLIENT_SECRET"],
)

client = EsploraClient.from_builder(EsploraClientBuilder(
    base_url="https://enterprise.blockstream.info/liquid/api",
    network=Network.mainnet(),
    token_provider=token,
))
print("Liquid tip height:", client.tip().height())
```

##### QuickSync (Waterfalls)

Code Example:
```rust
use lwk_wollet::clients::blocking::BlockchainBackend; // provides tip() and full_scan()
use lwk_wollet::clients::{TokenProvider, WaterfallsClientBuilder};
use lwk_wollet::Network;

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut client = WaterfallsClientBuilder::new("https://enterprise.blockstream.info/liquid/api/waterfalls", Network::Liquid)
        .token_provider(TokenProvider::Blockstream {
            url: TOKEN_URL.to_string(),
            client_id: std::env::var("BS_CLIENT_ID")?,
            client_secret: std::env::var("BS_CLIENT_SECRET")?,
        })
        .build_blocking()?;

    let tip = client.tip()?;
    println!("Liquid tip height: {}", tip.height);
    Ok(())
}
```
Code Example:
```python
# pip install lwk
import os
from lwk import WaterfallsClient, WaterfallsClientBuilder, Network, TokenProvider

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
token = TokenProvider.BLOCKSTREAM(
    url=TOKEN_URL,
    client_id=os.environ["BS_CLIENT_ID"],
    client_secret=os.environ["BS_CLIENT_SECRET"],
)

client = WaterfallsClient.from_builder(WaterfallsClientBuilder(
    base_url="https://enterprise.blockstream.info/liquid/api/waterfalls",
    network=Network.mainnet(),
    token_provider=token,
))
print("Liquid tip height:", client.tip().height())
```

##### Electrum

Code Example:
```rust
use lwk_wollet::clients::blocking::BlockchainBackend; // provides tip()
use lwk_wollet::clients::TokenProvider;
use lwk_wollet::ElectrumClientBuilder;

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Requires the `electrum_oidc` feature (enabled by default in lwk_wollet).
    let mut client = ElectrumClientBuilder::new("ssl://elements-mainnet.enterprise.blockstream.info:50002")
        .token_provider(TokenProvider::Blockstream {
            url: TOKEN_URL.to_string(),
            client_id: std::env::var("BS_CLIENT_ID")?,
            client_secret: std::env::var("BS_CLIENT_SECRET")?,
        })
        .build()?; // connects and authenticates; the token is refreshed on reconnection

    let tip = client.tip()?;
    println!("Liquid tip height: {}", tip.height);
    Ok(())
}
```
Code Example:
```python
# pip install lwk
import os
from lwk import ElectrumClient, ElectrumClientBuilder, Network, TokenProvider

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
token = TokenProvider.BLOCKSTREAM(
    url=TOKEN_URL,
    client_id=os.environ["BS_CLIENT_ID"],
    client_secret=os.environ["BS_CLIENT_SECRET"],
)

client = ElectrumClient.from_builder(ElectrumClientBuilder(
    url="ssl://elements-mainnet.enterprise.blockstream.info:50002",
    token_provider=token,
))
print("Liquid tip height:", client.tip().height())
```

##### Wallet sync with QuickSync

The typical use: scan a confidential (CT) descriptor in one request, then read the balance and the next address. Set `LIQUID_DESCRIPTOR` to your wallet's CT descriptor.

Code Example:
```rust
use lwk_wollet::clients::blocking::BlockchainBackend; // provides full_scan()
use lwk_wollet::clients::{TokenProvider, WaterfallsClientBuilder};
use lwk_wollet::{Network, WolletBuilder, WolletDescriptor};

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Your CT descriptor, e.g. "ct(slip77(...),elwpkh([fingerprint/84'/1776'/0']xpub.../<0;1>/*))"
    let descriptor: WolletDescriptor = std::env::var("LIQUID_DESCRIPTOR")?.parse()?;
    let mut wollet = WolletBuilder::new(Network::Liquid, descriptor).build()?; // in-memory; add a store to persist

    let mut client = WaterfallsClientBuilder::new("https://enterprise.blockstream.info/liquid/api/waterfalls", Network::Liquid)
        .token_provider(TokenProvider::Blockstream {
            url: TOKEN_URL.to_string(),
            client_id: std::env::var("BS_CLIENT_ID")?,
            client_secret: std::env::var("BS_CLIENT_SECRET")?,
        })
        .build_blocking()?;

    // One QuickSync scan returns the whole wallet history; apply it locally (blinding keys never leave the client).
    if let Some(update) = client.full_scan(&wollet)? {
        wollet.apply_update(update)?;
    }
    println!("balance per asset: {:?}", wollet.balance()?);
    println!("next receive address: {}", wollet.address(None)?.address());
    Ok(())
}
```
Code Example:
```python
# pip install lwk
import os
from lwk import Network, TokenProvider, WaterfallsClient, WaterfallsClientBuilder, Wollet, WolletDescriptor

TOKEN_URL = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token"
client = WaterfallsClient.from_builder(WaterfallsClientBuilder(
    base_url="https://enterprise.blockstream.info/liquid/api/waterfalls",
    network=Network.mainnet(),
    token_provider=TokenProvider.BLOCKSTREAM(
        url=TOKEN_URL,
        client_id=os.environ["BS_CLIENT_ID"],
        client_secret=os.environ["BS_CLIENT_SECRET"],
    ),
))

# Your CT descriptor, e.g. "ct(slip77(...),elwpkh([fingerprint/84'/1776'/0']xpub.../<0;1>/*))"
wollet = Wollet(Network.mainnet(), WolletDescriptor(os.environ["LIQUID_DESCRIPTOR"]), datadir=None)

# One QuickSync scan returns the whole wallet history; apply it locally (blinding keys never leave the client).
update = client.full_scan(wollet)
if update is not None:
    wollet.apply_update(update)
print("balance per asset:", wollet.balance())
print("next receive address:", wollet.address(None).address())
```

- `TokenProvider::Static(token)` (Python: `TokenProvider.STATIC(token=…)`) uses a token you already have, with no refresh.

- The token is only sent over TLS (`ssl://`). LWK refuses to send it over plain `tcp://` unless you set `allow_plaintext_with_token` (meant for a local, already-tunnelled proxy).

- When credits run out, LWK returns `Error::InsufficientCredits`; a bad or expired token gives `Error::AuthenticationRequired`.

#### BDK (Bitcoin only) {#bdk}

<!-- keywords: bitcoin dev kit library sdk rust wallet -->

[Bitcoin Dev Kit](https://bitcoindevkit.org) (BDK) syncs wallets through `bdk_esplora` and `bdk_electrum`. Their underlying clients accept an Enterprise token: `esplora-client` takes an `Authorization` header, and `electrum-client` takes an authorization provider that's called for every request. BDK doesn't fetch tokens itself, so the examples include a small token helper.

| Client | Bitcoin mainnet | Testnet3 | Testnet4 |
|---|---|---|---|
| Esplora (REST) | `https://enterprise.blockstream.info/api` | `https://enterprise.blockstream.info/testnet/api` | `https://enterprise.blockstream.info/testnet4/api` |
| BDK network | `Network::Bitcoin` | `Network::Testnet` | `Network::Testnet4` |
| Electrum | `ssl://bitcoin-mainnet.enterprise.blockstream.info:50002` | `ssl://bitcoin-testnet.enterprise.blockstream.info:50002` | `ssl://bitcoin-testnet4.enterprise.blockstream.info:50002` |

```toml
[dependencies]
bdk_esplora = { version = "0.22", features = ["blocking-https"] }  # esplora-client 0.12
bdk_electrum = "0.24"                                              # electrum-client 0.25
bdk_wallet = "3"                                                   # wallet sync example
minreq = { version = "2", features = ["https"] }                   # token request
serde_json = "1"
```

##### Esplora (REST)

The header is set when the client is built, so create a new client with a fresh token before it expires (300 s by default; you can set a longer lifetime when managing your keys).

Code Example:
```rust
use bdk_esplora::esplora_client;

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

/// Requests an access token with the client-credentials grant (client ids and secrets are URL-safe).
fn fetch_token() -> Result<String, Box<dyn std::error::Error>> {
    let body = format!(
        "grant_type=client_credentials&scope=openid&client_id={}&client_secret={}",
        std::env::var("BS_CLIENT_ID")?,
        std::env::var("BS_CLIENT_SECRET")?
    );
    let res = minreq::post(TOKEN_URL)
        .with_header("Content-Type", "application/x-www-form-urlencoded")
        .with_body(body)
        .send()?;
    let json: serde_json::Value = serde_json::from_str(res.as_str()?)?;
    Ok(json["access_token"].as_str().ok_or("no access_token in response")?.to_string())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    // The header is fixed when the client is built: build a new client before the token expires (300 s by default).
    let client = esplora_client::Builder::new("https://enterprise.blockstream.info/api")
        .header("Authorization", &format!("Bearer {}", fetch_token()?))
        .build_blocking();

    println!("Bitcoin tip height: {}", client.get_height()?);
    // Pass the same client to BDK, e.g. `bdk_esplora::EsploraExt::full_scan(&client, request, 20, 4)`.
    Ok(())
}
```

##### Electrum

The authorization provider runs before each request, so it can cache the token and refresh it before expiry.

Code Example:
```rust
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use bdk_electrum::electrum_client::{self, ConfigBuilder, ElectrumApi};
use bdk_electrum::BdkElectrumClient;

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

/// Requests an access token with the client-credentials grant (client ids and secrets are URL-safe).
fn fetch_token() -> Result<String, Box<dyn std::error::Error>> {
    let body = format!(
        "grant_type=client_credentials&scope=openid&client_id={}&client_secret={}",
        std::env::var("BS_CLIENT_ID")?,
        std::env::var("BS_CLIENT_SECRET")?
    );
    let res = minreq::post(TOKEN_URL)
        .with_header("Content-Type", "application/x-www-form-urlencoded")
        .with_body(body)
        .send()?;
    let json: serde_json::Value = serde_json::from_str(res.as_str()?)?;
    Ok(json["access_token"].as_str().ok_or("no access_token in response")?.to_string())
}

static CACHE: Mutex<Option<(String, Instant)>> = Mutex::new(None);

/// Called by electrum-client for each request: returns "Bearer <token>", refreshing it before expiry.
fn bearer() -> Option<String> {
    let mut cache = CACHE.lock().ok()?;
    if let Some((token, fresh_until)) = cache.as_ref() {
        if Instant::now() < *fresh_until {
            return Some(format!("Bearer {token}"));
        }
    }
    let token = fetch_token().ok()?;
    *cache = Some((token.clone(), Instant::now() + Duration::from_secs(240)));
    Some(format!("Bearer {token}"))
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let config = ConfigBuilder::new().authorization_provider(Some(Arc::new(bearer))).build();
    let client = electrum_client::Client::from_config("ssl://bitcoin-mainnet.enterprise.blockstream.info:50002", config)?;

    let tip = client.block_headers_subscribe()?;
    println!("Bitcoin tip height: {}", tip.height);

    // Wrap it for BDK wallet sync (full_scan / sync).
    let _bdk_client = BdkElectrumClient::new(client);
    Ok(())
}
```

##### Wallet sync

A watch-only BDK wallet synced over Enterprise Esplora. For testnet, use `Network::Testnet` (or `Testnet4`), `tpub` descriptors and the matching base URL.

Code Example:
```rust
use bdk_esplora::{esplora_client, EsploraExt};
use bdk_wallet::bitcoin::Network;
use bdk_wallet::{KeychainKind, Wallet};

const TOKEN_URL: &str = "https://login.blockstream.com/realms/blockstream-public/protocol/openid-connect/token";

/// Requests an access token with the client-credentials grant (client ids and secrets are URL-safe).
fn fetch_token() -> Result<String, Box<dyn std::error::Error>> {
    let body = format!(
        "grant_type=client_credentials&scope=openid&client_id={}&client_secret={}",
        std::env::var("BS_CLIENT_ID")?,
        std::env::var("BS_CLIENT_SECRET")?
    );
    let res = minreq::post(TOKEN_URL)
        .with_header("Content-Type", "application/x-www-form-urlencoded")
        .with_body(body)
        .send()?;
    let json: serde_json::Value = serde_json::from_str(res.as_str()?)?;
    Ok(json["access_token"].as_str().ok_or("no access_token in response")?.to_string())
}

// Watch-only wallet (public BIP84 test key). For testnet use Network::Testnet (or Testnet4) with
// tpub descriptors and the matching base URL.
const EXTERNAL: &str = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/0/*)";
const INTERNAL: &str = "wpkh(xpub6CatWdiZiodmUeTDp8LT5or8nmbKNcuyvz7WyksVFkKB4RHwCD3XyuvPEbvqAQY3rAPshWcMLoP2fMFMKHPJ4ZeZXYVUhLv1VMrjPC7PW6V/1/*)";

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut wallet = Wallet::create(EXTERNAL, INTERNAL)
        .network(Network::Bitcoin)
        .create_wallet_no_persist()?;

    // A fresh token per sync: the header is fixed for the client's lifetime.
    let client = esplora_client::Builder::new("https://enterprise.blockstream.info/api")
        .header("Authorization", &format!("Bearer {}", fetch_token()?))
        .build_blocking();

    let request = wallet.start_full_scan().build();
    let update = client.full_scan(request, 20, 4)?; // stop gap 20, 4 parallel requests
    wallet.apply_update(update)?;

    println!("balance: {} sat", wallet.balance().total().to_sat());
    println!("next receive address: {}", wallet.reveal_next_address(KeychainKind::External).address);
    Ok(())
}
```

Long scans: the Esplora client's token is fixed when it's built. If a full scan can run past the token's lifetime (300 s by default), build the client with a fresh token right before the scan, or set a longer token lifetime for that key.

- Use the same clients for wallet sync: pass the Esplora client to `bdk_esplora::EsploraExt` (`full_scan`, `sync`), or wrap the Electrum client in `BdkElectrumClient`.

- BDK has no QuickSync (Waterfalls) client; call the [QuickSync endpoints](#proto-quicksync) directly if you need them.

##### Language bindings

**BDK's language bindings don't support Enterprise authentication yet.** The `bdk-ffi` bindings (Python `bdkpython`, Kotlin, Swift) construct their clients as `EsploraClient(url, proxy, timeout)` and `ElectrumClient(url, socks5, timeout, retry, validate_domain)`, with no header or token option. Use the Rust crates above, or call the [REST](#proto-rest) and [Electrum](#proto-electrum) APIs directly with the examples in these docs.

### General reference

#### Conventions {#conventions}

<!-- keywords: satoshis amounts units hex byte order big-endian timestamps unix text/plain json format -->

- Amounts are integers in **satoshis** (on Liquid, in the asset's base units).

- Hashes and txids are hex in the usual display (big-endian) order, as in block explorers. The exception is [Electrum script hashes](#scripthash).

- Timestamps are Unix seconds. Single values (heights, hashes, hex) come back as `text/plain`; everything else is JSON.

- Errors are plain text with an HTTP status code ([reference](#errors)).

#### Errors {#errors}

<!-- keywords: error errors status code 400 401 402 404 414 429 500 503 rate limit rate-limit limits retry backoff rejected broadcast -25 -27 json-rpc -->

##### REST

Errors return a non-2xx status with a short `text/plain` message. Gateway errors (401, 402) return a small HTML page.

| Status | Example body | When |
|---|---|---|
| **400** | `Invalid hex string`, `Address on invalid network`, `Too many unspent outputs` / `Scripthash history too large to scan`, `start index must be a multiple of 25`, `sendrawtransaction RPC error -26: …`, `invalid sort field` | Malformed input, limits, broadcast rejected. Enterprise: a token sent without the `Bearer ` prefix also gets a 400 (HTML). |
| **401** | HTML · `WWW-Authenticate: Bearer realm="blockstream-public"`, plus `error="invalid_token"` and a description (e.g. `JWT expired`) when a token was sent | Enterprise: missing, invalid or expired token |
| **402** | HTML · `Payment Required` | Enterprise: no credits left, or the network/product isn't included in your plan (e.g. `/signet/`) |
| **404** | `Transaction not found`, `Block not found`, `endpoint does not exist "/…"` | Unknown object or path |
| **413** | HTML page from the gateway (`413 Request Entity Too Large`) | Body over 1 MB |
| **502** | JSON `{"error":{…}}` | `/block-template`: node error |
| **503** | Lookup error text | Temporary backend failure. Retry with backoff. |

##### Electrum RPC

| Code | Meaning | Example |
|---|---|---|
| `-32700` | Parse error | Invalid JSON line |
| `-32600` | Invalid request | Missing `method` |
| `-32601` | Method not found | `unknown method blockchain.scripthash.get_balance` (Liquid) |
| `-32602` | Invalid params | `non-hex hash`, `invalid confirmation height provided` |
| `-32603` | Internal / unsupported | `verbose transactions are currently unsupported`, `missing transaction` (unknown txid), `missing header` (beyond the tip), `cannot estimate fee for N blocks`, `Method not found` (package broadcast on Liquid), `discovery is disabled` (`server.add_peer`) |
| `1` | Bad request (limits) | `Too many history entries`, `Too many unspent outputs`, `Scripthash history too large to scan`, too many subscriptions |
| `2` | Daemon error | `sendrawtransaction RPC error -22: TX decode failed…` |
| `-32004` | Enterprise auth | `invalid authorization member`, `Invalid or expired JWT token in authorization field`. The server then closes the connection. |

`server.version` with an older protocol (e.g. `"1.2"`) doesn't fail: it returns `"1.4"`, the only version served.

##### Broadcast rejections {#broadcast-errors}

When the node rejects a transaction, REST `POST /tx` returns **400** with the node's message as plain text, and Electrum `blockchain.transaction.broadcast` returns error code `2` with the same message. The node's own code (`-25`, `-26`, `-27`…) appears only inside the message text. Re-sending a transaction that is already confirmed gives one of two errors, depending on whether its outputs have been spent:

| Transaction state | Message (REST body and Electrum `message`) |
|---|---|
| Confirmed, at least one output unspent | Bitcoin: `sendrawtransaction RPC error -27: Transaction outputs already in utxo set`; Liquid: `sendrawtransaction RPC error -27: Transaction already in block chain` |
| Confirmed, every output spent | `sendrawtransaction RPC error -25: bad-txns-inputs-missingorspent` |

The second case is the same error a double-spend gets: once every output is spent, the node can't tell that the transaction was already confirmed. Before reporting a failure to a user, look the transaction up with [GET /tx/:txid/status](#rest-tx-status). Match on the `-27` code rather than the text, because Bitcoin and Liquid word it differently.

##### QuickSync

Errors are plain-text codes with an HTTP status: `CannotSpecifyBothDescriptorAndAddresses`, `AtLeastOneFieldMandatory`, `WrongNetwork`, `TooManyAddresses`, `AddressCannotBeBlinded`, `AddressPageRequiresSingleAddress`, `UtxoOnlyHistoryTooLarge`, `InvalidDescriptor(…)` (all 400); `422` `CannotDecrypt` when an encrypted descriptor can't be decrypted. Error bodies have no `Content-Type`.

- A scan with neither `descriptor` nor `addresses` returns **404** `endpoint not found`.

- Very long address lists hit the gateway's URL limit first (**414**, HTML) at around 1,000 addresses.

- An address for the wrong network currently returns **500** (`NetworkValidation…`), not `WrongNetwork`.

#### Caching {#caching}

<!-- keywords: cache cache-control max-age immutable cdn -->

Responses carry `Cache-Control` headers you can honour in a CDN or client cache. Data with 10 or more confirmations is treated as final.

| Header | Applies to |
|---|---|
| `max-age=157784630` (~5 y) | `/block/:hash`, header, raw, txids; transactions and statuses once ≥10 confirmations |
| `max-age=10` | Tip, addresses, mempool stats, fee estimates, recent blocks, anything <10 confirmations |
| `max-age=5` | `/mempool/recent`; QuickSync scans |
| `max-age=30` | QuickSync `/fee-estimates` |
| `no-store` | `/block-template`, `/assets/registry`; `/asset/:asset_id` when `X-Asset-Registry-Status` isn't `available` |
| `no-cache` | QuickSync `/v1/subscribe` (event stream) |
| none | QuickSync utility endpoints (`/v1/server_recipient`, `/v1/server_address`, `/v1/time_since_last_block`) |

#### Common pitfalls {#gotchas}

<!-- keywords: pitfalls gotchas scripthash byte order reversed busy address utxo limit -->

##### 1 · Script hash byte order (REST vs Electrum) {#scripthash}

Both interfaces identify a script by `sha256(scriptPubKey)`, but Electrum expects the bytes **reversed**. Mixing them up produces empty results, not an error.

| Address | `bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq` |
|---|---|
| scriptPubKey | `0014e8df018c7e326cc253faac7e46cdc51e68542c42` |
| REST `/scripthash/:hash` | `9cf341ff91bedbce174cbefcca08a9934075cf7d59c50f8dc0b71f14f6a7d3f8` |
| Electrum `scripthash` | `f8d3a7f6141fb7c08d0fc5597dcf754093a908cafcbe4c17cedbbe91ff41f39c` |

**Starting from an address.** The API doesn't return an address's scriptPubKey, and a fresh address (an invoice you're about to watch) has no transactions to copy it from. Decode the address locally with a Bitcoin library:

Code Example:
```javascript
// Node.js 18+ (ES module: save as .mjs or set "type": "module")
// npm install bitcoinjs-lib @bitcoinerlab/secp256k1
import { address, networks, initEccLib } from "bitcoinjs-lib";
import * as ecc from "@bitcoinerlab/secp256k1";
import { createHash } from "node:crypto";

initEccLib(ecc); // needed for Taproot (bc1p…) addresses

const addr = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq";
const spk = address.toOutputScript(addr, networks.bitcoin); // networks.testnet for Testnet3, Testnet4 and Signet
const restHash = createHash("sha256").update(spk).digest("hex"); // REST /scripthash/:hash
const electrumHash = Buffer.from(restHash, "hex").reverse().toString("hex"); // Electrum scripthash
console.log(restHash, electrumHash);
```
Code Example:
```python
# pip install embit
import hashlib

from embit.script import address_to_scriptpubkey

addr = "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq"
spk = address_to_scriptpubkey(addr).data  # any network: the address prefix identifies it
rest_hash = hashlib.sha256(spk).hexdigest()  # REST /scripthash/:hash
electrum_hash = hashlib.sha256(spk).digest()[::-1].hex()  # Electrum scripthash
print(rest_hash, electrum_hash)
```
Code Example:
```go
// go get github.com/btcsuite/btcd github.com/btcsuite/btcd/btcutil
package main

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"slices"

	"github.com/btcsuite/btcd/btcutil"
	"github.com/btcsuite/btcd/chaincfg"
	"github.com/btcsuite/btcd/txscript"
)

func main() {
	// chaincfg.TestNet3Params also decodes Testnet4 and Signet addresses (same prefixes)
	addr, err := btcutil.DecodeAddress("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", &chaincfg.MainNetParams)
	if err != nil {
		panic(err)
	}
	spk, err := txscript.PayToAddrScript(addr)
	if err != nil {
		panic(err)
	}
	h := sha256.Sum256(spk)
	restHash := hex.EncodeToString(h[:]) // REST /scripthash/:hash
	slices.Reverse(h[:])
	electrumHash := hex.EncodeToString(h[:]) // Electrum scripthash
	fmt.Println(restHash, electrumHash)
}
```

Testnet3, Testnet4 and Signet addresses share the same prefixes (`tb1…`, `m…`/`n…`, `2…`), so the library's testnet settings cover all three. On **Liquid**, use [liquidjs-lib](https://github.com/vulpemventures/liquidjs-lib) (`address.toOutputScript(addr, networks.liquid)`) or [LWK](#lwk), and the unconfidential address: a confidential address has the same scriptPubKey.
**If you already have the scriptPubKey** (e.g. from `GET /tx/:txid` → `vout[].scriptpubkey`), just hash it:

```
import { createHash } from "node:crypto";

const spk = Buffer.from("0014e8df018c7e326cc253faac7e46cdc51e68542c42", "hex");   // from GET /tx/:txid → vout[].scriptpubkey
const restHash = createHash("sha256").update(spk).digest("hex");
const electrumHash = Buffer.from(restHash, "hex").reverse().toString("hex");
```

##### 2 · Pagination and limits

- Address search (REST `/address-prefix`) is disabled on hosted APIs, except Free Signet.

- `/address/:a/txs`: 50 mempool + 25 confirmed. Continue with `/txs/chain/:last_seen_txid` (25 per page).

- `/block/:hash/txs/:start_index`: 25 per page; `start_index` must be a multiple of 25.

- On Bitcoin mainnet, only the UTXO list (REST `/address/:a/utxo`, Electrum `listunspent`) has limits; stats, `get_balance` and history work for any address. Busy addresses fail with **400** / Electrum code `1`. Free limits the UTXO count (`Too many unspent outputs`; 1,253 UTXOs is still served). Enterprise also rejects long histories (`Scripthash history too large to scan`, even with few UTXOs) and refuses 1,253 UTXOs (`Too many unspent outputs`). Handle the status, not the message.

- On Testnet3, very busy addresses (such as mining payout addresses) are also refused for stats and history, on both tiers: REST `/address/:a` returns **400** `Scripthash history too large to scan`, and Electrum `get_history` and `subscribe` return code `1` `Too many history entries`.

- Electrum `get_history` returns the whole history in one response (tens of thousands of entries on busy mainnet addresses). Use REST paging or QuickSync instead.

- Past the end: `/block/:hash/txs/:start_index` → 400 `start index out of range`; `/block/:hash/txid/:index` → 404 `tx index out of range`.

##### 3 · Fee units

REST `/fee-estimates` and the mempool histogram use **sat/vB**. Electrum `blockchain.estimatefee` and `relayfee` return **BTC/kB** (× 100,000 = sat/vB).

##### 4 · Liquid differences

- Amounts and assets may be confidential: expect `valuecommitment`/`assetcommitment` instead of `value`/`asset`.

- No address sums in `chain_stats`, and no Electrum `get_balance`.

- No package relay: REST `POST /txs/package` and Electrum `broadcast_package` fail.

- QuickSync rejects confidential (blinded) addresses; pass the unconfidential form.

##### 5 · Electrum specifics

- `blockchain.transaction.get` with `verbose=true` is unsupported.

- `blockchain.transaction.get_merkle` needs the exact confirmation height.

##### 6 · Re-sending a confirmed transaction

Broadcasting a transaction that is already in a block is rejected. While any of its outputs is unspent you get `-27` (Bitcoin: `Transaction outputs already in utxo set`, Liquid: `Transaction already in block chain`). Once every output has been spent you get `-25 bad-txns-inputs-missingorspent`, which looks exactly like a double-spend. Check [GET /tx/:txid/status](#rest-tx-status) before showing a user a broadcast failure. [Broadcast rejections](#broadcast-errors)
