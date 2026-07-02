import resumeData from './resume.json'

export const siteName = resumeData.name
export const defaultDescription = resumeData.bio

export function formatPageTitle(pageTitle) {
  return pageTitle ? `${pageTitle} — ${siteName}` : siteName
}

export function toAbsoluteUrl(path) {
  if (!path) return undefined
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  const origin =
    import.meta.env.VITE_SITE_URL?.replace(/\/$/, '') ||
    (typeof window !== 'undefined' ? window.location.origin : '')
  if (!origin) return path
  return new URL(path, `${origin}/`).href
}
