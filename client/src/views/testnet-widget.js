import Snabbdom from 'snabbdom-pragma'

const staticRoot = process.env.STATIC_ROOT || ''

export default () => 
    <div className="testnetWidget">
        <img src={`${staticRoot}img/icons/warning.svg`} />
        <span>You are on Liquid Testnet</span>
    </div>