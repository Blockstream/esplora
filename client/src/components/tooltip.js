export const Tooltip = ({ iconSrc, text }) => (
  <button
    type="button"
    className="tooltip"
    aria-label={`More information: ${text}`}
  >
    <img alt="" src={iconSrc} />
    <span className="tooltip-dialogue" role="tooltip">{text}</span>
  </button>
);
