export const docsPages = docs => docs.groups.flatMap(group =>
  group.sections.flatMap(section => section.pages.map(page => ({ group, section, page }))))

export const docsPageTitle = (page, messages) => page.titleMsg ? messages[page.titleMsg] : page.rpc

const htmlText = html => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ')

// Mirrors the standalone docs: pages with curated keywords use them, endpoints
// fall back to their summary.
export const buildDocsSearchIndex = (docs, messages) => docsPages(docs).map(({ group, section, page }) => {
  const summary = page.blocks.find(block => block.type == 'prose')
  return {
    id: page.id,
    enterpriseOnly: !!group.enterpriseOnly,
    s: [ docsPageTitle(page, messages), page.path, messages[section.titleMsg] ].filter(Boolean).join(' ').toLowerCase(),
    k: (messages[`${page.id}.keywords`] || (summary ? htmlText(messages[summary.msg]) : '')).toLowerCase()
  }
})

// Every word must match. Title and path matches rank ahead of keyword matches.
export const searchDocs = (index, query) => {
  const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (!words.length) return null

  const inTitle = entry => words.every(word => entry.s.includes(word) || entry.id.includes(word))
      , inKeywords = entry => words.every(word => entry.s.includes(word) || entry.id.includes(word) || entry.k.includes(word))

  return [
    ...index.filter(inTitle),
    ...index.filter(entry => !inTitle(entry) && inKeywords(entry))
  ].map(entry => entry.id)
}
