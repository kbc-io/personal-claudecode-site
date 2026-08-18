import { useEffect, useState } from 'react'
import { usePageMeta } from '../hooks/usePageMeta'

/**
 * A living document of the tokens this site actually runs on.
 *
 * Values are read from the computed :root custom properties rather than
 * hardcoded here, so the page cannot drift from the stylesheet — if a token
 * changes in index.css, this page changes with it.
 */

const COLOR_TOKENS = [
  ['--bg-primary', 'Page background'],
  ['--text-primary', 'Primary text'],
  ['--text-secondary', 'Secondary text'],
  ['--surface-1', 'Surface, lowest'],
  ['--surface-2', 'Surface, image plate'],
  ['--surface-3', 'Surface, raised'],
  ['--border-subtle', 'Divider, decorative'],
  ['--border-interactive', 'Control border'],
  ['--accent', 'Accent']
]

/**
 * Contrast against the current page background, measured from the values the
 * browser actually resolved. Baking the numbers in as text would have gone
 * stale the moment a theme changed — these follow whichever theme is active.
 * Semi-transparent surfaces are skipped: their effective contrast depends on
 * what they are layered over.
 */
function parseRgb(value) {
  const m = value.match(/rgba?\(([^)]+)\)/)
  if (!m) return null
  const parts = m[1].split(/[\s,/]+/).filter(Boolean).map(Number)
  if (parts.length > 3 && parts[3] < 1) return null // translucent
  return parts.slice(0, 3)
}

function relativeLuminance([r, g, b]) {
  const lin = (c) => {
    c /= 255
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrastRatio(a, b) {
  const ca = parseRgb(a)
  const cb = parseRgb(b)
  if (!ca || !cb) return null
  const la = relativeLuminance(ca)
  const lb = relativeLuminance(cb)
  const [hi, lo] = la > lb ? [la, lb] : [lb, la]
  return (hi + 0.05) / (lo + 0.05)
}

const TYPE_ROLES = [
  ['--type-headline-large', 'Headline large', 'Recent Work'],
  ['--type-site-title', 'Site title', 'Kevin Coalwell'],
  ['--type-headline-medium', 'Headline medium', 'AI Learning App'],
  ['--type-headline-small', 'Headline small', 'What we learned'],
  ['--type-body-large', 'Body large', 'The blurb that opens a case study.'],
  ['--type-body-medium', 'Body medium', 'Default running text for the site.'],
  ['--type-body-small', 'Body small', 'Supporting copy and résumé detail.'],
  ['--type-body-xsmall', 'Body xsmall', 'Captions and metadata.']
]

const SPACE_TOKENS = [
  '--space-1', '--space-2', '--space-3', '--space-4', '--space-5',
  '--space-6', '--space-8', '--space-10', '--space-12', '--space-16', '--space-20'
]

function readTokens() {
  if (typeof window === 'undefined') return {}
  const styles = getComputedStyle(document.documentElement)
  const read = (name) => styles.getPropertyValue(name).trim()

  const next = {}
  // Resolve each color through a probe element so custom properties come back
  // as concrete rgb() values that can be measured.
  const probe = document.createElement('span')
  probe.style.display = 'none'
  document.body.appendChild(probe)
  const resolve = (name) => {
    probe.style.color = ''
    probe.style.color = `var(${name})`
    return getComputedStyle(probe).color
  }

  for (const [name] of COLOR_TOKENS) {
    next[name] = read(name)
    next[`${name}--rgb`] = resolve(name)
  }
  probe.remove()
  for (const name of SPACE_TOKENS) next[name] = read(name)
  next['--measure'] = read('--measure')
  for (const [prefix] of TYPE_ROLES) {
    next[`${prefix}-size`] = read(`${prefix}-size`)
    next[`${prefix}-weight`] = read(`${prefix}-weight`)
    next[`${prefix}-line-height`] = read(`${prefix}-line-height`)
  }
  return next
}

/**
 * Token values for the theme currently in effect, re-read whenever that
 * changes. The swatch chips are painted with `var(--token)` so they follow the
 * theme on their own, but the printed hex values and measured ratios are
 * JavaScript reads — without this they would stay frozen at whatever the theme
 * was when the page mounted, and silently disagree with the swatch beside them.
 *
 * Two signals, because there are two ways the palette moves: the toggle stamps
 * data-theme on <html>, and with no explicit choice stored the OS preference
 * drives it with no attribute change at all.
 */
function useTokens() {
  const [tokens, setTokens] = useState(readTokens)

  useEffect(() => {
    const reread = () => setTokens(readTokens())

    const observer = new MutationObserver(reread)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })

    const mq = window.matchMedia('(prefers-color-scheme: light)')
    mq.addEventListener('change', reread)

    return () => {
      observer.disconnect()
      mq.removeEventListener('change', reread)
    }
  }, [])

  return tokens
}

