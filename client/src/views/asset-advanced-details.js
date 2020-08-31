import Snabbdom from "snabbdom-pragma";
import { formatJson, formatAssetAmount, formatSat, formatNumber } from './util'

export default (asset, is_native_asset, mempool_stats, chain_stats, t) => {

    return(
        <div className= "stats-table">
        { is_native_asset
            // Native asset
            ? [
                mempool_stats.peg_in_amount > 0 && <div>
                  <div>{t`Pegged in (unconfirmed)`}</div>
                  <div className="mono">{formatSat(mempool_stats.peg_in_amount)}</div>
                </div>

              , mempool_stats.peg_out_amount > 0 && <div>
                  <div>{t`Pegged out (unconfirmed)`}</div>
                  <div className="mono">{formatSat(mempool_stats.peg_out_amount)}</div>
                </div>

              , mempool_stats.burned_amount > 0 && <div>
                  <div>{t`Burned (unconfirmed)`}</div>
                  <div className="mono">{formatSat(mempool_stats.burned_amount)}</div>
                </div>

              , <div>
                  <div>{t`Peg/burn transaction count`}</div>
                  <div className="mono">{formatNumber(chain_stats.tx_count)}</div>
                </div>

              , mempool_stats.peg_out_amount > 0 && <div>
                  <div>{t`Peg/burn transaction count (unconfirmed)`}</div>
                  <div className="mono">{formatNumber(mempool_stats.tx_count)}</div>
                </div>
              ]

            // Issued assets
            : [
              <div>
                  <div>{t`Issuance transaction`}</div>
                  <div><a href={`tx/${asset.issuance_txin.txid}?input:${asset.issuance_txin.vin}&expand`}>{`${asset.issuance_txin.txid}:${asset.issuance_txin.vin}`}</a></div>
                </div>

              , <div>
                  <div>{t`Included in Block`}</div>
                  <div>{ asset.status.confirmed
                    ? <a href={`block/${asset.status.block_hash}`} className="mono">{asset.status.block_hash}</a>
                    : t`Unconfirmed`
                  }</div>
                </div>

              , asset.contract_hash && <div>
                  <div>{t`Contract hash`}</div>
                  <div className="mono">{asset.contract_hash}</div>
                </div>

              , asset.contract && <div>
                  <div>{t`Contract JSON`}</div>
                  <div className="mono contract-json">{formatJson(asset.contract)}</div>
                </div>

              , <div>
                  <div>{t`Decimal places`}</div>
                  <div>{asset.precision || 0}</div>
                </div>

              , <div>
                <div>{t`Number of issuances`}</div>
                <div>{chain_stats.issuance_count}</div>
                </div>

              , mempool_stats.issuance_count > 0 && <div>
                <div>{t`Number of issuances (unconfirmed)`}</div>
                <div>{mempool_stats.issuance_count}</div>
                </div>

              , mempool_stats.issued_amount > 0 && <div>
                <div>{t`Issued amount (unconfirmed)`}</div>
                <div>{formatAssetAmount(mempool_stats.issued_amount, asset.precision, t)}</div>
                </div>

              , mempool_stats.burned_amount > 0 && <div>
                <div>{t`Burned amount (unconfirmed)`}</div>
                <div>{formatAssetAmount(mempool_stats.burned_amount, asset.precision, t)}</div>
                </div>

              , <div>
                <div>{t`Reissuance tokens created`}</div>
                <div>{chain_stats.reissuance_tokens == null ? t`Confidential`
                    : chain_stats.reissuance_tokens === 0 ? t`None`
                    : formatNumber(chain_stats.reissuance_tokens) }</div>
                </div>

              , chain_stats.burned_reissuance_tokens > 0 && <div>
                <div>{t`Reissuance tokens burned`}</div>
                <div>{formatNumber(chain_stats.burned_reissuance_tokens)}</div>
                </div>

              , mempool_stats.burned_reissuance_tokens > 0 && <div>
                <div>{t`Reissuance tokens burned (unconfirmed)`}</div>
                <div>{formatNumber(mempool_stats.burned_reissuance_tokens)}</div>
                </div>

              ]
          }
          </div>
    )
}