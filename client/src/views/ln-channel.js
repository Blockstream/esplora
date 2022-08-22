import Snabbdom from 'snabbdom-pragma'
import { lnNodeData } from '../driver/ln-sample'
import { formatTime, formatNumber } from './util'
import vinView from './tx-vin'
import voutView from './tx-vout'
const axios = require('axios').default;
import { isAllUnconfidential, isAllNative, isRbf, outTotal, updateQuery } from '../util'

const staticRoot = process.env.STATIC_ROOT || ''
const LN_API_URL = (process.env.LN_API_URL || 'http://localhost:3000/').replace(/\/+$/, '')
const API_URL = (process.env.API_URL || '/api').replace(/\/+$/, '')

let scid = (window.location.href)

const sampleChannelData = {
    "scid": "768301342164779008",
    "amount_sat": 1151,
    "closing_height": [
        "false"
    ],
    "block": "698766",
    "tx_id": "1072",
    "output_index": "0",
    "node_id_1": "0298f6074a454a1f5345cb2a7c6f9fce206cd0bf675d177cdbf0ca7508dd28852f",
    "node_id_2": "03a7c61c056023c804c6d63693345e00ed8e2b28c8d2e0c455964bfff31128df40",
    "txid": "f66b819e37a241f0505605fc65de5cc945e93f9156d00d251b6be5b75f98b805",
    "closing": [
        "false"
    ]
}

if(!scid.includes('nodeprofile')) {
    scid = scid.slice(-18);
} else {
    scid = sampleChannelData.scid;
}

const sampleTxData = {
    "txid": "1f5a40d79c385b2b816749cf17c54af253e90e2ed7b514993f075d2919b1bd50",
    "version": 2,
    "locktime": 0,
    "vin": [
        {
            "txid": "7ad40a23a5f8fffe15cbf7148d2eb6c544589d79b3df534b83724ec84f68337e",
            "vout": 0,
            "prevout": {
                "scriptpubkey": "0014558e88e9afb25528ea00821aaa64ad8a800b7d9d",
                "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 558e88e9afb25528ea00821aaa64ad8a800b7d9d",
                "scriptpubkey_type": "v0_p2wpkh",
                "scriptpubkey_address": "bc1q2k8g36d0kf2j36sqsgd25e9d32qqklva4qyalq",
                "value": 102618
            },
            "scriptsig": "",
            "scriptsig_asm": "",
            "witness": [
                "304402207b248be8a2ba5e3a6dec3787efe0168ee18fa6c58db44cd1d42c743ef9fe09f702200fad11dde40e4c4517a14034e7be5b912c003a93d4f3a07a212c9db5b187ce1e01",
                "0203185b7e2642eef87e3e103cbc8aee10f6b7384987f1131a8ffba78dc2ba2181"
            ],
            "is_coinbase": false,
            "sequence": 4294967295
        },
        {
            "txid": "b4ab34f4e8667724d3094fe2a09316f1ff42c89726bb4a8f8073f66e3d47c272",
            "vout": 1,
            "prevout": {
                "scriptpubkey": "001464c3290188efd2793e0a8ebdfad95aa22a5a2b9c",
                "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 64c3290188efd2793e0a8ebdfad95aa22a5a2b9c",
                "scriptpubkey_type": "v0_p2wpkh",
                "scriptpubkey_address": "bc1qvnpjjqvgalf8j0s2367l4k265g4952uu3hgrqd",
                "value": 6510
            },
            "scriptsig": "",
            "scriptsig_asm": "",
            "witness": [
                "3045022100b2acf4c08a214c6402957eb5209e69da401bf6571edf925d443dc54d913ca2c502203a93af046cb6d424c56e49d8a9768a3d43c70d7651bb86ff5ac23288552ddd9301",
                "02302773b60cde3e758c54e674761cfff5f781a9115dfe2c9912babe7ccc15510f"
            ],
            "is_coinbase": false,
            "sequence": 4294967295
        }
    ],
    "vout": [
        {
            "scriptpubkey": "76a9147f7301ec6b87b9d2a81d8cf4f1502855f93cd82788ac",
            "scriptpubkey_asm": "OP_DUP OP_HASH160 OP_PUSHBYTES_20 7f7301ec6b87b9d2a81d8cf4f1502855f93cd827 OP_EQUALVERIFY OP_CHECKSIG",
            "scriptpubkey_type": "p2pkh",
            "scriptpubkey_address": "1CctbE2aU5FaoKE9HqXoiRoeXdagGDu5UV",
            "value": 81806
        },
        {
            "scriptpubkey": "001410cb5cfb68e921c3f43a024014ddf53841ef5b66",
            "scriptpubkey_asm": "OP_0 OP_PUSHBYTES_20 10cb5cfb68e921c3f43a024014ddf53841ef5b66",
            "scriptpubkey_type": "v0_p2wpkh",
            "scriptpubkey_address": "bc1qzr94e7mgaysu8ap6qfqpfh048pq77kmxeqc0ea",
            "value": 23315
        }
    ],
    "size": 374,
    "weight": 845,
    "fee": 4007,
    "status": {
        "confirmed": false
    }
}

