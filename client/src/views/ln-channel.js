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
        "false",
        "701920"
    ],
    "block": "698766",
    "tx_id": "1072",
    "output_index": "0",
    "node_id_1": "0298f6074a454a1f5345cb2a7c6f9fce206cd0bf675d177cdbf0ca7508dd28852f",
    "node_id_2": "03a7c61c056023c804c6d63693345e00ed8e2b28c8d2e0c455964bfff31128df40",
    "txid": "f66b819e37a241f0505605fc65de5cc945e93f9156d00d251b6be5b75f98b805",
    "closing": [
        "false",
        "91ec05560f57d8c7a719573d40613e5d58796c34ec7589880f48d5147d159e7f"
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

console.log(scid)
async function fetchChannelData(){
    await  axios.get(`${LN_API_URL}/channel_profile/${scid}`)
      .then(function (response) {
        Object.assign(sampleChannelData,response.data)
        axios.get(`${API_URL}/tx/${sampleChannelData.txid}`)
            .then(function (response) {
            Object.assign(sampleTxData,response.data)
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