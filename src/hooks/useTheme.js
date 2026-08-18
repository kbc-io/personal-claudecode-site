import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'theme'

/** localStorage throws in some privacy modes; theme is never worth a crash. */
function readStored() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

function systemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

/**
 * Resolved theme plus a toggle.
 *
 * With no explicit choice stored, the site follows the OS setting and keeps
 * following it — no `data-theme` attribute is set, so the CSS media query
 * stays in charge and later OS changes are picked up live. Choosing a theme
 * stamps `data-theme` on <html>, which wins over the media query in both
 * directions, and persists.
 *
 * The initial attribute is also applied by an inline script in index.html so
 * the first paint is already correct; this hook adopts that state rather
 * than fighting it.
 */
export function useTheme() {
  const [theme, setTheme] = useState(() => readStored() ?? systemTheme())
  const [isExplicit, setIsExplicit] = useState(() => readStored() !== null)

  // Follow the OS while the visitor has not made an explicit choice.
  useEffect(() => {
    if (isExplicit) return
    const mq = window.matchMedia('(prefers-color-scheme: light)')
    const onChange = () => setTheme(mq.matches ? 'light' : 'dark')
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [isExplicit])

  useEffect(() => {
    if (isExplicit) {
      document.documentElement.setAttribute('data-theme', theme)
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }, [theme, isExplicit])

  const toggle = useCallback(() => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark'
      try {
        localStorage.setItem(STORAGE_KEY, next)
      } catch {
        /* preference just won't persist */
      }
      return next
    })
    setIsExplicit(true)
  }, [])

  return { theme, toggle }
}
