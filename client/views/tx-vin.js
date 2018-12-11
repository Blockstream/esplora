import Snabbdom from 'snabbdom-pragma'
import { linkToParentOut, formatAmount, formatHex, linkToAddr } from './util'

const layout = (vin, desc, body, { t, index, selected=[] }) =>
  <div class={{ vin: true, selected: selected.includes(`input:${index}`) }}>
    <div className="vin-header">
      <div className="vin-header-container">
        <span>{ desc }</span>
        <span className="amount">{ vin.prevout && t(formatAmount(vin.prevout)) }</span>
      </div>
    </div>
    { body }
  </div>

const coinbase = (vin, { t, ...S }) => layout(vin, t`Coinbase`, null, { t, ...S })

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

const standard = (vin, { isOpen, t, ...S }) => layout(
  vin
, <a href={`tx/${vin.txid}#output:${vin.vout}`}>{vin.txid}:{vin.vout}</a>
, isOpen && <div className="vin-body">
    <div className="vin-body-row">
      <div>{t`Outpoint`}</div>
      <div className="mono"><a href={`tx/${vin.txid}#output:${vin.vout}`}>{vin.txid}:{vin.vout}</a></div>
    </div>

    { vin.issuance && [

      <div className="vin-body-row">
        <div>{t`Issuance`}</div>
        <div>{vin.issuance.is_reissuance ? t`Reissuance` : t`New asset`}</div>
      </div>

    , vin.issuance.asset_entropy &&
        <div className="vin-body-row">
          <div>{t`Issuance entropy`}</div>
          <div className="mono">{vin.issuance.asset_entropy}</div>
        </div>

    , vin.issuance.asset_blinding_nonce &&
        <div className="vin-body-row">
          <div>{t`Issuance blinding nonce`}</div>
          <div className="mono">{vin.issuance.asset_blinding_nonce}</div>
        </div>

    , <div className="vin-body-row">
        <div>{!vin.issuance.assetamountcommitment ? t`Issuance amount` : t`Amount commitment`}</div>
        <div>{!vin.issuance.assetamountcommitment ? formatAmount({ value: vin.issuance.assetamount, asset: '' })
                                                  : <span className="mono">{vin.issuance.assetamountcommitment}</span>}</div>
      </div>

    , !vin.issuance.is_reissuance &&
        <div className="vin-body-row">
          <div>{!vin.issuance.tokenamountcommitment ? t`Reissuance keys` : t`Reissuance commitment`}</div>
          <div>{!vin.issuance.tokenamountcommitment ? (!vin.issuance.tokenamount ? t`No reissuance` : vin.issuance.tokenamount)
                                                    : <span className="mono">{vin.issuance.tokenamountcommitment}</span>}</div>
        </div>

    ] }

    <div className="vin-body-row">
      <div>{t`scriptSig (asm)`}</div>
      <div className="mono">{vin.scriptsig_asm}</div>
    </div>
    <div className="vin-body-row">
      <div>{t`scriptSig (hex)`}</div>
      <div className="mono">{vin.scriptsig}</div>
    </div>

    { vin.witness && <div className="vin-body-row">
      <div>{t`Witness`}</div>
      <div className="mono">{vin.witness.join(' ')}</div>
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

export default (vin, opt) =>
  vin.is_coinbase ? coinbase(vin, opt)
: vin.is_pegin    ? pegin(vin, opt)
                  : standard(vin, opt)
