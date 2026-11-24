import { CopyIcon } from './icons'

// Fallback for code without build-time highlighting (e.g. live responses):
// double-quoted strings are highlighted and JSON object keys are left plain.
const stringToken = /"(?:[^"\\\n]|\\.)*"(\s*:)?/g

const highlightStrings = code => {
  const parts = []
  let last = 0, match
  while ((match = stringToken.exec(code))) {
    if (match[1]) continue
    parts.push(code.slice(last, match.index), <span className="hljs-string">{match[0]}</span>)
    last = match.index + match[0].length
  }
  parts.push(code.slice(last))
  return parts
}

const entities = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#x27;': "'", '&#39;': "'" }

const htmlText = html => html.replace(/<[^>]+>/g, '').replace(/&(amp|lt|gt|quot|#x27|#39);/g, entity => entities[entity])

// Pass either plain `code` or pre-highlighted `html`.
export const CodeBlock = ({ code, html, title, meta, copyLabel = 'Copy code' }) =>
  <div className="code-block">
    { title || meta ? <div className="code-block-header">
      { title ? <h4 className="code-block-title">{title}</h4> : '' }
      { meta ? <span className="code-block-meta">{meta}</span> : '' }
    </div> : '' }
    <div className="code-block-body">
      { html
        ? <pre><code props={{ innerHTML: html }}></code></pre>
        : <pre><code>{highlightStrings(code)}</code></pre> }
      <button className="table-copy-button code-button-btn code-block-copy" type="button" data-clipboardCopy={html ? htmlText(html) : code} aria-label={copyLabel}>
        <CopyIcon />
      </button>
    </div>
  </div>
