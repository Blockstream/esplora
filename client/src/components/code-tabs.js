import { CodeBlock } from './code-block'

// items: [{ label, code or html }]. Selecting a tab emits its label via data-code-tab.
// children render below the code, inside the same box.
export const CodeTabs = ({ items, selected, title, meta, copyLabel, children = [] }) => {
  const active = items.find(item => item.label == selected) || items[0]
  return <div className="code-tabs">
    <div className="code-tabs-header">
      <div className="code-tabs-list" attrs={{ role: 'tablist' }}>
        { items.map(item =>
          <button type="button" className={`code-tabs-tab${item == active ? ' active' : ''}`}
            attrs={{ role: 'tab', 'aria-selected': String(item == active) }} data-codeTab={item.label}>
            {item.label}
          </button>) }
      </div>
      { meta ? <span className="code-tabs-meta">{meta}</span> : '' }
    </div>
    <div className="code-tabs-body">
      { CodeBlock({ code: active.code, html: active.html, title, copyLabel }) }
      { children }
    </div>
  </div>
}
