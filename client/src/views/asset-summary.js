import Snabbdom from "snabbdom-pragma";
import { formatAssetAmount, formatSat } from './util'

export default (is_native_asset, asset, assetIcons, nativeAssetName, 
    nativeAssetLabel, entity_type, circulating, chain_stats, is_non_reissuable, t) => {
    return(
        <div className="asset-summary">
            { is_native_asset
            // Native asset
              ? [ 
                  <div>
                    <div className="asset-logo-name">
                      <div className="asset-logo">
                        <div>
                            {assetIcons === null ? "" : 
                              assetIcons[`${asset.asset_id}`] === undefined ? 
                                <div className="asset-icon-placeholder"></div> :
                                <img src={`data:image/png;base64,${assetIcons[`${asset.asset_id}`]}`} className="asset-icon"/>}
                          </div>
                      </div>
                      <div className="asset-name">{nativeAssetName}<br/><span>{nativeAssetLabel}</span></div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Asset ID`)}</div>
                      <div className="asset-text">{asset.asset_id}
                        { process.browser && <div className="code-button">
                        <div className="code-button-btn" role="button" data-clipboardCopy={asset.asset_id}></div>
                        </div> }
                      </div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Total Active Supply`)}</div>
                      <div className="asset-text">{formatSat(circulating)}</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Total Amount Burned`)}</div>
                      <div className="asset-text">{formatSat(chain_stats.burned_amount)}</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t`Pegged in`}</div>
                      <div className="asset-text">{formatSat(chain_stats.peg_in_amount)}</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t`Pegged out`}</div>
                      <div className="asset-text">{formatSat(chain_stats.peg_out_amount)}</div>
                    </div>   
                  </div>
              ]
               // Issued assets
              : [
                  <div>
                    <div className="asset-logo-name">
                      <div className="asset-logo">
                        <div>
                            {assetIcons === null ? "" : 
                              assetIcons[`${asset.asset_id}`] === undefined ? 
                                <div className="asset-icon-placeholder"></div> :
                                <img src={`data:image/png;base64,${assetIcons[`${asset.asset_id}`]}`} className="asset-icon"/>}
                          </div>
                      </div>
                      <div className="asset-name">{asset.name}<br/><span>{asset.ticker}</span></div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Issuer`)}</div>
                      <div className="asset-text">{asset.entity[entity_type]}</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Asset ID`)}</div>
                      <div className="asset-text">{asset.asset_id}
                        { process.browser && <div className="code-button">
                        <div className="code-button-btn" role="button" data-clipboardCopy={asset.asset_id}></div>
                        </div> }
                      </div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Total Active Supply`)}</div>
                      <div className="asset-text">{ circulating == null ? t`Confidential`
                            : formatAssetAmount(circulating, asset.precision, t) }</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Total Amount Burned`)}</div>
                      <div className="asset-text">{formatAssetAmount(chain_stats.burned_amount, asset.precision, t)}</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Reissuable`)}</div>
                      <div className="asset-text">{ is_non_reissuable ? t`No` : t`Yes` }</div>
                    </div>
                    <div className="asset-label-text">
                      <div className="asset-label">{t(`Reissuable Token for Asset`)}</div>
                      <div className="asset-text">{asset.reissuance_token}</div>
                    </div>
                  </div>
              ]
            }
        </div>
    )
}