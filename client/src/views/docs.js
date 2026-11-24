import layout from './layout'
import loader from '../components/loading'
import { CodeBlock } from '../components/code-block'
import { ChevronRightIcon, CopyIcon, InfoIcon } from '../components/icons'
import { CodeTabs } from '../components/code-tabs'
import { MethodBadge } from '../components/method-badge'
import { ParamsTable } from '../components/params-table'
import { docsPageTitle } from '../lib/api-docs-search'

const staticRoot = process.env.STATIC_ROOT || ''

const tierLabel = (t, tier) => tier == 'enterprise' ? t`Enterprise` : t`Free`

// The noscript page can't switch tiers, so it shows Enterprise-only groups regardless.
const showsGroup = (group, tier) => tier == 'enterprise' || !group.enterpriseOnly || !process.browser

const Html = ({ className, html }) => <div className={className} props={{ innerHTML: html }}></div>

// Radio inputs switch the tabs without JS, so they also work on the noscript page.
const TableTabs = ({ messages, items }) => {
  const name = items[0].msg.replace(/\W/g, '-')
  return <div className="docs-tabs">
    { items.flatMap((item, i) => [
      <input className="docs-tabs-input" type="radio" id={`${name}-${i}`} attrs={i == 0 ? { name, checked: true } : { name }} />,
      <label className="code-tabs-tab docs-tabs-tab" attrs={{ for: `${name}-${i}` }}>{messages[item.labelMsg]}</label>,
      Html({ className: 'docs-tabs-panel docs-prose', html: messages[item.msg] }),
    ]) }
  </div>
}

const codeLabels = t => ({
  request: t`Request`,
  response: t`Response`,
  example: t`Code Example`,
  notification: t`Notification`,
})

const paramsHeading = (t, rows) =>
  rows.every(row => row.in == 'path') ? t`Path Parameters`
  : rows.every(row => row.in == 'query') ? t`Query Parameters`
  : t`Parameters`

const tierMeta = (t, items, tier, shownTier) =>
  `${items[0].network} · ${shownTier == tier ? tierLabel(t, shownTier) : t`${tierLabel(t, shownTier)} only`}`

// Pages documented for one tier only (e.g. QuickSync) keep showing that tier.
// Library examples aren't tied to a tier and show every language.
const Examples = ({ t, items, tier, codeLang, untiered, children }) => {
  const shownTier = untiered ? null : items.some(item => item.tier == tier) ? tier : items[0].tier
      , shown = untiered ? items : items.filter(item => item.tier == shownTier)
  return CodeTabs({
    items: shown.map(item => ({ label: item.lang, code: item.code, html: item.html })),
    selected: codeLang,
    title: t`Code Example`,
    meta: untiered ? null : tierMeta(t, shown, tier, shownTier),
    copyLabel: t`Copy code`,
    children,
  })
}

const Block = ({ t, messages, tier, codeLang }) => block => {
  switch (block.type) {
    case 'prose': return Html({ className: 'docs-prose', html: messages[block.msg] })
    case 'notes': return <div className="docs-note">
      <InfoIcon className="docs-note-icon" />
      <ul className="docs-note-list docs-prose">
        { block.notes.map(note => <li props={{ innerHTML: messages[note.msg] }}></li>) }
      </ul>
    </div>
    case 'tiles': return <div className="docs-tiles">
      { block.items.map(item => <div className={`docs-tile docs-tile-${item.method.toLowerCase()}`}>
        { MethodBadge({ method: item.method, label: item.badge }) }
        { Html({ className: 'docs-tile-title', html: messages[item.titleMsg] }) }
        { Html({ className: 'docs-tile-body docs-prose', html: messages[item.msg] }) }
      </div>) }
    </div>
    case 'tabs': return TableTabs({ messages, items: block.items })
    case 'fields': return <p className="docs-fields">
      <span>{t`Available fields:`}</span>
      { block.names.map(name => <code>{name}</code>) }
    </p>
    case 'params': return <div className="docs-params">
      <h4 className="docs-subheading">{paramsHeading(t, block.rows)}</h4>
      { ParamsTable({ t, rows: block.rows.map(row => ({ ...row, descHtml: messages[row.descMsg] })) }) }
    </div>
    case 'examples': return Examples({ t, items: block.items, untiered: block.untiered, tier, codeLang })
    case 'response': return CodeBlock({
      code: block.code,
      html: block.html,
      title: block.labelMsg ? messages[block.labelMsg] : t`Response`,
      meta: [ block.status, block.contentType ].filter(Boolean).join(' · '),
      copyLabel: t`Copy response`,
    })
    case 'code': return CodeBlock({
      code: block.code,
      html: block.html,
      title: block.labelMsg ? messages[block.labelMsg] : codeLabels(t)[block.label],
      meta: block.contentType,
      copyLabel: t`Copy code`,
    })
  }
}

