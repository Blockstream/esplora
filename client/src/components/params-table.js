// rows: [{ name, optional, in, type, descHtml }]
export const ParamsTable = ({ t, rows }) => {
  const showIn = rows.some(row => row.in)
  return <div className="params-table">
    <div className={`params-table-row params-table-head${showIn ? ' with-in' : ''}`}>
      <span>{t`Name`}</span>
      { showIn ? <span>{t`In`}</span> : '' }
      <span>{t`Type`}</span>
      <span>{t`Description`}</span>
    </div>
    { rows.map(row =>
      <div className={`params-table-row${showIn ? ' with-in' : ''}`}>
        <span className="params-table-name">
          <code>{row.name}</code>
          <span className={row.optional ? 'params-table-optional' : 'params-table-required'}>
            {row.optional ? t`Optional` : t`Required`}
          </span>
        </span>
        { showIn ? <span className="params-table-in">{row.in}</span> : '' }
        <span className="params-table-type">{row.type}</span>
        <span className="params-table-desc" props={{ innerHTML: row.descHtml }}></span>
      </div>) }
  </div>
}
