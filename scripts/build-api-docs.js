// Compiles docs/api.md into a locale-independent structure (api-docs.json) and
// one message catalog per locale (api-docs.<locale>.json). Prose lives only in
// the catalogs, keyed by stable ids, so translations can be added as
// docs/i18n/<locale>.json without touching code or examples.
//
// Translation files map message ids to { "message": markdown, "source": hash },
// where "source" is the hash of the English text that was translated. A
// mismatch means the English changed since, and the build warns about it.
const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const { marked } = require('marked')
const hljs = require('highlight.js/lib/core')

hljs.registerLanguage('bash', require('highlight.js/lib/languages/bash'))
hljs.registerLanguage('python', require('highlight.js/lib/languages/python'))
hljs.registerLanguage('javascript', require('highlight.js/lib/languages/javascript'))
hljs.registerLanguage('json', require('highlight.js/lib/languages/json'))
hljs.registerLanguage('rust', require('highlight.js/lib/languages/rust'))
hljs.registerLanguage('toml', require('highlight.js/lib/languages/ini'))
hljs.registerLanguage('go', require('highlight.js/lib/languages/go'))

const defaultLocale = 'en'

const endpointHeading = /^(GET|POST|SSE) (\/\S+)$/
    , rpcHeading = /^[a-z_]+(\.[a-z_]+)+$/
    , anchoredHeading = /^(.*?)\s*\{#([a-z0-9-]+)\}$/
    , exampleLabel = /^Example \(([^,]+), (Free|Enterprise)\):$/
    , responseLabel = /^Example response \((\d{3})(?:, ([^)]+))?\):$/
    , keywordsComment = /^<!-- keywords: (.*) -->\s*$/
    // <!-- tiles --> turns the next list of "`Badge` **Title**: text" items into cards;
    // <!-- tabs --> turns the following "##### Label" + table pairs into one tabbed table.
    , layoutComment = /^<!-- (tiles|tabs) -->\s*$/
    // Tile badges take the color of the request method their interface uses.
    , tileBadgeMethods = { REST: 'GET', RPC: 'RPC', QuickSync: 'SSE' }
    , knownCodeLabels = { 'Request:': 'request', 'Response:': 'response', 'Code Example:': 'example', 'Notification:': 'notification' }
    // Messages rendered as plain text rather than markdown.
    , plainMessage = /\.(title|keywords|l\d+)$/
    , labelMeta = /^(.*?) \((?:(\d{3}), )?([a-z]+\/[a-z.+-]+)\):$/
    // Notes that only concern Liquid users; the explorer shows them on Elements networks only.
    , liquidNote = /^(\*\*)?(Liquid\b|Not available on Liquid|Bitcoin only)/
    , enterpriseOnlyGroups = [ 'proto-quicksync' ]
    // [ URL pattern, label shown on examples, the network's MENU_ACTIVE name ]
    , exampleNetworks = [
      [ /blockstream\.info\/liquidtestnet\/|elements-testnet\./, 'Liquid Testnet', 'Liquid Testnet' ],
      [ /blockstream\.info\/liquid\/|elements-mainnet\./, 'Liquid', 'Liquid' ],
      [ /blockstream\.info\/testnet4\/|bitcoin-testnet4\./, 'Bitcoin Testnet4', 'Bitcoin Testnet4' ],
      [ /blockstream\.info\/testnet\/|bitcoin-testnet\./, 'Bitcoin Testnet3', 'Bitcoin Testnet' ],
      [ /blockstream\.info\/signet\/|bitcoin-signet\./, 'Bitcoin Signet', 'Bitcoin Signet' ],
    ]
    , mainnetNetwork = [ null, 'Bitcoin', 'Bitcoin' ]

const findExampleNetwork = code => exampleNetworks.find(([ pattern ]) => pattern.test(code)) || mainnetNetwork
const exampleNetwork = code => findExampleNetwork(code)[1]

const fenceLabels = { bash: 'Shell', python: 'Python', javascript: 'JavaScript', rust: 'Rust', go: 'Go', toml: 'TOML', json: 'JSON' }

