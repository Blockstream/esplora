const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')

const lazyScripts = [ 'instascan.min.js', 'js/infinite-scroll.js' ]
const stylesheets = [ 'style.css', 'style-rtl.css' ]

function hashAssets(destination, scriptsOnly=false) {
  const root = path.resolve(destination)
      , manifestPath = path.join(root, 'asset-manifest.json')
      , previous = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {}
      , originals = Object.fromEntries(Object.entries(previous).map(([ original, hashed ]) => [ hashed, original ]))
      , manifest = {}

  function copyHashed(relative) {
    if (manifest[relative]) return manifest[relative]
    const content = fs.readFileSync(path.join(root, relative))
        , hash = createHash('sha256').update(content).digest('hex').slice(0, 12)
        , extension = path.extname(relative)
        , hashed = `${relative.slice(0, -extension.length)}.${hash}${extension}`
    fs.writeFileSync(path.join(root, hashed), content)
    manifest[relative] = hashed
    return hashed
  }

  lazyScripts.forEach(copyHashed)

  if (!scriptsOnly) {
    for (const stylesheet of stylesheets) {
      const filename = path.join(root, stylesheet)
          , css = fs.readFileSync(filename, 'utf8')
          , rewritten = css.replace(/url\(\s*(['"]?)([^'"\)]+?)\1\s*\)/gi, (match, quote, url) => {
            // Only local font URLs belong to phase 1. Preserve query strings/fragments.
            if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(url)) return match
            const [ , pathname, suffix ] = url.match(/^([^?#]+)([?#].*)?$/) || []
            if (!pathname || !/\.(woff2?|ttf)$/i.test(pathname)) return match
            const absolute = pathname.startsWith('/')
                , relative = path.posix.normalize(absolute ? pathname.slice(1) : path.posix.join(path.posix.dirname(stylesheet), pathname))
            if (relative.startsWith('../')) throw new Error(`Font URL escapes output directory: ${url}`)
            // Re-running the script must not hash an already hashed filename again.
            const original = originals[relative] || relative
                , hashed = copyHashed(original)
                , rewrittenUrl = absolute ? '/' + hashed : path.posix.relative(path.posix.dirname(stylesheet), hashed)
            return `url(${quote}${rewrittenUrl}${suffix || ''}${quote})`
          })
      fs.writeFileSync(filename, rewritten)
      copyHashed(stylesheet)
    }
    copyHashed('app.js')
  }

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([ a ], [ b ]) => a.localeCompare(b, 'en')))
  fs.writeFileSync(manifestPath, JSON.stringify(sorted, null, 2) + '\n')
  return sorted
}

module.exports = { hashAssets }

if (require.main === module && process.env.HASH_ASSETS !== '0') {
  const [ destination, mode ] = process.argv.slice(2)
  if (!destination || (mode && mode !== '--scripts-only')) {
    throw new Error('Usage: node scripts/hash-assets.js <output-directory> [--scripts-only]')
  }
  hashAssets(destination, mode === '--scripts-only')
}
