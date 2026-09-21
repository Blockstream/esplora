import { CloseIcon } from '../components/icons'

const isLiquidMainnet = process.env.MENU_ACTIVE === 'Liquid'

export default () =>
  isLiquidMainnet
    ? <div className="announcement-banner">
        <p className="announcement-banner-message">
          LBTC peg-out operations remain paused. Updates:{' '}
          <a href="https://x.com/Liquid_BTC" target="_blank" rel="noopener">@Liquid_BTC</a>
        </p>
        <button className="announcement-banner-close" aria-label="Dismiss announcement">
          <CloseIcon className="announcement-banner-close-icon" />
        </button>
      </div>
    : ""
