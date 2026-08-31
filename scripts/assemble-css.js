const { promises: fsp } = require('fs')
const path = require('path')

const projectRoot = path.resolve(__dirname, '..')
    , manifestPath = path.join(projectRoot, 'www/css/manifest.json')
    , manifestRoot = path.dirname(manifestPath)
    , manifest = require(manifestPath)

const resolvePath = (root, file) =>
  path.isAbsolute(file) ? file : path.resolve(root, file)

const readCss = files => Promise.all(files.map(file => fsp.readFile(file)))

const assembleCss = async (customCss=[]) => {
  const baseCss = await readCss(
        manifest.map(file => resolvePath(manifestRoot, file)))
      , custom = await readCss(
        customCss.map(file => resolvePath(projectRoot, file)))
      , separatedBaseCss = baseCss.reduce((parts, css, index) => [
        ...parts,
        ...(index ? [ Buffer.from('\n') ] : []),
        css
      ], [])

  return Buffer.concat([ ...separatedBaseCss, ...custom ])
}

const writeCss = async (destination, customCss=[]) =>
  fsp.writeFile(destination, await assembleCss(customCss))

module.exports = { assembleCss, writeCss }

if (require.main === module) {
  const [ destination, ...customCss ] = process.argv.slice(2)

  if (!destination) {
    console.error('Usage: node scripts/assemble-css.js <destination> [custom-css ...]')
    process.exitCode = 1
  }
  else {
    writeCss(destination, customCss).catch(error => {
      console.error(error)
      process.exitCode = 1
    })
  }
}
