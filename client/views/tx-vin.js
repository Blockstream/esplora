import Snabbdom from 'snabbdom-pragma'
import { linkToParentOut, formatAmount, linkToAddr } from './util'

const layout = (vin, desc, body, { t }) =>
  <div className="vin">
    <div className="vin-header">
      <div className="vin-header-container">
        <span>{ desc || t`Nonstandard` }</span>
        <span className="amount">{ vin.prevout && t(formatAmount(vin.prevout)) }</span>
      </div>
    </div>
    { body }
  </div>

const coinbase = (vin, { t }) => layout(vin, t`Coinbase`, null, { t })

const pegin = (vin, { isOpen, t }) => layout(
  vin
, linkToParentOut(vin.outpoint, t`Output in parent chain`)
, isOpen && <div className="vin-body">
    <div>
      <div>{t`txid:vout`}</div>
      <div className="mono">{linkToParentOut(vin.outpoint)}</div>
    </div>
  </div>
, { t }
)

const standard = (vin, { isOpen, t }) => layout(
  vin
, !vin.prevout ? null : vin.prevout.scriptpubkey_address ? linkToAddr(vin.prevout.scriptpubkey_address)
                                                         : vin.prevout.scriptpubkey_type ? vin.prevout.scriptpubkey_type.toUpperCase() : null
, isOpen && <div className="vin-body">
    <div className="vin-body-row">
      <div>{t`txid:vout`}</div>
      <div className="mono"><a href={`tx/${vin.outpoint.txid}`}>{vin.outpoint.txid}:{vin.outpoint.vout}</a></div>
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

    , <div className="vin-body-row">
        <div>{!vin.issuance.tokenamountcommitment ? t`Reissuance keys` : t`Reissuance commitment`}</div>
        <div>{!vin.issuance.tokenamountcommitment ? (!vin.issuance.tokenamount ? t`No reissuance` : vin.issuance.tokenamount)
                                                  : <span className="mono">{vin.issuance.tokenamountcommitment}</span>}</div>
      </div>

    ] }

    <div className="vin-body-row">
      <div>{t`scriptSig.ASM`}</div>
      <div className="mono">{vin.scriptsig_asm}</div>
    </div>
    <div className="vin-body-row">
      <div>{t`scriptSig.hex`}</div>
      <div className="mono">{vin.scriptsig_hex}</div>
    </div>

    { vin.witness && <div className="vin-body-row">
      <div>{t`Witness`}</div>
      <div className="mono">{vin.witness.join(' ')}</div>
    </div> }

    <div className="vin-body-row">
      <div>{t`nSequence`}</div>
      <div className="mono">0x{ vin.sequence.toString(16) }</div>
    </div>

  </div>
, { t }
)

export default (vin, opt) =>
  vin.is_coinbase       ? coinbase(vin, opt)
: vin.outpoint.is_pegin ? pegin(vin, opt)
                        : standard(vin, opt)