// Consecutive "Code Example" blocks in different languages become one tabbed example.
const mergeLanguageExamples = blocks => blocks.reduce((out, block) => {
  const last = out[out.length - 1]
      , isExample = b => b.type == 'code' && b.label == 'example' && fenceLabels[b.fence]
      , item = b => ({ lang: fenceLabels[b.fence], fence: b.fence, code: b.code })
  if (!isExample(block)) return [ ...out, block ]
  if (last && last.type == 'examples' && last.untiered && !last.items.some(i => i.fence == block.fence))
    return [ ...out.slice(0, -1), { ...last, items: [ ...last.items, item(block) ] } ]
  if (last && isExample(last) && last.fence != block.fence)
    return [ ...out.slice(0, -1), { type: 'examples', untiered: true, items: [ item(last), item(block) ] } ]
  return [ ...out, block ]
}, [])

const isJson = code => {
  try { JSON.parse(code); return true } catch (e) { return false }
}

// Highlighted at build time so the client bundle doesn't need a highlighter.
const highlight = ({ fence, code }) => {
  const language = hljs.getLanguage(fence) ? fence : !fence && isJson(code) ? 'json' : null
  return language
    ? hljs.highlight(code, { language }).value.replace(/<span class="hljs-punctuation">([^<]*)<\/span>/g, '$1')
    : null
}

const withHighlighting = block => {
  if (block.items) return { ...block, items: block.items.map(withHighlighting) }
  const html = block.code != null && highlight(block)
  if (!html) return block
  const { code, ...rest } = block
  return { ...rest, html }
}

const sourceHash = text => createHash('sha256').update(text).digest('hex').slice(0, 8)

const slug = text => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const parseHeading = text => {
  const [ , title, id ] = text.match(anchoredHeading) || [ null, text, null ]
  return { title, id }
}

