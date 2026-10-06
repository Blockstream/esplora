const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('fs')
const path = require('path')
const { createHash } = require('crypto')
const { execFileSync } = require('child_process')
const pug = require('pug')
const { hashAssets } = require('../scripts/hash-assets')
const l10n = require('../client/src/l10n').default

const root = path.resolve(__dirname, '..')
const digest = content => createHash('sha256').update(content).digest('hex').slice(0, 12)

function fixture(t) {
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true })
  const directory = fs.mkdtempSync(path.join(root, 'dist', 'hash-test-'))
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }))
  const files = {
    'app.js': 'app',
    'instascan.min.js': 'scanner',
    'js/infinite-scroll.js': 'scroll',
    'font/example.woff2': 'font two',
    'font/example.woff': 'font one',
    'font/example.ttf': 'font ttf',
    'font/unused.ttf': 'unused',
    'style.css': 'a{src:url("font/example.woff2?#v1")}b{src:url(./font/example.woff)}c{src:url(/font/example.ttf)}',
    'style-rtl.css': "a{src:url('font/example.ttf')}b{src:url(font/example.woff2)}",
    'img/example.svg': 'image',
    'libwally/wallycore.js': 'wally',
    'index.html': 'html',
    'robots.txt': 'robots',
    'opensearch.xml': 'search',
    'favicon.ico': 'icon',
  }
  for (const [ filename, content ] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(directory, filename)), { recursive: true })
    fs.writeFileSync(path.join(directory, filename), content)
  }
  return { directory, files }
}

test('hashes only phase 1 assets, retains originals, and hashes final CSS bytes', t => {
  const { directory, files } = fixture(t)
  const prepared = hashAssets(directory, true)
  assert.deepEqual(Object.keys(prepared), ['instascan.min.js', 'js/infinite-scroll.js'])
  assert.equal(fs.readFileSync(path.join(directory, 'style.css'), 'utf8'), files['style.css'])
  const manifest = hashAssets(directory)
  assert.equal(Object.keys(manifest).length, 8)
  for (const [ original, hashed ] of Object.entries(manifest)) {
    const content = fs.readFileSync(path.join(directory, original))
    assert.deepEqual(content, fs.readFileSync(path.join(directory, hashed)))
    assert.ok(hashed.endsWith(`.${digest(content)}${path.extname(original)}`))
  }
  for (const filename of Object.keys(files).filter(filename => !manifest[filename])) {
    assert.equal(fs.readFileSync(path.join(directory, filename), 'utf8'), files[filename])
  }
  const css = fs.readFileSync(path.join(directory, manifest['style.css']), 'utf8')
  assert.ok(css.includes(`url("${manifest['font/example.woff2']}?#v1")`))
  assert.ok(css.includes(`url(${manifest['font/example.woff']})`))
  assert.ok(css.includes(`url(/${manifest['font/example.ttf']})`))
  assert.deepEqual(hashAssets(directory), manifest, 'repeated hashing is idempotent')

  fs.appendFileSync(path.join(directory, 'font/example.woff2'), ' changed')
  const changed = hashAssets(directory)
  assert.notEqual(changed['font/example.woff2'], manifest['font/example.woff2'])
  assert.notEqual(changed['style.css'], manifest['style.css'])
  assert.notEqual(changed['style-rtl.css'], manifest['style-rtl.css'])
  assert.equal(changed['app.js'], manifest['app.js'])
})

test('leaves external URLs unchanged and fails on missing local fonts', t => {
  const { directory } = fixture(t)
  const css = 'a{src:url(https://example.com/font.woff2)}b{src:url(//example.com/font.ttf)}c{src:url(data:font/woff;base64,AA)}'
  fs.writeFileSync(path.join(directory, 'style.css'), css)
  hashAssets(directory)
  assert.equal(fs.readFileSync(path.join(directory, 'style.css'), 'utf8'), css)
  fs.writeFileSync(path.join(directory, 'style.css'), 'a{src:url(font/missing.ttf)}')
  assert.throws(() => hashAssets(directory), /ENOENT/)
})

test('HASH_ASSETS=0 skips hashing entirely and renderer loader falls back without a manifest', t => {
  const { directory, files } = fixture(t)
  execFileSync(process.execPath, ['scripts/hash-assets.js', directory], {
    cwd: root, env: { ...process.env, HASH_ASSETS: '0' }
  })
  assert.equal(fs.existsSync(path.join(directory, 'asset-manifest.json')), false)
  for (const [ filename, content ] of Object.entries(files)) {
    assert.equal(fs.readFileSync(path.join(directory, filename), 'utf8'), content)
  }
  const load = env => JSON.parse(execFileSync(process.execPath, ['scripts/asset-manifest.js'], {
    cwd: root, env: { ...process.env, HASH_ASSETS: '1', ASSET_MANIFEST: path.join(directory, 'asset-manifest.json'), ...env }
  }))
  assert.deepEqual(load(), { assetManifest: {} })
  const manifest = hashAssets(directory)
  assert.deepEqual(load(), { assetManifest: manifest })
  assert.deepEqual(load({ HASH_ASSETS: '0' }), { assetManifest: {} })
  assert.deepEqual(load({ ASSET_MANIFEST: '', DEST: directory }), { assetManifest: manifest })
  fs.writeFileSync(path.join(directory, 'asset-manifest.json'), '{broken')
  assert.throws(() => load(), /SyntaxError/)
})

test('template resolves both directions and STATIC_ROOT consistently for every language', t => {
  const previous = process.env.STATIC_ROOT
  process.env.STATIC_ROOT = '/preview/assets/'
  t.after(() => previous === undefined ? delete process.env.STATIC_ROOT : process.env.STATIC_ROOT = previous)
  for (const assetManifest of [undefined, {
    'style.css': 'style.0123456789ab.css',
    'style-rtl.css': 'style-rtl.abcdef012345.css',
    'app.js': 'app.123456789abc.js'
  }]) {
    for (const [ lang, translate ] of Object.entries(l10n)) {
      const html = pug.renderFile(path.join(root, 'client/index.pug'), { assetManifest, t: translate })
          , ltr = assetManifest ? assetManifest['style.css'] : 'style.css'
          , rtl = assetManifest ? assetManifest['style-rtl.css'] : 'style-rtl.css'
          , app = assetManifest ? assetManifest['app.js'] : 'app.js'
      assert.ok(html.includes(`href="/preview/assets/${lang === 'he' ? rtl : ltr}"`), lang)
      assert.ok(html.includes(`data-ltr="/preview/assets/${ltr}" data-rtl="/preview/assets/${rtl}"`))
      assert.ok(html.includes(`src="/preview/assets/${app}"`))
    }
  }
})
