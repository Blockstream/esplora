import Snabbdom from 'snabbdom-pragma'
import layout from './layout'

const staticRoot = process.env.STATIC_ROOT || ''

export default ({ ethSyncProgress, ...S  }) => layout(
  <div>
    <div className="jumbotron jumbotron-fluid">
      <div className="explorer-title-container">
        <img className="explorer-title-container_logo" alt="" src={`${staticRoot}img/ethereum.png`} />
        <h1 className="explorer-title-container_title">Ethereum Block Explorer</h1>
      </div>
      <div className="container text-center">
        <h3>Sync in progress... {(ethSyncProgress*100).toFixed(10)}%</h3>
        <h4>Looking for peers...</h4>
        <h4>ETA: ∞</h4>
      </div>
    </div>
    <style>{`
      .jumbotron-fluid, .navbar { background: linear-gradient(90deg, rgba(2,0,36,1) 32%, rgba(255,0,249,1) 100%, rgba(121,9,107,1) 100%);  }
    `}</style>
  </div>
, { ...S, activeNav: 'Ethereum' })
