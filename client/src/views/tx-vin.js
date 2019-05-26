import Snabbdom from 'snabbdom-pragma'
import { linkToParentOut, formatOutAmount, formatSat, formatHex, linkToAddr } from './util'

const layout = (vin, desc, body, { t, index, query={}, ...S }) =>
  <div class={{ vin: true, selected: !!query[`input:${index}`] }}>
    <div className="vin-header">
      <div className="vin-header-container">
        <span>{ desc }</span>
        <span className="amount">{ vin.prevout && formatOutAmount(vin.prevout, { t, ...S }) }</span>
      </div>
    </div>
    { body }
  </div>

const pegin = (vin, { isOpen, t, ...S }) => layout(
  vin
, linkToParentOut(vin, t`Output in parent chain`)
, isOpen && <div className="vin-body">
    <div>
      <div>{t`txid:vout`}</div>
      <div className="mono">{linkToParentOut(vin)}</div>
    </div>
  </div>
, { t, ...S }
)

const getAssetMeta = (vin, S) => vin.issuance && vin.issuance.asset_id && S.assetMap && S.assetMap[vin.issuance.asset_id]

const standard = (vin, { isOpen, t, ...S }, assetMeta=getAssetMeta(vin, S)) => layout(
  vin

, vin.is_coinbase
    ? t`Coinbase`
    : <a href={`tx/${vin.txid}?output:${vin.vout}`}>{`${vin.txid}:${vin.vout}`}</a>

, isOpen && <div className="vin-body">
    { vin.issuance && [

      <div className="vin-body-row">
        <div>{t`Issuance`}</div>
        <div>{vin.issuance.is_reissuance ? t`Reissuance` : t`New asset`}</div>
      </div>

    , vin.issuance.asset_id &&
        <div className="vin-body-row">
          <div>{t`Issued asset id`}</div>
          <div className="mono"><a href={`asset/${vin.issuance.asset_id}`}>{vin.issuance.asset_id}</a></div>
        </div>

    , assetMeta && (([ domain, ticker, name, precision ] = assetMeta) =>
        <div className="vin-body-row">
          <div>{t`Asset name`}</div>
          <div>
            {domain} {ticker} { name ? `(${name})` : '' }
          </div>
        </div>)()

    , vin.issuance.asset_entropy &&
        <div className="vin-body-row">
          <div>{!vin.issuance.is_reissuance ? t`Contract hash` : t`Issuance entropy`}</div>
          <div className="mono">{vin.issuance.asset_entropy}</div>
        </div>

    , <div className="vin-body-row">
        <div>{!vin.issuance.assetamountcommitment ? t`Issued amount` : t`Amount commitment`}</div>
        <div>{!vin.issuance.assetamountcommitment ? formatIssuedAmount(vin.issuance, { t, ...S })
                                                  : <span className="mono">{vin.issuance.assetamountcommitment}</span>}</div>
      </div>

    , !vin.issuance.is_reissuance &&
        <div className="vin-body-row">
          <div>{!vin.issuance.tokenamountcommitment ? t`Reissuance keys` : t`Reissuance commitment`}</div>
          <div>{!vin.issuance.tokenamountcommitment ? (!vin.issuance.tokenamount ? t`No reissuance` : vin.issuance.tokenamount)
                                                    : <span className="mono">{vin.issuance.tokenamountcommitment}</span>}</div>
        </div>

    , vin.issuance.asset_blinding_nonce &&
        <div className="vin-body-row">
          <div>{t`Issuance blinding nonce`}</div>
          <div className="mono">{vin.issuance.asset_blinding_nonce}</div>
        </div>

    ] }

    { vin.scriptsig && [
      <div className="vin-body-row">
        <div>{t`scriptSig (asm)`}</div>
        <div className="mono">{vin.scriptsig_asm}</div>
      </div>
    , <div className="vin-body-row">
        <div>{t`scriptSig (hex)`}</div>
        <div className="mono">{vin.scriptsig}</div>
      </div>
    ] }

    { vin.witness && <div className="vin-body-row">
      <div>{t`Witness`}</div>
      <div className="mono">{vin.witness.join(' ')}</div>
    </div> }

    { vin.inner_redeemscript_asm && <div className="vin-body-row">
      <div>{t`P2SH redeem script`}</div>
      <div className="mono">{vin.inner_redeemscript_asm}</div>
    </div> }

    { vin.inner_witnessscript_asm && <div className="vin-body-row">
      <div>{t`P2WSH witness script`}</div>
      <div className="mono">{vin.inner_witnessscript_asm}</div>
    </div> }

    <div className="vin-body-row">
      <div>{t`nSequence`}</div>
      <div className="mono">{formatHex(vin.sequence)}</div>
    </div>

    { vin.prevout && [
      <div className="vin-body-row">
        <div>{t`Previous output script`}</div>
        <div className="mono">
          {vin.prevout.scriptpubkey_asm}
          {vin.prevout.scriptpubkey_type && <em> ({vin.prevout.scriptpubkey_type})</em>}
        </div>
      </div>

    , vin.prevout.scriptpubkey_address && <div className="vin-body-row">
        <div>{t`Previous output address`}</div>
        <div className="mono">{linkToAddr(vin.prevout.scriptpubkey_address)}</div>
      </div>
    ] }


  </div>
, { t, ...S }
)

const formatIssuedAmount = (issuance, S) =>
  // look up the asset name/precision when the issued asset id is known
  issuance.asset_id
    ? formatOutAmount({ value: issuance.assetamount, asset: issuance.asset_id }, S, true)
  // otherwise, use the default precision of 8
    : formatSat(issuance.assetamount, '')

export default (vin, opt) =>
  vin.is_pegin ? pegin(vin, opt)
               : standard(vin, opt)
