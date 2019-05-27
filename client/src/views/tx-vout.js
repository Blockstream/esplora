import Snabbdom from 'snabbdom-pragma'
import { formatOutAmount, linkToAddr, linkToParentAddr, formatNumber } from './util'

const unspendable_types = [ 'op_return', 'provably_unspendable', 'fee' ]

const layout = (vout, desc, body, { t, index, query={}, ...S }) =>
  <div class={{ vout: true, selected: !!query[`output:${index}`] }}>
    <div className="vout-header">
      <div className="vout-header-container">
        <span>{ desc || t`Nonstandard` }</span>
        <span className="amount">{formatOutAmount(vout, { t, ...S })}</span>
      </div>
    </div>
    { body }
  </div>

const fee = (vout, { t, index, ...S }) => layout(vout, t`Transaction fees`, null, { t, index, ...S })

const standard = (vout, { isOpen, spend, t, ...S }) => layout(
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
      <div>{t`scriptPubKey (asm)`}</div>
      <div className="mono">{vout.scriptpubkey_asm}</div>
    </div>

    <div className="vout-body-row">
      <div>{t`scriptPubKey (hex)`}</div>
      <div className="mono">{vout.scriptpubkey}</div>
    </div>

    { vout.scriptpubkey_type == 'op_return' && ((data=getOpReturn(vout)) => data != '' &&
      <div className="vout-body-row">
        <div>{t`OP_RETURN data`}</div>
        <div className="mono">{data}</div>
      </div>)()
    }

    { (vout.asset || vout.assetcommitment) &&
      <div className="vout-body-row">
        <div>{vout.assetcommitment ? t`Asset commitment` : t`Asset ID`}</div>
        <div className="mono">{vout.asset ? <a href={`asset/${vout.asset}`}>{vout.asset}</a> : vout.assetcommitment}</div>
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
          : spend.spent ? <span>
            {t`Spent by`} <a href={`tx/${spend.txid}?input:${spend.vin}`} className="mono">{`${spend.txid}:${spend.vin}`}</a> {' '}
            { spend.status.confirmed ? <span>{t`in block`} <a href={`block/${spend.status.block_hash}`}>#{formatNumber(spend.status.block_height)}</a></span>
                                     : `(${t`unconfirmed`})` }
          </span>
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
, { t, ...S }
)

const getOpReturn = vout => {
  const pushes = vout.scriptpubkey_asm.split(' ').filter((_, i, a) => i > 0 && /^OP_PUSH/.test(a[i-1]))
  return new Buffer(pushes.join('20' /* space */), 'hex').toString('utf-8')
}

export default (vout, opt) =>
  vout.scriptpubkey_type == 'fee' ? fee(vout, opt)
                                  : standard(vout, opt)
