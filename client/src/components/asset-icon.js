import { DefaultAssetIcon } from './icons'
import loader from './loading'

const watchImage = vnode => {
  const container = vnode.elm
      , image = container.querySelector('img')

  if (!image) return
  const settle = loaded => {
    container.classList.remove('asset-icon-loading')
    container.classList.toggle('asset-icon-loaded', loaded)
    container.setAttribute('aria-busy', 'false')
  }
  image.onload = () => settle(image.naturalWidth > 0)
  image.onerror = () => settle(false)
  if (image.complete) settle(image.naturalWidth > 0)
}

const stopWatchingImage = vnode => {
  const image = vnode.elm.querySelector('img')
  if (image) image.onload = image.onerror = null
}

export default ({ href }) => {
  const src = typeof href === 'string' && /^https?:\/\//i.test(href) ? href : null
      , loading = !!src && process.browser

  return (
    <div
      className={`asset-icon-container${loading ? ' asset-icon-loading' : src ? ' asset-icon-loaded' : ''}`}
      key={src || 'default'}
      aria-busy={loading ? 'true' : 'false'}
      hook-insert={watchImage}
      hook-destroy={stopWatchingImage}
    >
      <DefaultAssetIcon />
      {loading ? <div className="asset-icon-loading-indicator" aria-hidden="true">{loader('small', { immediate: true })}</div> : null}
      {src ? <img className="asset-icon-image" src={src} alt="" attrs-referrerpolicy="no-referrer" /> : null}
    </div>
  )
}
