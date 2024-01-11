import Snabbdom from 'snabbdom-pragma'
import { lnNodeData } from '../driver/ln-sample'
import { formatTime, formatNumber } from './util'

var localData = lnNodeData;

const staticRoot = process.env.STATIC_ROOT || ''

const LN_API_URL = (process.env.LN_API_URL || 'http://localhost:3000/').replace(/\/+$/, '')

async function getData() {
  let response = await fetch(`${LN_API_URL}/node_list`);
  let data = await response.json();
  localData = data;
  return data;
}

getData();

export const nodes = (txs, viewMore, { t } ) => 
      <div className="tx-container">
      <div className="transactions-table">
            <h3 className="table-title">{`Latest Nodes`}</h3>
            <div className="transactions-table-row header">
              <div className="transactions-table-cell">{`node_id`}</div>
              <div className="transactions-table-cell">{`timestamp`}</div>
              <div className="transactions-table-cell">{`rgb_color`}</div>
              <div className="transactions-table-cell">{`address`}</div>
              <div className="transactions-table-cell">{`port`}</div>
            </div>
            {
              !viewMore ?
              localData.map(node => { return(
                <div className="transactions-table-link-row">
                  <a className="transactions-table-row transaction-data" href={`node/${node.node_id}`}>
                    <div className="transactions-table-cell highlighted-text" data-label={`node_id`}>{node.node_id}</div>
                    <div className="transactions-table-cell" data-label={`timestamp`}>{formatTime(node.timestamp,false)}</div>
                    <div className="transactions-table-cell" data-label={`rgb_color`}><div className="node-rgb-color" style={{backgroundColor: `#${node.rgb_color}`}}></div>{node.rgb_color}</div>
                    <div className="transactions-table-cell" data-label={`address`}>{node.addresses.address.substring(0,15)}</div>
                    <div className="transactions-table-cell" data-label={`port`}>{node.addresses.port}</div>
                  </a>
                </div>
              )})
              :
              localData.slice(0,5).map(node => { return(
                <div className="transactions-table-link-row">
                  <a className="transactions-table-row transaction-data" href={`node/${node.node_id}`}>
                    <div className="transactions-table-cell highlighted-text" data-label={`node_id`}>{node.node_id}</div>
                    <div className="transactions-table-cell" data-label={`timestamp`}>{formatTime(node.timestamp,false)}</div>
                    <div className="transactions-table-cell" data-label={`rgb_color`}><div className="node-rgb-color" style={{backgroundColor: `#${node.rgb_color}`}}></div>{node.rgb_color}</div>
                    <div className="transactions-table-cell" data-label={`address`}>{node.addresses.address.substring(0,15)}</div>
                    <div className="transactions-table-cell" data-label={`port`}>{node.addresses.port}</div>
                  </a>
                </div>
              )})
            }
            {
              viewMore ?
              <a className="view-more" href="nodes/recent">
                <span>{t`View more Nodes`}</span>
                <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
              </a>
              : ""
            }
        </div>
    </div>
  