const backticked = text => (text.match(/`[^`]+`/g) || []).map(s => s.slice(1, -1))

// cURL examples call the documented path with real values; reuse them to prefill
// Try Code, keyed by MENU_ACTIVE since Try Code calls the current network's API.
// Free examples take precedence; networks without an example get empty inputs.
const exampleParams = (page, pathParams) => {
  const pattern = new RegExp('^' + page.tryPath.replace(/[.*+?^${}()|\\]/g, '\\$&').replace(/:([a-z_]+)/g, '([^/]+)'))
      , examples = page.blocks.filter(b => b.type == 'examples').flatMap(b => b.items)
        .filter(item => item.lang == 'cURL')
        .sort((a, b) => (a.tier == 'free' ? 0 : 1) - (b.tier == 'free' ? 0 : 1))
  return examples.reduce((params, example) => {
    const network = findExampleNetwork(example.code)[2]
        , url = (example.code.match(/"(https?:\/\/[^"]+)"/) || [])[1]
        , match = url && url.replace(/^https?:\/\/[^/]+(\/[a-z0-9]+)?\/api/, '').match(pattern)
    if (params[network] || !match) return params
    return { ...params, [network]: Object.fromEntries(pathParams.map((name, i) => [ name, decodeURIComponent(match[i + 1]) ])) }
  }, {})
}

const hasBinaryResponse = page =>
  page.blocks.some(b => b.type == 'response' && b.contentType == 'application/octet-stream')

function parseDocs(markdown) {
  const tokens = marked.lexer(markdown)
      , messages = {}
      , groups = []
      , anchorOwners = {}
  let group = null, section = null, page = null, owner = null, proseRun = null

  const message = (id, text) => {
    if (messages[id] != null) throw new Error(`Duplicate message id: ${id}`)
    messages[id] = text.trim()
    return id
  }
  const nextId = kind => `${owner.id}.${kind}${owner.counter++}`
  const pushBlock = block => {
    proseRun = null
    owner.blocks.push(block)
  }
  const appendProse = raw => {
    if (!proseRun) {
      proseRun = { type: 'prose', msg: nextId('p') }
      owner.blocks.push(proseRun)
      messages[proseRun.msg] = ''
    }
    messages[proseRun.msg] += raw
  }
  const pushCode = (label, code) => {
    let m
    if ((m = label.match(exampleLabel))) {
      const last = owner.blocks[owner.blocks.length - 1]
          , item = { lang: m[1], tier: m[2].toLowerCase(), network: exampleNetwork(code.text), fence: code.lang || '', code: code.text }
      if (last && last.type == 'examples') last.items.push(item)
      else pushBlock({ type: 'examples', items: [ item ] })
    } else if ((m = label.match(responseLabel))) {
      pushBlock({ type: 'response', status: +m[1], contentType: m[2] || null, fence: code.lang || '', code: code.text })
    } else if (knownCodeLabels[label]) {
      pushBlock({ type: 'code', label: knownCodeLabels[label], fence: code.lang || '', code: code.text })
    } else if ((m = label.match(labelMeta))) {
      const labelMsg = message(nextId('l'), m[1])
      pushBlock(m[2]
        ? { type: 'response', labelMsg, status: +m[2], contentType: m[3], fence: code.lang || '', code: code.text }
        : { type: 'code', labelMsg, contentType: m[3], fence: code.lang || '', code: code.text })
    } else {
      pushBlock({ type: 'code', labelMsg: message(nextId('l'), label.replace(/:$/, '')), fence: code.lang || '', code: code.text })
    }
  }
  const pushParams = table => {
    const columns = table.header.map(cell => cell.text)
        , hasIn = columns[1] == 'In'
    pushBlock({
      type: 'params',
      rows: table.rows.map(cells => {
        const [ name ] = backticked(cells[0].text)
            , baseId = `${owner.id}.param.${name}`
            , descMsg = message(messages[baseId] == null ? baseId : `${baseId}-${owner.counter++}`, cells[cells.length - 1].text)
        return {
          name,
          optional: /\(optional\)/.test(cells[0].text),
          in: hasIn ? cells[1].text : null,
          type: cells[hasIn ? 2 : 1].text,
          descMsg
        }
      })
    })
  }

  const skipSpace = j => tokens[j] && tokens[j].type == 'space' ? j + 1 : j
  // Returns the index of the last token consumed.
  const pushTiles = i => {
    const j = skipSpace(i + 1), list = tokens[j]
    if (!list || list.type != 'list') throw new Error(`${owner.id}: <!-- tiles --> must precede a list`)
    pushBlock({ type: 'tiles', items: list.items.map(item => {
      const [ , badge, title, text ] = item.text.match(/^`([^`]+)`\s+\*\*(.+?)\*\*:?\s*([\s\S]*)$/) || []
      if (!title || !tileBadgeMethods[badge]) throw new Error(`${owner.id}: each tile must start with a known \`Badge\` and a **title**`)
      return { badge, method: tileBadgeMethods[badge], titleMsg: message(nextId('tile'), title), msg: message(nextId('tile'), text) }
    }) })
    return j
  }
  const pushTabs = i => {
    const items = []
    let last = i
    for (let j = skipSpace(i + 1); tokens[j] && tokens[j].type == 'heading' && tokens[j].depth == 5; j = skipSpace(last + 1)) {
      const table = tokens[skipSpace(j + 1)]
      if (!table || table.type != 'table') break
      items.push({ labelMsg: message(nextId('l'), tokens[j].text), msg: message(nextId('t'), table.raw) })
      last = skipSpace(j + 1)
    }
    if (items.length < 2) throw new Error(`${owner.id}: <!-- tabs --> needs at least two "##### Label" + table pairs`)
    pushBlock({ type: 'tabs', items })
    return last
  }

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i]

    if (token.type == 'heading' && token.depth <= 4) {
      const { title, id } = parseHeading(token.text)
      proseRun = null
      if (token.depth == 1) { owner = null; continue }
      if (token.depth == 2) {
        group = { id: id || slug(title), slug: slug(title), titleMsg: null, blocks: [], sections: [], counter: 0 }
        if (enterpriseOnlyGroups.includes(group.id)) group.enterpriseOnly = true
        group.titleMsg = message(`group.${group.id}.title`, title)
        groups.push(owner = group)
        continue
      }
      if (token.depth == 3) {
        section = { path: `${group.slug}/${slug(title)}`, titleMsg: message(`section.${group.id}.${slug(title)}.title`, title), pages: [] }
        group.sections.push(section)
        continue
      }
      if (!id) throw new Error(`Page heading without an {#id}: ${token.text}`)
      const endpoint = title.match(endpointHeading)
      page = { id, blocks: [], counter: 0 }
      if (endpoint) {
        page.method = endpoint[1]
        page.path = endpoint[2]
      } else if (rpcHeading.test(title)) {
        page.rpc = title
      } else {
        page.titleMsg = message(`${id}.title`, title)
      }
      section.pages.push(owner = page)
      anchorOwners[id] = section

      // Endpoint pages open with "**Title**" and an optional "· badge".
      const next = tokens[i + 1] && tokens[i + 1].type == 'space' ? tokens[i + 2] : tokens[i + 1]
      const titleLine = endpoint && next && next.type == 'paragraph' && next.text.match(/^\*\*([^*]+)\*\*(?: · (.+))?$/)
      if (titleLine) {
        page.titleMsg = message(`${id}.title`, titleLine[1])
        if (titleLine[2]) page.badgeMsg = message(`${id}.badge`, titleLine[2])
        i = tokens.indexOf(next)
      }
      continue
    }

    if (!owner) continue

    if (token.type == 'space') {
      if (proseRun) messages[proseRun.msg] += token.raw
      continue
    }

    if (token.type == 'html') {
      const keywords = token.text.match(keywordsComment)
          , layout = token.text.match(layoutComment)
      if (keywords) message(`${owner.id}.keywords`, keywords[1])
      if (layout) i = layout[1] == 'tiles' ? pushTiles(i) : pushTabs(i)
      continue
    }

    if (token.type == 'paragraph') {
      const lines = token.text.split('\n')
          , label = lines[lines.length - 1]
          , nextToken = tokens[i + 1]
      if (lines.length == 1 && /^Fields: /.test(label)) {
        pushBlock({ type: 'fields', names: backticked(label) })
        continue
      }
      if (nextToken && nextToken.type == 'code' && /:$/.test(label)) {
        if (lines.length > 1) appendProse(lines.slice(0, -1).join('\n') + '\n\n')
        pushCode(label, nextToken)
        i++
        continue
      }
    }

    if (token.type == 'code') {
      pushBlock({ type: 'code', fence: token.lang || '', code: token.text })
      continue
    }

    if (token.type == 'table' && token.header[0].text == 'Param') {
      pushParams(token)
      continue
    }

    if (token.type == 'blockquote') {
      pushBlock({ type: 'note', liquidOnly: liquidNote.test(token.text), msg: message(nextId('n'), token.text) })
      continue
    }

    if (token.type == 'heading') {
      const { id } = parseHeading(token.text)
      if (id) anchorOwners[id] = section || group
    }
    appendProse(token.raw)
  }

  groups.forEach(g => g.sections.forEach(s => s.pages.forEach(p => {
    if (!p.blocks.length && !p.titleMsg) throw new Error(`Page ${p.id} has no content`)
    p.blocks = mergeLanguageExamples(p.blocks)
    // Try Code shows responses as text, so binary endpoints don't offer it
    if (g.id == 'proto-rest' && p.method == 'GET' && !hasBinaryResponse(p)) {
      p.tryPath = p.path.replace(/\[[^\]]*\]/g, '')
      p.tryParams = exampleParams(p, (p.tryPath.match(/:[a-z_]+/g) || []).map(name => name.slice(1)))
    }
  })))

  // Every anchor resolves to "<section path>#<id>"; group anchors open the group's first section.
  const anchors = Object.fromEntries([
    ...groups.map(g => [ g.id, g.sections[0].path ]),
    ...Object.entries(anchorOwners).map(([ id, owner ]) =>
      [ id, owner.path ? `${owner.path}#${id}` : owner.sections[0].path ]),
  ])
  const paths = groups.flatMap(g => g.sections.map(s => s.path))
  if (new Set(paths).size != paths.length) throw new Error('Duplicate section paths')

  const strip = ({ counter, slug, ...rest }) => rest.blocks ? { ...rest, blocks: rest.blocks.map(withHighlighting) } : rest
  return {
    structure: {
      anchors,
      groups: groups.map(g => ({
        ...strip(g),
        sections: g.sections.map(s => ({ ...s, pages: s.pages.map(strip) }))
      }))
    },
    messages
  }
}

