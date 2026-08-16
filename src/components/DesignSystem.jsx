import { useState } from 'react'
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
  ['--text-primary', 'Primary text · 19.8:1'],
  ['--text-secondary', 'Secondary text · 8.6:1'],
  ['--surface-1', 'Surface, lowest'],
  ['--surface-2', 'Surface, image plate'],
  ['--surface-3', 'Surface, raised'],
  ['--border-subtle', 'Divider, decorative'],
  ['--border-interactive', 'Control border · 3.2:1'],
  ['--accent', 'Accent · 11.2:1']
]

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
  for (const [name] of COLOR_TOKENS) next[name] = read(name)
  for (const name of SPACE_TOKENS) next[name] = read(name)
  next['--measure'] = read('--measure')
  for (const [prefix] of TYPE_ROLES) {
    next[`${prefix}-size`] = read(`${prefix}-size`)
    next[`${prefix}-weight`] = read(`${prefix}-weight`)
    next[`${prefix}-line-height`] = read(`${prefix}-line-height`)
  }
  return next
}

// Read once on mount. The stylesheet is imported by App, so the custom
// properties are resolved by the time this component first renders.
function useTokens() {
  const [tokens] = useState(readTokens)
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
        <div className="swatch-grid">
          {COLOR_TOKENS.map(([name, label]) => (
            <div className="swatch" key={name}>
              <div className="swatch-chip" style={{ backgroundColor: `var(${name})` }} />
              <div className="swatch-meta">
                <span className="swatch-name">{name}</span>
                {tokens[name] || '—'}
                <br />
                {label}
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
