import Snabbdom from "snabbdom-pragma";

const items = process.env.MENU_ITEMS && JSON.parse(process.env.MENU_ITEMS),
  active = process.env.MENU_ACTIVE;

const staticRoot = process.env.STATIC_ROOT || "";
const itemEntries = items ? Object.entries(items) : [];
const activeName = active || (itemEntries[0] && itemEntries[0][0]);
const activeId = activeName && activeName.replace(/ /g, "");

export default ({ t, theme, page }) => (
  <div className="main-nav-container">
    {activeName && (
      <ul className="main-nav">
        <li id={activeId} className={`nav-item active`}>
          <button
            className="nav-link font-h4 network-selector-toggle"
            type="button"
            aria-haspopup="true"
            aria-expanded="false"
          >
            <span>
              <img
                className="menu-logo"
                alt=""
                src={`${staticRoot}img/icons/${activeId}-menu-logo.svg`}
              />
            </span>
            <span>{t(activeName)}</span>
            <svg
              className="network-angle-down"
              width="17"
              height="9"
              viewBox="0 0 17 9"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M0.219933 0.220005C0.289589 0.150273 0.372307 0.0949535 0.463356 0.05721C0.554403 0.0194674 0.651998 4.1008e-05 0.750559 4.1008e-05C0.84912 4.1008e-05 0.946717 0.0194674 1.03777 0.05721C1.12881 0.0949535 1.21153 0.150273 1.28118 0.220005L8.25056 7.19032L15.2199 0.220005C15.3607 0.0792751 15.5515 0.000212669 15.7506 0.000212669C15.9496 0.000212669 16.1405 0.0792751 16.2812 0.220005C16.4219 0.360736 16.501 0.551608 16.501 0.75063C16.501 0.949654 16.4219 1.14053 16.2812 1.28126L8.78119 8.78126C8.71153 8.85099 8.62881 8.90631 8.53776 8.94405C8.44672 8.98179 8.34912 9.00122 8.25056 9.00122C8.152 9.00122 8.0544 8.98179 7.96335 8.94405C7.87231 8.90631 7.78959 8.85099 7.71993 8.78126L0.219933 1.28126C0.150202 1.2116 0.0948811 1.12888 0.0571384 1.03784C0.0193958 0.946787 -3.05176e-05 0.849193 -3.05176e-05 0.75063C-3.05176e-05 0.652069 0.0193958 0.554474 0.0571384 0.463426C0.0948811 0.372376 0.150202 0.28966 0.219933 0.220005Z" />
            </svg>
          </button>

          <div className="network-hover-menu-container">
            <div className="network-hover-menu">
              {itemEntries.map(([name, url]) => {
                  return (
                    <a
                      id={name.replace(/ /g, "")}
                      href={url}
                      className={`network-hover-menu-option-container ${name.replace(/ /g, "").toLowerCase()} ${name === activeName ? "active" : ""}`}
                    >
                      <div
                        id={name.replace(/ /g, "")}
                        className={`network-hover-menu-option`}
                      >
                        <span>
                          <img
                            className="menu-logo"
                            src={`${staticRoot}img/icons/${name.replace(/ /g, "")}-menu-logo.svg`}
                          />
                        </span>
                        {t(name)}
                      </div>
                    </a>
                  );
                })}
            </div>
          </div>
        </li>
      </ul>
    )}
  </div>
);