const sampleChannelUpdate = [
    {
        "scid": "612015659904139264",
        "direction": 0,
        "timestamp_given": "Tue Jun 28 2022 17:08:41 GMT-0600 (Mountain Daylight Time)",
        "signature": "40707d38c9318b04125701be8a0ff19d27ae12164b7d0ab56a8a71be2e7a92f6197a34ba31a266c67f0585ad25530bc22b406f146cf2edea07f16ee3077cb697",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1656436121,
        "message_flags": 1,
        "channel_flags": 2,
        "cltv_expiry_delta": 18,
        "htlc_minimum_msat": 1000000,
        "fee_base_msat": 0,
        "fee_proportional_millionths": 0,
        "htlc_maximum_msat": 297000000
    },
    {
        "scid": "612015659904139264",
        "direction": 0,
        "timestamp_given": "Tue Jun 28 2022 17:10:32 GMT-0600 (Mountain Daylight Time)",
        "signature": "f112a6991ee57c2142aa84ae7df0df36a19ffb6701e450d4a37f317a6963ae9059a0d7d4218ca62dca46599386a6b506b9612d1d010ab8f04b8297366050e052",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1656436232,
        "message_flags": 1,
        "channel_flags": 0,
        "cltv_expiry_delta": 18,
        "htlc_minimum_msat": 1000000,
        "fee_base_msat": 0,
        "fee_proportional_millionths": 0,
        "htlc_maximum_msat": 297000000
    },
    {
        "scid": "612015659904139264",
        "direction": 1,
        "timestamp_given": "Wed Jun 29 2022 20:21:28 GMT-0600 (Mountain Daylight Time)",
        "signature": "0fc4ebac1175a4c2158db9c724add5cdcbcee71e86791681b1a299d6c94b1c3b5891c42378678cd8136c92e726973004c0ef95a50daa650d07846eba0d9d56de",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1656534088,
        "message_flags": 1,
        "channel_flags": 1,
        "cltv_expiry_delta": 144,
        "htlc_minimum_msat": 1000,
        "fee_base_msat": 1000,
        "fee_proportional_millionths": 1,
        "htlc_maximum_msat": 300000000
    },
    {
        "scid": "612015659904139264",
        "direction": 1,
        "timestamp_given": "Sat Jul 02 2022 05:53:25 GMT-0600 (Mountain Daylight Time)",
        "signature": "94e00cc0990759d411a122b91912784f8fd20efc62d5c8696bcf9df3af06e7f842b1b311e4fe3a9e80290682b7d0a8d16593dd93bd17a429e5c5503ba3227ce2",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1656741205,
        "message_flags": 1,
        "channel_flags": 3,
        "cltv_expiry_delta": 144,
        "htlc_minimum_msat": 1000,
        "fee_base_msat": 1000,
        "fee_proportional_millionths": 1,
        "htlc_maximum_msat": 300000000
    },
    {
        "scid": "612015659904139264",
        "direction": 1,
        "timestamp_given": "Sun Jul 03 2022 10:58:18 GMT-0600 (Mountain Daylight Time)",
        "signature": "786afe8ae26ef12b33947e417459899789f590c1e01f7a4c7533f48003e2152d32169d800ac2928cfb5cae9d0858e3852172f7875168e6a7977f96faa04e7af5",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1656845898,
        "message_flags": 1,
        "channel_flags": 1,
        "cltv_expiry_delta": 144,
        "htlc_minimum_msat": 1000,
        "fee_base_msat": 1000,
        "fee_proportional_millionths": 1,
        "htlc_maximum_msat": 300000000
    },
    {
        "scid": "612015659904139264",
        "direction": 0,
        "timestamp_given": "Wed Jul 06 2022 11:36:03 GMT-0600 (Mountain Daylight Time)",
        "signature": "77ce071f4be902e29d3f9a0dc9c73ad499ef23432f61377a2fabfaf5baaf8a3c22ad181d6fdb2cd48599f1c571f70015089ff7e5ef3e5b688473008b6128efe4",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1657107363,
        "message_flags": 1,
        "channel_flags": 0,
        "cltv_expiry_delta": 18,
        "htlc_minimum_msat": 1000000,
        "fee_base_msat": 0,
        "fee_proportional_millionths": 0,
        "htlc_maximum_msat": 297000000
    },
    {
        "scid": "612015659904139264",
        "direction": 0,
        "timestamp_given": "Thu Jul 07 2022 23:46:52 GMT-0600 (Mountain Daylight Time)",
        "signature": "425ee3f56e0887ea0433af4f92d073d8911ca20a91e170f65d93a138528f777e048ee3ddf485c1870e3a0658b8db9a04d9fcd680d1b0ba6ace668fb92be1d8a9",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1657237612,
        "message_flags": 1,
        "channel_flags": 2,
        "cltv_expiry_delta": 18,
        "htlc_minimum_msat": 1000000,
        "fee_base_msat": 0,
        "fee_proportional_millionths": 0,
        "htlc_maximum_msat": 297000000
    },
    {
        "scid": "612015659904139264",
        "direction": 0,
        "timestamp_given": "Fri Jul 08 2022 00:14:07 GMT-0600 (Mountain Daylight Time)",
        "signature": "be658ee580fc0401e93cd77757dbf245baee059145f9a1b45b5cc15c5c77472b122b38c5b592c2ae721d7217e5dc22c952bcc1d8cf87e10407a2d56d7da5d9b4",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1657239247,
        "message_flags": 1,
        "channel_flags": 0,
        "cltv_expiry_delta": 18,
        "htlc_minimum_msat": 1000000,
        "fee_base_msat": 0,
        "fee_proportional_millionths": 0,
        "htlc_maximum_msat": 297000000
    },
    {
        "scid": "612015659904139264",
        "direction": 1,
        "timestamp_given": "Mon Jul 11 2022 00:21:28 GMT-0600 (Mountain Daylight Time)",
        "signature": "974b662759f7aff5eda77ac9e6672c1edc9a74b000610aa164183fddade0d58123250986c52194f74bd96289ebbf9594cfa4b7802f49e883e7604d6959c21777",
        "chain_hash": "000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f",
        "short_channel_id": {
            "block": 556625,
            "tx_id": 1424,
            "output_index": 0,
            "short_channel_id": "556625x1424x0"
        },
        "timestamp": 1657498888,
        "message_flags": 1,
        "channel_flags": 1,
        "cltv_expiry_delta": 144,
        "htlc_minimum_msat": 1000,
        "fee_base_msat": 1000,
        "fee_proportional_millionths": 1,
        "htlc_maximum_msat": 300000000
    }
]