const tryParamNames = page => (page.tryPath.match(/:[a-z_]+/g) || []).map(name => name.slice(1))

const tryParamDefaults = page => page.tryParams[process.env.MENU_ACTIVE] || {}

const TryCode = ({ t, page, result }) =>
  <details className="docs-try">
    <summary>
      <span className="docs-try-toggle"><ChevronRightIcon className="docs-try-chevron" />{t`Try Code`}</span>
      <span className="docs-try-hint">{t`Sends a live request to this network's API from your browser.`}</span>
    </summary>
    <form className="docs-try-form" data-docsTry={page.id} data-docsTryPath={page.tryPath}>
      { tryParamNames(page).map(name =>
        <div>
          <label className="docs-try-field">{name}</label>
          <div className="docs-try-code-submission">
            <div className="docs-try-code-submission-input-ctn">
              <input className="docs-try-code-submission-input" name={name} value={tryParamDefaults(page)[name] || ''} attrs={{ spellcheck: 'false', autocomplete: 'off', required: true }} />
              <button className="table-copy-button docs-try-code-submission-input-copy-btn" type="button" data-clipboardCopyInput={name} aria-label={t`Copy value`}>
                <CopyIcon />
              </button>
            </div>
          </div>
        </div>) }
      <button className="docs-try-send" type="submit" disabled={!!(result && result.loading)}>{t`Send Request`}</button>
    </form>
    { result ? <p className="docs-try-url">GET {result.url}</p> : '' }
    { result && !result.loading ? CodeBlock({
        code: result.body,
        title: t`Response`,
        meta: result.status ? String(result.status) : t`Network error`,
        copyLabel: t`Copy response`,
      }) : '' }
  </details>

const PageHeading = ({ t, page, messages }) =>
  page.method ? <div className="docs-endpoint-heading">
      { MethodBadge({ method: page.method }) }
      <code className="docs-endpoint-path">
        { page.path.split(/(:[a-z_]+)/).map(part => part.startsWith(':') ? <span className="docs-endpoint-param">{part}</span> : part) }
      </code>
      <button className="table-copy-button code-button-btn" type="button" data-clipboardCopy={page.path} aria-label={t`Copy path`}>
        <CopyIcon />
      </button>
      { page.badgeMsg ? <span className="docs-endpoint-badge" props={{ innerHTML: messages[page.badgeMsg] }}></span> : '' }
    </div>
  : page.rpc ? <div className="docs-endpoint-heading">
      { MethodBadge({ method: 'RPC' }) }
      <code className="docs-endpoint-path">{page.rpc}</code>
    </div>
  : <h3 className="docs-page-title">{messages[page.titleMsg]}</h3>

// Responses that follow an example, and Try Code, share the example's box.
const introTypes = [ 'prose', 'fields' ]

const visibleBlocks = blocks => blocks
  .filter(block => !block.liquidOnly || process.env.IS_ELEMENTS)
  .reduce((out, block) => {
    const last = out[out.length - 1]
    if (block.type != 'note') return [ ...out, block ]
    return last && last.type == 'notes'
      ? [ ...out.slice(0, -1), { ...last, notes: [ ...last.notes, block ] } ]
      : [ ...out, { type: 'notes', notes: [ block ] } ]
  }, [])

