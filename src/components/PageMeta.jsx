import { useEffect } from 'react'
import { formatPageTitle, toAbsoluteUrl } from '../data/siteMeta'

const MANAGED = 'data-page-meta'

function upsertMeta({ attr, key, content }) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"][${MANAGED}]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    el.setAttribute(MANAGED, '')
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink({ rel, href }) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"][${MANAGED}]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    el.setAttribute(MANAGED, '')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

function PageMeta({ title, description, image, path }) {
  useEffect(() => {
    const pageTitle = formatPageTitle(title)
    const pageUrl = toAbsoluteUrl(path ?? window.location.pathname)
    const imageUrl = toAbsoluteUrl(image)
    const cardType = imageUrl ? 'summary_large_image' : 'summary'

    document.title = pageTitle

    upsertMeta({ attr: 'name', key: 'description', content: description })
    upsertMeta({ attr: 'property', key: 'og:title', content: pageTitle })
    upsertMeta({ attr: 'property', key: 'og:description', content: description })
    upsertMeta({ attr: 'property', key: 'og:type', content: 'website' })
    upsertMeta({ attr: 'property', key: 'og:site_name', content: formatPageTitle() })
    upsertMeta({ attr: 'property', key: 'og:url', content: pageUrl })
    upsertMeta({ attr: 'property', key: 'og:image', content: imageUrl })
    upsertMeta({ attr: 'name', key: 'twitter:card', content: cardType })
    upsertMeta({ attr: 'name', key: 'twitter:title', content: pageTitle })
    upsertMeta({ attr: 'name', key: 'twitter:description', content: description })
    upsertMeta({ attr: 'name', key: 'twitter:image', content: imageUrl })
    upsertLink({ rel: 'canonical', href: pageUrl })
  }, [title, description, image, path])

  return null
}

export default PageMeta
