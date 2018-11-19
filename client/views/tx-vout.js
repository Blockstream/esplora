import Snabbdom from 'snabbdom-pragma'
import { formatAmount, linkToAddr, linkToParentAddr } from './util'

const unspendable_types = [ 'op_return', 'provably_unspendable', 'fee' ]

const layout = (vout, desc, body, { t }) =>
  <div className="vout">
    <div className="vout-header">
      <div className="vout-header-container">
        <span>{ desc || t`Nonstandard` }</span>
        <span className="amount">{ t(formatAmount(vout)) }</span>
      </div>
    </div>
    { body }
  </div>

const fee = (vout, { t }) => layout(vout, t`Transaction fees`, null, { t })

const standard = (vout, { isOpen, spend, t }) => layout(
  vout

, vout.pegout ? (vout.pegout.scriptpubkey_address ? <span>{t`Peg-out to`}<br/>{linkToParentAddr(vout.pegout.scriptpubkey_address)}</span> : t`Peg-out`)
 : vout.scriptpubkey_address ? linkToAddr(vout.scriptpubkey_address)
 : vout.scriptpubkey_type ? vout.scriptpubkey_type.toUpperCase()
 : null

, isOpen && <div className="vout-body">
    { vout.scriptpubkey_type &&
      <div className="vout-body-row">
        <div>{t`Type`}</div>
        <div>{vout.scriptpubkey_type.toUpperCase()}</div>
      </div>
    }

    <div className="vout-body-row">
      <div>{t`scriptPubKey.asm`}</div>
      <div className="mono">{vout.scriptpubkey_asm}</div>
    </div>

    <div className="vout-body-row">
      <div>{t`scriptPubKey.hex`}</div>
      <div className="mono">{vout.scriptpubkey}</div>
    </div>

    { vout.scriptpubkey_type == 'op_return' &&
      <div className="vout-body-row">
        <div>{t`OP_RETURN data`}</div>
        <div className="mono">{ getOpReturn(vout) }</div>
      </div>
    }

    { (vout.asset || vout.assetcommitment) &&
      <div className="vout-body-row">
        <div>{vout.assetcommitment ? t`Asset commitment` : t`Asset ID`}</div>
        <div className="mono">{vout.asset || vout.assetcommitment}</div>
      </div>
    }

    { vout.valuecommitment &&
      <div className="vout-body-row">
        <div>{t`Value commitment`}</div>
        <div className="mono">{vout.valuecommitment}</div>
      </div>
    }

    { !unspendable_types.includes(vout.scriptpubkey_type) &&
      <div className="vout-body-row">
        <div>{t`Spending tx`}</div>
        <div>{
          !spend ? t`Loading...`
        : spend.spent ? <span>{t`Spent by`} <a href={`tx/${spend.txid}`} className="mono">{`${spend.txid}:${spend.vin}`}</a></span>
        : t`Unspent`
        }</div>
      </div>
    }

    { (vout.pegout && vout.pegout.scriptpubkey_address) &&
      <div className="vout-body-row">
        <div>{t`Peg-out address`}</div>
        <div>{linkToParentAddr(vout.pegout.scriptpubkey_address)}</div>
      </div>
    }

    { vout.pegout &&
      <div className="vout-body-row">
        <div>{t`Peg-out ASM`}</div>
        <div>{vout.pegout.scriptpubkey_asm}</div>
      </div>
    }

  </div>
, { t }
)

const getOpReturn = vout => new Buffer(vout.scriptpubkey_asm.split(' ')[2] || '', 'hex').toString('utf-8')

export default (vout, opt) =>
  vout.scriptpubkey_type == 'fee' ? fee(vout, opt)
                                  : standard(vout, opt)
