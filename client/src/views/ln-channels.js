import Snabbdom from 'snabbdom-pragma'
import { lnChannelData } from '../driver/ln-sample'
const axios = require('axios').default;

var localData = lnChannelData;

const staticRoot = process.env.STATIC_ROOT || ''

const LN_API_URL = (process.env.LN_API_URL || 'http://localhost:3000/').replace(/\/+$/, '')
const API_URL = (process.env.API_URL || '/api').replace(/\/+$/, '')

async function getData() {
  let response = await fetch(`${LN_API_URL}/channel_list`);
  let data = await response.json();
  localData = data;
  return data;
}

async function getIt(){
  await  axios.get(`${LN_API_URL}/channel_list`)
    .then(function (response) {
      response.data.forEach(function (channel) {
        axios.get(`${API_URL}/block-height/${channel.short_channel_id.block}`)
          .then(function (response) {
            axios.get(`${API_URL}/block/${response.data}/txids`)
              .then(function (response) {
                channel.txid = response.data[channel.short_channel_id.tx_id]
                localData.push(channel)
            })
        })
      })
  })
  
}


getData()
getIt()

export const channels = (txs, viewMore, { t } ) => 
      <div className="tx-container">
      <div className="transactions-table">
            <h3 className="table-title">{`Latest Channels`}</h3>
            <div className="transactions-table-row header">
              <div className="transactions-table-cell">{`Short Channel ID`}</div>
              <div className="transactions-table-cell">{`block`}</div>
              <div className="transactions-table-cell">{`tx_id`}</div>
              <div className="transactions-table-cell">{`Output Index`}</div>
            </div>
            {
              !viewMore ? 
              localData.map(channel => { 
                return(
                <div className="transactions-table-link-row">
                  <a className="transactions-table-row transaction-data" href={`tx/${channel.txid}`}>
                    <div className="transactions-table-cell highlighted-text" data-label={`Short Channel ID`}>{channel.short_channel_id.short_channel_id}</div>
                    <div className="transactions-table-cell" data-label={`block`}>{channel.short_channel_id.block}</div>
                    <div className="transactions-table-cell" data-label={`tx_id`}>{channel.short_channel_id.tx_id}</div>
                    <div className="transactions-table-cell" data-label={`Output Index`}>{channel.short_channel_id.output_index}</div>
                  </a>
                </div>
              )})
              :
              localData.slice(0,5).map(channel => { 
                return(
                <div className="transactions-table-link-row">
                  <a className="transactions-table-row transaction-data" href={`tx/${channel.txid}`}>
                    <div className="transactions-table-cell highlighted-text" data-label={`Short Channel ID`}>{channel.short_channel_id.short_channel_id}</div>
                    <div className="transactions-table-cell" data-label={`block`}>{channel.short_channel_id.block}</div>
                    <div className="transactions-table-cell" data-label={`tx_id`}>{channel.short_channel_id.tx_id}</div>
                    <div className="transactions-table-cell" data-label={`Output Index`}>{channel.short_channel_id.output_index}</div>
                  </a>
                </div>
              )})
            }
            {
              viewMore ? 
              <a className="view-more" href="channels/recent">
                <span>{t`View more Channels`}</span>
                <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
              </a>
              : 
              <div className="load-more-container">
                <div>
                   <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div> 
                </div>
              </div>
            }
        </div>
    </div>
  