const pageBody = ({ t, messages, tier, codeLang, docsTry }, page, blocks) => {
  const render = Block({ t, messages, tier, codeLang })
      , lastExamples = blocks.filter(block => block.type == 'examples').pop()
      , tryCode = page.tryPath ? TryCode({ t, page, result: docsTry && docsTry[page.id] }) : null
      , nodes = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type != 'examples') {
      nodes.push(render(block))
      continue
    }
    const responses = []
    while (blocks[i + 1] && blocks[i + 1].type == 'response') responses.push(blocks[++i])
    nodes.push(Examples({
      t, items: block.items, untiered: block.untiered, tier, codeLang,
      children: [ ...responses.map(render), ...(block == lastExamples && tryCode ? [ tryCode ] : []) ],
    }))
  }
  return lastExamples || !tryCode ? nodes : [ ...nodes, tryCode ]
}

const Page = props => page => {
  const blocks = visibleBlocks(page.blocks)
      , introLength = blocks.findIndex(block => !introTypes.includes(block.type))
      , intro = introLength < 0 ? blocks : blocks.slice(0, introLength)
      , render = Block(props)
  return <section className={`docs-page${page.method || page.rpc ? ' docs-endpoint' : ''}`} id={page.id} key={page.id}>
    <div className="docs-page-intro">
      { props.hideTitle ? '' : PageHeading({ t: props.t, page, messages: props.messages }) }
      { intro.map(render) }
    </div>
    { pageBody(props, page, blocks.slice(intro.length)) }
  </section>
}

const sectionsOf = (docs, tier) => docs.groups
  .filter(group => showsGroup(group, tier))
  .flatMap(group => group.sections.map(section => ({ group, section })))

export const findDocsSection = (docs, path) => {
  const sections = sectionsOf(docs, 'enterprise')
  return path ? sections.find(({ section }) => section.path == path) : sections[0]
}

const SectionLink = ({ messages, entry, className, label }) => entry
  ? <a className={className} href={`docs/${entry.section.path}`}>
      <span className="docs-pager-label">{label}</span>
      <span>{messages[entry.section.titleMsg]}</span>
    </a>
  : <span></span>

const EnterpriseOnly = ({ t }) =>
  <div className="docs-enterprise-only">
    <p>{t`This section is available on the Enterprise tier.`}</p>
    <button type="button" className="docs-try-send" data-docsTier="enterprise">{t`Show Enterprise docs`}</button>
  </div>

const Content = ({ t, docs, messages, tier, codeLang, docsTry, current }) => {
  const sections = sectionsOf(docs, tier)
      , index = sections.findIndex(entry => entry.section == current.section)
      , { group, section } = current
      , isFirstInGroup = group.sections[0] == section
      , hidden = !showsGroup(group, tier)
  return <div className="docs-content" key={section.path} attrs={{ 'data-docs-section': section.path }}>
    <div className="docs-section">
      <h1 className="docs-section-title font-h3">{messages[section.titleMsg]}</h1>
      <div className="docs-section-body">
        { hidden ? EnterpriseOnly({ t }) : [
          ...(isFirstInGroup ? visibleBlocks(group.blocks).map(Block({ t, messages, tier, codeLang })) : []),
          // The landing page's first entry (Introduction) sits directly under the section title.
          ...section.pages.map((page, i) => Page({ t, messages, tier, codeLang, docsTry, hideTitle: index == 0 && i == 0 })(page)),
        ] }
      </div>
    </div>
    { index < 0 ? '' : <nav className="docs-pager">
      { SectionLink({ messages, entry: sections[index - 1], className: 'docs-pager-prev', label: t`Previous` }) }
      { SectionLink({ messages, entry: sections[index + 1], className: 'docs-pager-next', label: t`Next` }) }
    </nav> }
  </div>
}

