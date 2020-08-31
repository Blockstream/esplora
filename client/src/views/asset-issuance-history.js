import Snabbdom from "snabbdom-pragma";
import { formatTime, formatAssetAmount } from './util'

export default (assetTxs, chain_stats, asset, t) => {

    //Calculated AssetTx
    let calculatedAssetTx = []
      
    if(assetTxs != null){ 
      // Supply Starts at Zero
      let supply = 0
      // Sort AssetTxs by block_time and Calculate Supply Change / Total Supply
      assetTxs.sort((a,b) => (a.status.block_time > b.status.block_time) ? 1 : ((b.status.block_time > a.status.block_time) ? -1 : 0))
      assetTxs.map(tx => {
        let calTxObj = {}
        calTxObj.txid = tx.txid
        calTxObj.block_height = tx.status.block_height
        calTxObj.block_time = formatTime(tx.status.block_time)

        // Find all Issuance and add them to Supply
        tx.vin.map(vinTx => {
          if("issuance" in vinTx){
            calTxObj.supplyChange = chain_stats.has_blinded_issuances ? t`Confidential` : formatAssetAmount(("+ " + vinTx.issuance.assetamount), asset.precision, t)
            calTxObj.totalSupply = chain_stats.has_blinded_issuances ? t`Confidential` : formatAssetAmount((supply + vinTx.issuance.assetamount), asset.precision, t)
            supply = (supply + vinTx.issuance.assetamount)
          }
        })

        // Find all Burn Transactions and Remove them from Supply
        tx.vout.map(voutTx => {
          if(voutTx.scriptpubkey_type === "op_return"){
            if(voutTx.value > 0){
              calTxObj.supplyChange = chain_stats.has_blinded_issuances ? t`Confidential` : formatAssetAmount(("- " + voutTx.value), asset.precision, t)
              calTxObj.totalSupply = chain_stats.has_blinded_issuances ? t`Confidential` : formatAssetAmount((supply - voutTx.value), asset.precision, t)
              supply = (supply - voutTx.value)
            }
          }
        })
        calculatedAssetTx.push(calTxObj)
      })
    }
    // Reverse Calculated AssetTx to Display Newest to Older
    calculatedAssetTx.reverse()
  


    return(
        <div>
            { assetTxs === null ? <p>{t`No Issuance History`}</p>
            : <div className="assets-table">
                <div className="assets-table-row header">
                    <div className="assets-table-cell">{t`Block`}</div>
                    <div className="assets-table-cell">{t`Time`}</div>
                    <div className="assets-table-cell right-align">{t`Supply Change`}</div>
                    <div className="assets-table-cell right-align">{t`Total Supply`}</div>
                </div>
                {calculatedAssetTx.map(tx => 
                    <div className="assets-table-link-row">
                    <a className="assets-table-row asset-data" href={`tx/${tx.txid}`}>
                        <div className="assets-table-cell highlighted-text" data-label={t`Block`}>{tx.block_height}</div>
                        <div className="assets-table-cell" data-label={t`Time`}>{tx.block_time}</div>
                        <div className="assets-table-cell right-align asset-id" data-label={t`Supply Change`}>{tx.supplyChange}</div>
                        <div className="assets-table-cell right-align" data-label={t`Total Supply`}>{tx.totalSupply}</div>
                    </a>
                    </div>
                )}
            </div>
            }
        </div>
    )
}