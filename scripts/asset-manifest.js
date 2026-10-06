const fs = require('fs')
const path = require('path')

// Shared by the static build and both server-side renderers. Dev needs no manifest.
function loadAssetManifest() {
  if (process.env.HASH_ASSETS === '0') return {}
  const filename = process.env.ASSET_MANIFEST
    || path.resolve(__dirname, '..', process.env.DEST || 'dist', 'asset-manifest.json')
  try {
    return JSON.parse(fs.readFileSync(filename, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return {}
    throw error
  }
}

// Lazy-loaded scripts are referenced from views through env vars. The browser bundle gets
// them from envify at build time; server-side renderers set them from the manifest.
const lazyAssetEnv = {
  INSTASCAN_ASSET: 'instascan.min.js',
  INFINITE_SCROLL_ASSET: 'js/infinite-scroll.js',
}

function exportAssetEnv(manifest, env=process.env) {
  for (const [ name, original ] of Object.entries(lazyAssetEnv)) {
    if (!env[name] && manifest[original]) env[name] = manifest[original]
  }
  return env
}

module.exports = { loadAssetManifest, exportAssetEnv }

if (require.main === module) {
  console.log(JSON.stringify({ assetManifest: loadAssetManifest() }))
}