const renderMessages = (messages, anchors) => {
  const renderer = new marked.Renderer()
      , link = renderer.link.bind(renderer)
  renderer.link = (href, title, text) => {
    if (href.startsWith('#') && !anchors[href.slice(1)]) throw new Error(`Unknown docs anchor: ${href}`)
    return link(href.startsWith('#') ? `docs/${anchors[href.slice(1)]}` : href, title, text)
  }
  renderer.heading = (text, level, raw) => {
    const { id } = parseHeading(raw)
    return `<h${level}${id ? ` id="${id}"` : ''}>${text.replace(/\s*\{#[a-z0-9-]+\}$/, '')}</h${level}>\n`
  }
  const options = { gfm: true, breaks: true, headerIds: false, renderer }

  return Object.fromEntries(Object.entries(messages).map(([ id, text ]) =>
    [ id, plainMessage.test(id) ? text : marked.parse(text, options).trim() ]))
}

const readTranslations = (i18nDir, enMessages) => {
  if (!i18nDir || !fs.existsSync(i18nDir)) return {}
  return Object.fromEntries(fs.readdirSync(i18nDir).filter(f => f.endsWith('.json')).map(file => {
    const locale = path.basename(file, '.json')
        , entries = JSON.parse(fs.readFileSync(path.join(i18nDir, file), 'utf8'))
        , stale = Object.entries(entries).filter(([ id, { source } ]) => enMessages[id] != null && source != sourceHash(enMessages[id]))
    if (stale.length) console.warn(`api-docs: ${locale} has ${stale.length} stale translations, e.g. ${stale[0][0]}`)
    const merged = { ...enMessages }
    Object.entries(entries).forEach(([ id, { message } ]) => enMessages[id] != null && (merged[id] = message))
    return [ locale, merged ]
  }))
}

