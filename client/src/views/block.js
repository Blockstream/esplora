import Snabbdom from 'snabbdom-pragma'
import layout from './layout'
import search from './search'
import { txBox } from './tx'
import { updateQuery } from '../util'
import { formatTime, formatHex, formatNumber } from './util'
import { blockTxsPerPage as perPage } from '../const'


const staticRoot = process.env.STATIC_ROOT || ''

const makeStatus = b => b && ({ confirmed: true, block_height: b.height, block_hash: b.id })

export default ({ t, block: b, blockStatus: status, blockTxs, openTx, spends, openBlock, goBlock, tipHeight, loading, page, txsStatus=makeStatus(b), ...S }) => b && layout(
  <div>
    <div className="jumbotron jumbotron-fluid block-page">
      <div className="container">
        { search({ t, klass: 'page-search-bar' }) }
        <div>
          <h1 className="block-header-title">{t`Block ${formatNumber(b.height)}`}</h1>
          <div className="block-hash"><span>{b.id}</span>
            { process.browser && <div className="code-button">
              <div className="code-button-btn" role="button" data-clipboardCopy={b.id}></div>
            </div> }
          </div>
          <div className="prev-next-blocks-btns">
            <div>
              { b.previousblockhash &&
                <a href={`block/${b.previousblockhash}`}>
                  <div>
                    <div><div className="arrow-prev"></div></div>
                    <div><span>{t`Previous`}</span></div>
                  </div>
                </a>
              }
            </div>
            <div>
              { (status && status.next_best) &&
                <a href={`block/${status.next_best}`}>
                  <div>
                    <div><span>{t`Next`}</span></div>
                    <div><div className="arrow-next"></div></div>
                  </div>
                </a>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
    <div className="container">
      {btnDetails(b.id, openBlock == b.id, page.query, t)}

      <div className="stats-table">
        <div>
          <div>{t`Height`}</div>
          <div><a href={`block/${b.id}`}>{formatNumber(b.height)}</a></div>
        </div>
        <div>
          <div>{t`Status`}</div>
          <div>{!status ? '' : !status.in_best_chain ? t`Orphaned` : tipHeight ? t`In best chain (${tipHeight-b.height+1} confirmations)` : t`In best chain`}</div>
        </div>
        <div>
          <div>{t`Timestamp`}</div>
          <div>{formatTime(b.timestamp, t)}</div>
        </div>
        <div>
          <div>{t`Size`}</div>
          <div>{`${formatNumber(b.size/1000)} KB`}</div>
        </div>
        <div>
          <div>{t`Virtual size`}</div>
          <div>{`${Math.ceil(b.weight/4/1000)} vKB`}</div>
        </div>
        <div>
          <div>{t`Weight units`}</div>
          <div>{`${formatNumber(b.weight/1000)} KWU`}</div>
        </div>

        { /* advanced details */ }
        { openBlock == b.id && [

            <div>
              <div>{t`Version`}</div>
              <div className="mono">{formatHex(b.version)}</div>
            </div>
          , <div>
              <div>{t`Merkle root`}</div>
              <div className="mono">{b.merkle_root}</div>
            </div>

          /* PoW chains */
          , b.bits ? [
              <div>
                <div>{t`Bits`}</div>
                <div className="mono">{formatHex(b.bits)}</div>
              </div>
            , <div>
                <div>{t`Nonce`}</div>
                <div className="mono">{formatHex(b.nonce)}</div>
              </div>
            ]

          /* Federated chains */
          : b.proof ? [
              <div>
                <div>{t`Block Challenge`}</div>
                <div className="mono">{b.proof.challenge_asm}</div>
              </div>
            , <div>
                <div>{t`Block Solution`}</div>
                <div className="mono">{b.proof.solution_asm}</div>
             </div>
            ]
          : null
        ] }


      </div>

      <div className="transactions">
        <h3>{txsShownText(b.tx_count, goBlock.start_index, blockTxs && blockTxs.length, t)}</h3>
        { blockTxs ? blockTxs.map(tx => txBox( { ...tx, status: txsStatus }, { openTx, tipHeight, t, spends }))
                   : <img src="img/Loading.gif" className="loading-delay" /> }
      </div>

      <div className="load-more-container">
        <div>
          { loading ? <div className="load-more disabled"><span>{t`Load more`}</span><div><img src="img/Loading.gif" /></div></div>
                    : pagingNav(b, { ...S, t }) }
        </div>
      </div>
    </div>
  </div>
, { t, page, ...S })

const txsShownText = (total, start, shown, t) =>
  (total > perPage && shown > 0)
  ? t`${ start > 0 ? `${start}-${+start+shown}` : shown} of ${total} Transactions`
  : t`${total} Transactions`

const pagingNav = (block, { nextBlockTxs, prevBlockTxs, t }) =>
  process.browser

? nextBlockTxs &&
    <div className="load-more" role="button" data-loadmoreTxsIndex={nextBlockTxs} data-loadmoreTxsBlock={block.id}>
      <span>{t`Load more`}</span>
      <div><img alt="" src={`${staticRoot}img/icons/arrow_down.png`} /></div>
    </div>

: [
    prevBlockTxs != null &&
      <a className="load-more" href={`block/${block.id}?start=${prevBlockTxs}`}>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_left_blu.png`} /></div>
        <span>{t`Prev`}</span>
      </a>
  , nextBlockTxs != null &&
      <a className="load-more" href={`block/${block.id}?start=${nextBlockTxs}`}>
        <span>{t`Next`}</span>
        <div><img alt="" src={`${staticRoot}img/icons/arrow_right_blu.png`} /></div>
      </a>
  ]

const btnDetails = (blockhash, isOpen, query, t) => process.browser
  // dynamic button in browser env
  ? <div className="details-btn float-right mb-2" data-toggleBlock={blockhash}>{btnDetailsContent(isOpen, t)}</div>
  // or a plain link in server-side rendered env
  :  <a className="details-btn float-right mb-2" href={`block/${blockhash}${updateQuery(query, { expand: !isOpen })}`}>{btnDetailsContent(isOpen, t)}</a>

const btnDetailsContent = (isOpen, t) =>
  <div role="button" tabindex="0">
    <div>{t`Details`}</div>
    <div className={isOpen?'minus':'plus'}></div>
  </div>
