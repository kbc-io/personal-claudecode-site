import { useEffect } from 'react'

const SITE_NAME = 'Kevin Coalwell'
const DEFAULT_DESCRIPTION =
  'Product and brand designer working on interfaces for complex technical systems.'

function setMeta(selector, attr, value, content) {
  let el = document.head.querySelector(selector)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, value)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

/**
 * Sets the document title and the description/Open Graph tags for a route.
 *
 * This is a client-rendered SPA, so crawlers that do not execute JavaScript
 * still receive the static tags from index.html. These per-route updates
 * cover in-app navigation, browser history, and bookmarking; a prerender
 * step would be required for per-route crawlability.
 */
export function usePageMeta({ title, description } = {}) {
  useEffect(() => {
    const fullTitle = title ? `${title} — ${SITE_NAME}` : SITE_NAME
    const desc = description || DEFAULT_DESCRIPTION

    document.title = fullTitle
    setMeta('meta[name="description"]', 'name', 'description', desc)
    setMeta('meta[property="og:title"]', 'property', 'og:title', fullTitle)
    setMeta('meta[property="og:description"]', 'property', 'og:description', desc)
    setMeta('meta[property="og:url"]', 'property', 'og:url', window.location.href)
    setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', fullTitle)
    setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', desc)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname)
  }, [title, description])
}