function DesignSystem() {
  usePageMeta({
    title: 'Design System',
    description:
      'The tokens, type scale, and component states this site is built on — including the accessibility decisions behind them.'
  })

  const tokens = useTokens()

  return (
    <section className="section">
      <h1 className="page-title fade-in">Design System</h1>

      <p className="system-intro fade-in" style={{ animationDelay: '0.1s' }}>
        This site runs on a small set of design tokens. Rather than screenshot
        them, this page reads the live values out of the stylesheet at runtime,
        so it stays accurate by construction. The notes explain why each
        decision was made — most of them came out of an accessibility audit of
        an earlier version of this site.
      </p>

      <div className="system-block fade-in" style={{ animationDelay: '0.15s' }}>
        <h2 className="section-heading">Color</h2>
        <p className="system-note">
          The palette is intentionally near-monochrome, with one accent. Two
          border tokens exist because they do different jobs: dividers are
          decorative and can sit quietly at low contrast, but anything that
          bounds a control has to clear the WCAG 1.4.11 minimum of 3:1. An
          earlier single border token sat at 1.69:1, which meant every filter
          chip and toggle had an effectively invisible edge.
        </p>
        <p className="system-note">
          The ratios below are measured live against the current page
          background, so they follow whichever theme is active — switch it in
          the nav and these numbers change. Both themes hold the same floors.
          The accent is the value that differs most between them: it is used
          as a link-hover color, so each theme needs 4.5:1, and the dark
          theme&rsquo;s cyan manages only 1.6:1 on a light page. The light
          theme uses a considerably darker cyan for that reason.
        </p>
        <div className="swatch-grid">
          {COLOR_TOKENS.map(([name, label]) => (
            <div className="swatch" key={name}>
              <div className="swatch-chip" style={{ backgroundColor: `var(${name})` }} />
              <div className="swatch-meta">
                <span className="swatch-name">{name}</span>
                {tokens[name] || '—'}
                <br />
                {label}
                {(() => {
                  if (name === '--bg-primary') return null
                  const ratio = contrastRatio(
                    tokens[`${name}--rgb`],
                    tokens['--bg-primary--rgb']
                  )
                  return ratio ? ` · ${ratio.toFixed(2)}:1` : null
                })()}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="system-block fade-in" style={{ animationDelay: '0.2s' }}>
        <h2 className="section-heading">Typography</h2>
        <p className="system-note">
          IBM Plex Sans for everything readable, IBM Plex Mono for labels and
          metadata. Each role bundles size, weight, line height, and letter
          spacing so they can&rsquo;t be mixed and matched incorrectly. Running
          prose is capped at {tokens['--measure'] || '68ch'} — the previous
          version let body copy run past 130 characters per line on a wide
          display.
        </p>
        {TYPE_ROLES.map(([prefix, label, sample]) => (
          <div className="type-specimen" key={prefix}>
            <span
              style={{
                fontSize: `var(${prefix}-size)`,
                fontWeight: `var(${prefix}-weight)`,
                lineHeight: `var(${prefix}-line-height)`,
                letterSpacing: `var(${prefix}-letter-spacing)`
              }}
            >
              {sample}
            </span>
            <span className="type-specimen-label">
              {label} · {tokens[`${prefix}-size`] || '—'} / {tokens[`${prefix}-weight`] || '—'}
            </span>
          </div>
        ))}
      </div>

      <div className="system-block fade-in" style={{ animationDelay: '0.25s' }}>
        <h2 className="section-heading">Spacing</h2>
        <p className="system-note">
          A 4px base scale. Before this existed, the stylesheet used sixteen
          different hardcoded gap values, several of which (3px, 5px, 30px,
          70px) broke the rhythm entirely.
        </p>
        {SPACE_TOKENS.map((name) => (
          <div className="scale-row" key={name}>
            <div className="scale-bar" style={{ width: `var(${name})` }} />
            <span className="scale-label">{name} · {tokens[name] || '—'}</span>
          </div>
        ))}
      </div>

      <div className="system-block fade-in" style={{ animationDelay: '0.3s' }}>
        <h2 className="section-heading">Interactive states</h2>
        <p className="system-note">
          Tab into these with a keyboard. Every interactive element on the site
          shares one focus treatment: a 2px accent ring, offset so it stays
          legible on elements that have no border of their own — like gallery
          tiles, which are buttons wrapping a full-bleed image. The earlier
          version of this site defined no focus styles at all.
        </p>

        <div className="state-row">
          <button type="button" className="filter-tag" aria-pressed="false">Default</button>
          <button type="button" className="filter-tag" aria-pressed="true">Selected</button>
          <span className="tag">Static tag</span>
        </div>

        <div className="state-row">
          <button type="button" className="carousel-arrow" aria-label="Enabled example">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <polyline points="7,3 15,10 7,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button type="button" className="carousel-arrow" disabled aria-label="Disabled example">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <polyline points="13,3 5,10 13,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="scale-label">
            Disabled uses dimmed color plus a lighter border, not blanket opacity
          </span>
        </div>
      </div>

      <div className="system-block fade-in" style={{ animationDelay: '0.35s' }}>
        <h2 className="section-heading">Motion</h2>
        <p className="system-note">
          Entrances use a single 350ms fade-and-rise, staggered across lists.
          All of it is disabled under <code>prefers-reduced-motion</code> —
          collapsed to a near-zero duration rather than removed, so content
          still appears rather than never arriving. If you have reduce-motion
          enabled at the OS level, this page already loaded without animation.
        </p>
        <div className="scale-row">
          <span className="scale-label">--duration-fast · 120ms</span>
        </div>
        <div className="scale-row">
          <span className="scale-label">--duration-base · 200ms</span>
        </div>
        <div className="scale-row">
          <span className="scale-label">--duration-slow · 350ms</span>
        </div>
      </div>
    </section>
  )
}

export default DesignSystem
