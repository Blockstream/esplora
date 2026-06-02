import layout from "./layout";

export default ({ t, ...S }) =>
  layout(
    <div className="loading-container">
      <div className="spinner">
        <div className="ring"></div>
        <div className="loading">{t`Loading`}</div>
      </div>
    </div>,
    { t, ...S },
  );