function buildApiDocs(sourcePath, i18nDir) {
  const { structure, messages } = parseDocs(fs.readFileSync(sourcePath, 'utf8'))
      , catalogs = { [defaultLocale]: messages, ...readTranslations(i18nDir, messages) }
  return {
    structure: { ...structure, locales: Object.keys(catalogs) },
    messages: Object.fromEntries(Object.entries(catalogs).map(([ locale, catalog ]) => [ locale, renderMessages(catalog, structure.anchors) ])),
    sourceHashes: Object.fromEntries(Object.entries(messages).map(([ id, text ]) => [ id, sourceHash(text) ]))
  }
}

// The Markdown published for LLMs drops build annotations and links cross-references
// to the docs pages, relative to /docs/llms-full.md.
const publishedMarkdown = (markdown, anchors) => markdown
  .replace(/ \{#[a-z0-9-]+\}$/gm, '')
  .replace(/^<!-- (keywords: .*|tiles|tabs) -->\n\n?/gm, '')
  .replace(/\]\(#([a-z0-9-]+)\)/g, (_, id) => `](${anchors[id]})`)

// The llms.txt files are hand-written; fail if one of their docs links stops resolving.
const checkLlmsLinks = (text, structure) => {
  const paths = new Set(structure.groups.flatMap(g => g.sections.map(s => s.path)).concat('llms.txt', 'llms-full.md'))
      , links = [ ...text.matchAll(/https:\/\/blockstream\.info\/docs\/([^)#\s]+)(?:#([a-z0-9-]+))?/g) ]
  links.forEach(([ url, path, id ]) => {
    if (!paths.has(path) || (id && structure.anchors[id] != `${path}#${id}`)) throw new Error(`llms.txt: broken docs link ${url}`)
  })
}

function buildLlmsFiles(sourcePath, structure) {
  const llmsPath = path.join(path.dirname(sourcePath), 'llms.txt')
      , llms = fs.readFileSync(llmsPath, 'utf8')
  checkLlmsLinks(llms, structure)
  return { llms, full: publishedMarkdown(fs.readFileSync(sourcePath, 'utf8'), structure.anchors) }
}

module.exports = { buildApiDocs, buildLlmsFiles, checkLlmsLinks }

if (require.main === module) {
  const [ sourcePath, i18nDir, destination ] = process.argv.slice(2)
  const { structure, messages } = buildApiDocs(sourcePath, i18nDir)
      , pages = structure.groups.flatMap(g => g.sections.flatMap(s => s.pages))
      , blocks = pages.flatMap(p => p.blocks)
      , count = type => blocks.filter(b => b.type == type).length

  const llmsFiles = buildLlmsFiles(sourcePath, structure)
  checkLlmsLinks(fs.readFileSync(path.join(__dirname, '../www/llms.txt'), 'utf8'), structure)
  fs.mkdirSync(path.join(destination, 'docs'), { recursive: true })
  fs.writeFileSync(path.join(destination, 'docs/llms.txt'), llmsFiles.llms)
  fs.writeFileSync(path.join(destination, 'docs/llms-full.md'), llmsFiles.full)
  fs.writeFileSync(path.join(destination, 'api-docs.json'), JSON.stringify(structure))
  Object.entries(messages).forEach(([ locale, catalog ]) =>
    fs.writeFileSync(path.join(destination, `api-docs.${locale}.json`), JSON.stringify(catalog)))
  console.log(`api-docs: ${pages.length} pages, ${blocks.filter(b => b.type == 'examples').flatMap(b => b.items).length} examples, `
    + `${count('params')} param tables, ${count('response')} responses, locales: ${structure.locales.join(', ')}`)
}
