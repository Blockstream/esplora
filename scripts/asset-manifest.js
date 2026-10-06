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

module.exports = { loadAssetManifest }

if (require.main === module) {
  console.log(JSON.stringify({ assetManifest: loadAssetManifest() }))
}
