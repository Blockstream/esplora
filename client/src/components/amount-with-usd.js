// An empty secondary line keeps its height so rows do not grow when a price arrives.
export const AmountWithUsd = ({ primary, secondary }) => (
  <span className="amount-with-usd">
    <span className="amount-with-usd-primary">{primary}</span>
    {secondary == null
      ? <span className="amount-with-usd-secondary" aria-hidden="true">{"\u00a0"}</span>
      : <span className="amount-with-usd-secondary">{secondary}</span>}
  </span>
);
