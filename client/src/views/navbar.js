import menu from './navbar-menu'

const staticRoot = process.env.STATIC_ROOT || ''

export default S =>

  <nav className="container nav-container">
      <a className="navbar-brand" href=".">
        <img src={`${staticRoot}img/icons/logo.svg`}></img>
      </a>
        <div className="sub-nav font-h5">
            <a href="." class={{ active: S.activeTab == 'dashBoard' }}>Dashboard</a>
            <a href="blocks/recent" class={{ active: S.activeTab == 'recentBlocks' }}>Blocks</a>
            <a href="tx/recent" class={{ active: S.activeTab == 'recentTxs' }}>Transactions</a>
            { process.env.IS_ELEMENTS ? <a href="assets" class={{ active: S.activeTab == 'assets' }}>Assets<sup className="highlight"></sup></a> : "" }
            <a href="/explorer-api" class={{ active: S.activeTab == 'apiLanding' }}>Explorer API</a>
        </div>
      { menu(S) }
  </nav>

