import Snabbdom from 'snabbdom-pragma'
import { formatTime, formatNumber } from './util'
const axios = require('axios').default;

const staticRoot = process.env.STATIC_ROOT || ''
const LN_API_URL = (process.env.LN_API_URL || 'http://localhost:3000/').replace(/\/+$/, '')
let nodeid = (window.location.href)

const sampleNodeData = {
    "node_id": "03abf6f44c355dec0d5aa155bdbdd6e0c8fefe318eff402de65c6eb2e1be55dc3e",
    "scid": [
        "776847846067863553",
        "767638336719421441"
    ],
    "rgb_color": "68f442",
    "alias": "6d794e6f6465534b000000000000000000000000000000000000000000000000"
}

if(nodeid.includes('channel')) {
    nodeid = sampleNodeData.node_id
} else {
    nodeid = nodeid.slice(-66)
}

function LoadOnce() 
{ 
window.location.reload(); 
} 

async function fetchNodeData(){
    await  axios.get(`${LN_API_URL}/node_profile/${nodeid}`)
      .then(function (response) {
        Object.assign(sampleNodeData,response.data)
    })
}

fetchNodeData()

export const nodeProfile = (nodeInfo, viewMore, { t } ) => 
<div>
    <div className="block-page">
    <div className="container">
        <div>
        <h1 className="block-header-title">{`Node`}</h1>
        <div className="block-hash"><span>{sampleNodeData.node_id}</span>
            { process.browser && <div className="code-button">
            <div className="code-button-btn" role="button" data-clipboardCopy={sampleNodeData.node_id}></div>
            </div> }
        </div>
        </div>
    </div>
    </div>
    <div className="container">
    <div className="stats-table">
        <div>
        <div>{`Node ID`}</div>
        <div><a href={`nodeprofile/${sampleNodeData.node_id}`}>{sampleNodeData.node_id}</a></div>
        </div>
        <div>
        <div>{`RGB color`}</div>
        <div data-label={`rgb_color`}>{sampleNodeData.rgb_color}<div className="node-rgb-color" style={{backgroundColor: `#${sampleNodeData.rgb_color}`}}></div></div>
        </div>
        <div>
        <div>{`Node Alias`}</div>
        <div>{sampleNodeData.alias}</div>
        </div>
    </div>
</div>

    <div className="transactions">
        <h3>Channels connected: {sampleNodeData.scid.length}</h3>
            <div className="header">
            <div className="container">
                <div className="stats-table">
            {
                sampleNodeData.scid.map((item,index) =>
                        <div>
                        <div>{`#${index+1}`}</div>
                        <div><a href={`channel/${item}`}>{item}</a></div>
                        </div>)
            }
                </div>
            </div>

            </div>
            <div className="footer">
            <div></div>
            <div></div>
            </div>
    </div>
</div>