const SectionBar = ({ t, messages, current, activeId, expanded }) => {
  const pages = current ? current.section.pages : []
      , page = pages.find(page => page.id == activeId) || pages[0]
  return <button type="button" className="docs-nav-toggle" data-docsNavToggle={expanded ? 'close' : 'open'}
    attrs={{ 'aria-expanded': String(expanded), 'aria-label': t`Browse sections` }}>
    <span className="docs-nav-toggle-section">{current ? messages[current.section.titleMsg] : ''}</span>
    { page ? [
      <ChevronRightIcon className="docs-nav-toggle-separator" />,
      <span className="docs-nav-toggle-page">{docsPageTitle(page, messages)}</span>
    ] : '' }
    <ChevronRightIcon className="docs-nav-toggle-chevron" />
  </button>
}

const Sidebar = ({ t, docs, messages, tier, filter, hits, activeHit, activeId, current, navOpen }) => {
  const visible = hits && new Set(hits)
      , highlighted = hits && activeHit
      , currentPath = current && current.section.path
      , expanded = !!(navOpen || hits)
  return <aside className={`docs-sidebar${expanded ? ' nav-open' : ''}`}>
    { SectionBar({ t, messages, current, activeId, expanded }) }
    <div className="docs-sidebar-panel">
      <div className="docs-sidebar-block">
        <p className="docs-sidebar-label">{t`API Tier`}</p>
        <div className="docs-tier-toggle">
          { [ 'free', 'enterprise' ].map(option =>
            <button type="button" className={`docs-tier-option${option == tier ? ' active' : ''}`}
              attrs={{ 'aria-pressed': String(option == tier) }} data-docsTier={option}>
              {tierLabel(t, option)}
            </button>) }
        </div>
      </div>
      <label className="docs-filter">
        <img src={`${staticRoot}img/icons/magnifying-glass.svg`} alt="" />
        <input className="docs-filter-input" type="search" placeholder={t`Filter`} value={filter}
          attrs={{ 'aria-label': t`Filter documentation`, autocomplete: 'off', spellcheck: 'false' }} />
        <kbd>⌘K</kbd>
      </label>
      <nav className="docs-nav">
        { hits && !hits.length ? <p className="docs-nav-empty">{t`No matches`}</p> : '' }
        { docs.groups.filter(group => showsGroup(group, tier)).map(group => {
          const sections = group.sections
            .map(section => ({ section, pages: section.pages.filter(page => !visible || visible.has(page.id)) }))
            .filter(({ pages }) => pages.length)
          return sections.length ? <div className="docs-nav-group">
            <a className="docs-nav-group-title" href={`docs/${group.sections[0].path}`}>{messages[group.titleMsg]}</a>
            { sections.map(({ section, pages }) =>
              <details className="docs-nav-section" attrs={section.path == currentPath || hits ? { open: true } : {}}>
                <summary className={section.path == currentPath ? 'active' : ''}>{messages[section.titleMsg]}</summary>
                { pages.map(page =>
                  <a href={`docs/${section.path}#${page.id}`} className={`docs-nav-link${page.id == activeId ? ' active' : ''}${page.id == highlighted ? ' highlighted' : ''}`}>
                    {docsPageTitle(page, messages)}
                  </a>) }
              </details>) }
          </div> : ''
        }) }
      </nav>
    </div>
  </aside>
}

const DocsBody = ({ t, docs, docsMessages, docsError, docsTier, docsCodeLang, docsFilter, docsHits, docsActiveHit, docsActiveId, docsScrollId, docsTry, docsSectionPath, docsNavOpen }) => {
  if (!docs || !docsMessages) return docsError ? <p className="docs-error">{t`Failed to load the documentation.`}</p> : loader()
  const current = findDocsSection(docs, docsSectionPath)
  return [
    Sidebar({ t, docs, messages: docsMessages, tier: docsTier, filter: docsFilter, hits: docsHits, activeHit: docsActiveHit, activeId: docsScrollId || docsActiveId, current, navOpen: docsNavOpen }),
    current
      ? Content({ t, docs, messages: docsMessages, tier: docsTier, codeLang: docsCodeLang, docsTry, current })
      : <div className="docs-content"><p className="docs-error">{t`This documentation page does not exist.`}</p></div>
  ]
}

export default S => layout(
  <div className="docs-layout container">{ DocsBody(S) }</div>
, { ...S, activeTab: 'docs' })