console.log(scid)
async function fetchChannelData(){
    await  axios.get(`${LN_API_URL}/channel_profile/${scid}`)
      .then(function (response) {
        Object.assign(sampleChannelData,response.data)
        axios.get(`${API_URL}/tx/${sampleChannelData.txid}`)
            .then(function (response) {
            Object.assign(sampleTxData,response.data)
        })
        axios.get(`${LN_API_URL}/channel_updates/${scid}`)
        .then( function (response) {
            console.log(response.data)
            Object.assign(sampleChannelData,response.data)
        })
    })
}

fetchChannelData()

export const channelProfile = (channelInfo, viewMore, { t } ) => 
<div>
    <div className="block-page">
    <div className="container">
        <div>
        <h1 className="block-header-title">{`Channel ${sampleChannelData.scid}`}</h1>
        <div className="block-hash"><span>{sampleChannelData.scid}</span>
            { process.browser && <div className="code-button">
            <div className="code-button-btn" role="button" data-clipboardCopy={sampleChannelData.scid}></div>
            </div> }
        </div>
        </div>
    </div>
    </div>
    <div className="container">
    <div className="stats-table">
        <div>
        <div>{`Short Channel ID`}</div>
        <div><a href={`channel/${sampleChannelData.scid}`}>{sampleChannelData.scid}</a></div>
        </div>
        <div>
        <div>{`Amount Sat`}</div>
        <div>{(sampleChannelData.amount_sat)}</div>
        </div>
        <div>
        <div>{`block`}</div>
        <div>{`${sampleChannelData.block}`}</div>
        </div>
        <div>
        <div>{`Tx_id`}</div>
        <div>{`${sampleChannelData.tx_id}`}</div>
        </div>
        <div>
        <div>{`Output Index`}</div>
        <div>{`${sampleChannelData.output_index}`}</div>
        </div>
        <div>
        <div>{`Node_id 1`}</div>
        <div><a href={`nodeprofile/${sampleChannelData.node_id_1}`}>{sampleChannelData.node_id_1}</a></div>
        </div>
        <div>
        <div>{`Node_id 2`}</div>
        <div><a href={`nodeprofile/${sampleChannelData.node_id_2}`}>{sampleChannelData.node_id_2}</a></div>
        </div>
        <div>
        <div>{`Txid`}</div>
        <div><a href={`tx/${sampleChannelData.txid}`}>{sampleChannelData.txid}</a></div>
        </div>
    </div>

    <div className="transactions">
        <h3>Channel Updates</h3>
        <div className="transaction-box" id="transaction-box">
            <div className="ins-and-outs">
                <div>
                {
                    sampleChannelUpdate.map((item,index) => 
                    <div className="channel-update">
                        <div className="stats-table">
                            <div>
                            <div>{`Direction`}</div>
                            <div>{item.direction}</div>
                            </div>
                            <div>
                            <div>{`TimeStamp`}</div>
                            <div>{formatTime(item.timestamp)}</div>
                            </div>
                            <div>
                            <div>{`cltv_expiry_delta`}</div>
                            <div>{(item.cltv_expiry_delta)}</div>
                            </div>
                            <div>
                            <div>{`htlc msat`}</div>
                            <div>Maximum: {(item.htlc_maximum_msat)} / Minimum: {item.htlc_minimum_msat}</div>
                            </div>
                            <div>
                            <div>{`Fee Base msat`}</div>
                            <div>{(item.fee_base_msat)}</div>
                            </div>
                        </div>
                    </div>
                    )
                }
                </div>
            </div>
            <div className="footer">
            <div></div>
            <div></div>
            </div>
        </div>
    </div>

    <div className="transactions">
        <h3>Closing Info</h3>
        <div className="transaction-box" id="transaction-box">
            <div className="header">
            <div className="txn"><a href={`tx/${sampleChannelData.txid}`}>{sampleChannelData.txid}</a></div>
            </div>
            <div className="ins-and-outs">
                <div>
                <div>{`Closing_TxId`}</div>
                {
                    sampleChannelData.closing.map((item,index) => 
                    <div><a href={`tx/${item}`}>{item == 'false' ?'unspent' : item  }</a></div>)
                }
                </div>
            <div className="ins-and-outs_spacer">
                <div className="direction-arrow-container">
                <div className="direction-arrow"></div>
                </div>
            </div>
                <div>
                <div>{`Closing Block Height`}</div>
                {
                    sampleChannelData.closing_height.map((item,index) =>
                    <div><a href={`block-height/${item}`}>{item == 'false' ?'unspent' : item }</a></div>)
                }
                </div>
            </div>
            <div className="footer">
            <div></div>
            <div></div>
            </div>
        </div>
    </div>

    <div className="transactions">
        <h3>Transaction Info</h3>
        <div className="transaction-box" id="transaction-box">
            <div className="header">
            <div className="txn"><a href={`tx/${sampleChannelData.txid}`}>{sampleChannelData.txid}</a></div>
            </div>
            <div className="ins-and-outs">
            <div className="vins">{sampleTxData.vin.map((vin, index) => vinView(vin, { ...vopt, index }))}</div>

            <div className="ins-and-outs_spacer">
                <div className="direction-arrow-container">
                <div className="direction-arrow"></div>
                </div>
            </div>


            <div className="vouts">{sampleTxData.vout.map((out, index) =>
                voutView(out, { ...vopt, index }))}
            </div>
            </div>
            <div className="footer">
            <div></div>
            <div></div>
            </div>
        </div>
    </div>
    </div>
</div>

const vopt = { isOpen: false}
  
const btnDetails = (txid, isOpen) => process.browser
// dynamic button in browser env
? <div className="details-btn" data-toggleTx={txid}>{btnDetailsContent(isOpen)}</div>
// or a plain link in server-side rendered env
:  <a className="details-btn" href={`tx/${txid}${updateQuery({ expand: !isOpen })}`}>{btnDetailsContent(isOpen)}</a>

const btnDetailsContent = (isOpen) =>
  <div role="button" tabindex="0">
    <div>{`Details`}</div>
    <div className={isOpen?'minus':'plus'}></div>
  </div>