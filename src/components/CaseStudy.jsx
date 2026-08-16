import { useState, useEffect, useRef, useCallback, useMemo, createElement } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { loadCaseStudies, getCaseStudyLayout } from '../data/caseStudyLoader'
import { usePageMeta } from '../hooks/usePageMeta'

const projects = loadCaseStudies()

// ---------------------------------------------------------------------------
// Gallery layout algorithm
// ---------------------------------------------------------------------------
// Arranges images into a 3-column bento grid. Wide images (aspect ratio > 1.3)
// prefer span=2; square/portrait images prefer span=1. A lookahead of 4 lets
// narrow images swap forward to fill any 1-column gap left by a wide image that
// would otherwise overflow the current row.
// ---------------------------------------------------------------------------
const GALLERY_COLS = 3

function computeGalleryLayout(dims) {
  const items = dims.map(d => ({
    ...d,
    preferredSpan: d.width / d.height > 1.3 ? 2 : 1
  }))

  const queue = items.map((_, i) => i)
  const result = []
  let rowFill = 0

  while (queue.length > 0) {
    const remaining = GALLERY_COLS - rowFill

    let chosenQueuePos = 0
    for (let qi = 0; qi < Math.min(queue.length, 4); qi++) {
      if (items[queue[qi]].preferredSpan <= remaining) {
        chosenQueuePos = qi
        break
      }
    }

    const idx = queue.splice(chosenQueuePos, 1)[0]
    const item = items[idx]
    const span = Math.min(item.preferredSpan, remaining)

    result.push({ src: item.src, caption: item.caption, span })
    rowFill = (rowFill + span) % GALLERY_COLS
  }

  return result
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

function BackLink({ className = 'back-link', style }) {
  return (
    <Link to="/portfolio" className={className} style={style}>
      <svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/>
        <line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/>
      </svg>
      Back
    </Link>
  )
}

function Chevron({ direction }) {
  const points = direction === 'prev' ? '13,3 5,10 13,17' : '7,3 15,10 7,17'
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <polyline points={points} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/**
 * A narrative block. Renders nothing at all when there is no content —
 * checking the text itself rather than the presence of a child element, so a
 * case study with an empty field doesn't get a bare heading with nothing
 * under it.
 */
function Section({ title, text, children }) {
  const hasText = typeof text === 'string' && text.trim().length > 0
  if (!hasText && !children) return null
  return (
    <section className="case-study-section">
      <h2>{title}</h2>
      {hasText && <ReactMarkdown>{text}</ReactMarkdown>}
      {children}
    </section>
  )
}

function hasItems(list) {
  return Array.isArray(list) && list.some(item => item && item.trim())
}

/** How many carousel slides fit at the current viewport width. */
function useCarouselWindow() {
  const [size, setSize] = useState(() =>
    typeof window === 'undefined' ? 4 : window.innerWidth <= 768 ? 2 : window.innerWidth <= 1024 ? 3 : 4
  )

  useEffect(() => {
    const compute = () =>
      setSize(window.innerWidth <= 768 ? 2 : window.innerWidth <= 1024 ? 3 : 4)
    window.addEventListener('resize', compute)
    return () => window.removeEventListener('resize', compute)
  }, [])

  return size
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function CaseStudy() {
  const { slug } = useParams()
  const project = projects.find(p => p.slug === slug)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  // Both of these are tagged with the slug they were computed for, so a
  // navigation invalidates them without needing a synchronous setState in an
  // effect (which triggers a cascading render).
  const [layoutState, setLayoutState] = useState({ slug: null, layout: null })
  const [carouselState, setCarouselState] = useState({ slug: null, indices: {} })
  const sentinelRef = useRef(null)
  const lightboxRef = useRef(null)
  const lastFocusedRef = useRef(null)
  const perView = useCarouselWindow()

  const galleryLayout = layoutState.slug === slug ? layoutState.layout : null

  // Multi-gallery groups are derived directly from the resolved project data.
  const galleryGroups = useMemo(() => {
    if (project?.layout !== 'multi-gallery') return null
    const groups = project.caseStudy?.groups || []
    return groups.length ? groups.map(g => ({ label: g.label, images: g.images })) : null
  }, [project])

  const getCarouselIndex = (label) =>
    (carouselState.slug === slug ? carouselState.indices[label] : 0) ?? 0
  const setCarouselGroupIndex = (label, idx) =>
    setCarouselState(prev => ({
      slug,
      indices: { ...(prev.slug === slug ? prev.indices : {}), [label]: idx }
    }))

  usePageMeta({
    title: project?.title,
    description: project?.caseStudy?.blurb?.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').slice(0, 180) || project?.description
  })

  const images = project?.caseStudy?.images || []

  const heroImg = project?.caseStudy?.heroImage
  const heroAlreadyInImages = heroImg && images.some(i => i.src === heroImg)
  const stripImages =
    heroImg && !heroAlreadyInImages
      ? [{ src: heroImg, caption: '' }, ...images]
      : images

  const activeImages =
    project?.layout === 'gallery'       ? (galleryLayout ?? []) :
    project?.layout === 'multi-gallery' ? (galleryGroups?.flatMap(g => g.images) ?? []) :
    (galleryLayout ?? stripImages)

  // Sticky header collapse observer
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsCollapsed(!entry.isIntersecting),
      { threshold: 0 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [slug])

  const closeLightbox = useCallback(() => setLightboxIndex(null), [])

  // Lightbox: keyboard nav, focus trap, scroll lock, focus restore.
  useEffect(() => {
    if (lightboxIndex === null) return

    lastFocusedRef.current = document.activeElement
    document.body.style.overflow = 'hidden'

    // Move focus into the dialog so Tab is trapped from the first press.
    const focusables = () =>
      Array.from(
        lightboxRef.current?.querySelectorAll('button:not([disabled])') ?? []
      )
    focusables()[0]?.focus()

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        closeLightbox()
        return
      }
      if (e.key === 'ArrowLeft') {
        setLightboxIndex(i => (i - 1 + activeImages.length) % activeImages.length)
        return
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex(i => (i + 1) % activeImages.length)
        return
      }
      if (e.key === 'Tab') {
        const items = focusables()
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
      // Return focus to whatever opened the lightbox.
      if (lastFocusedRef.current instanceof HTMLElement) {
        lastFocusedRef.current.focus()
      }
    }
  }, [lightboxIndex === null, activeImages.length, closeLightbox]) // eslint-disable-line react-hooks/exhaustive-deps

  // Load natural image dimensions and compute the bento layout.
  useEffect(() => {
    if (project?.layout === 'multi-gallery') return

    const targetImages = project?.layout === 'gallery' ? images : stripImages
    if (!targetImages.length) return

    let cancelled = false
    Promise.all(
      targetImages.map(img => new Promise(resolve => {
        const el = new Image()
        el.onload = () => resolve({ src: img.src, caption: img.caption, width: el.naturalWidth, height: el.naturalHeight })
        el.onerror = () => resolve({ src: img.src, caption: img.caption, width: 1, height: 1 })
        el.src = img.src
      }))
    ).then(dims => {
      if (!cancelled) setLayoutState({ slug, layout: computeGalleryLayout(dims) })
    })

    return () => { cancelled = true }
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------

  if (!project) {
    return (
      <section className="section not-found">
        <h1 className="page-title">Project not found</h1>
        <p>That project doesn&rsquo;t exist, or it may have been renamed.</p>
        <BackLink />
      </section>
    )
  }

  const { title, tags, caseStudy } = project

  // Escape hatch: a case study folder may ship its own `layout.jsx`. The
  // component is a stable module reference resolved from an eager glob, not
  // a component defined during render — the lint rule can't tell the
  // difference, so it's suppressed here rather than worked around.
  const CustomLayout =
    project.layout === 'custom' ? getCaseStudyLayout(slug) : null

  const goPrev = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i - 1 + activeImages.length) % activeImages.length)
  }
  const goNext = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i + 1) % activeImages.length)
  }

  const hasMetaContent = caseStudy.role || caseStudy.timeline || caseStudy.team || caseStudy.teamHtml

  const ux = caseStudy.userExperience || {}

  // articleLink is authored either as a plain URL string or as { url, label }.
  const articleLink = typeof caseStudy.articleLink === 'string'
    ? { url: caseStudy.articleLink, label: caseStudy.articleLinkLabel || 'Read the article' }
    : caseStudy.articleLink
      ? { ...caseStudy.articleLink, label: caseStudy.articleLink.label || 'Read the article' }
      : null
  const hasNarrative =
    (caseStudy.overview && caseStudy.overview.trim()) ||
    (caseStudy.challenge && caseStudy.challenge.trim()) ||
    (caseStudy.approach && caseStudy.approach.trim()) ||
    (caseStudy.solution && caseStudy.solution.trim()) ||
    (ux.description && ux.description.trim()) ||
    hasItems(caseStudy.objectives) ||
    hasItems(ux.insights) ||
    hasItems(caseStudy.results) ||
    Boolean(articleLink?.url)

  const renderBentoGrid = (startDelay = 0) =>
    galleryLayout && (
      <div className="bento-grid">
        {galleryLayout.map((image, index) => (
          <button
            key={`${image.src}-${index}`}
            type="button"
            className={`bento-item${image.span === 2 ? ' wide' : ''} fade-in`}
            style={{ animationDelay: `${startDelay + index * 0.05}s` }}
            onClick={() => setLightboxIndex(index)}
            aria-label={image.caption ? `View image: ${image.caption}` : `View image ${index + 1}`}
          >
            <img src={image.src} alt="" loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    )

  return (
    <div className="case-study">
      {/* Sentinel — scrolls out of view to trigger sticky header collapse */}
      <div ref={sentinelRef} className="case-study-sentinel" />

      <div className={`case-study-sticky-header${isCollapsed ? ' collapsed' : ''}`}>
        <BackLink className="back-link fade-in" style={{ animationDelay: '0s' }} />

        <div className="case-study-tags fade-in" style={{ animationDelay: '0.05s' }}>
          {tags.map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>

        <h1 className="case-study-title fade-in" style={{ animationDelay: '0.1s' }}>{title}</h1>

        <div className="case-study-sticky-divider fade-in" style={{ animationDelay: '0.15s' }} />
      </div>

      {CustomLayout ? (
        // createElement rather than <CustomLayout />: the value is a stable
        // module reference from an eager glob, but JSX with a render-scope
        // identifier reads to the linter as a component defined during render.
        createElement(CustomLayout, {
          project,
          images: activeImages,
          openLightbox: setLightboxIndex
        })
      ) : project.layout === 'multi-gallery' ? (
        galleryGroups && (() => {
          let offset = 0
          return galleryGroups.map((group, groupIdx) => {
            const groupOffset = offset
            offset += group.images.length
            const maxStart = Math.max(0, group.images.length - perView)
            const carouselStart = Math.min(getCarouselIndex(group.label), maxStart)
            const canGoPrev = carouselStart > 0
            const canGoNext = carouselStart < maxStart
            const visibleImages = group.images.slice(carouselStart, carouselStart + perView)
            return (
              <div key={group.label} className="gallery-group">
                <h2 className="gallery-group-label fade-in" style={{ animationDelay: `${groupIdx * 0.08}s` }}>{group.label}</h2>
                <div className="carousel">
                  <div className="carousel-track" style={{ '--carousel-columns': perView }}>
                    {visibleImages.map((image, i) => (
                      <button
                        key={carouselStart + i}
                        type="button"
                        className="carousel-item fade-in"
                        onClick={() => setLightboxIndex(groupOffset + carouselStart + i)}
                        aria-label={`View ${group.label} image ${carouselStart + i + 1} of ${group.images.length}`}
                      >
                        <img src={image.src} alt="" loading="lazy" decoding="async" />
                      </button>
                    ))}
                  </div>
                  {group.images.length > perView && (
                    <div className="carousel-nav">
                      <button
                        type="button"
                        className="carousel-arrow"
                        onClick={() => canGoPrev && setCarouselGroupIndex(group.label, carouselStart - 1)}
                        disabled={!canGoPrev}
                        aria-label={`Previous ${group.label} image`}
                      >
                        <Chevron direction="prev" />
                      </button>
                      <button
                        type="button"
                        className="carousel-arrow"
                        onClick={() => canGoNext && setCarouselGroupIndex(group.label, carouselStart + 1)}
                        disabled={!canGoNext}
                        aria-label={`Next ${group.label} image`}
                      >
                        <Chevron direction="next" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        })()
      ) : project.layout === 'gallery' ? (
        renderBentoGrid()
      ) : (
        <>
          {caseStudy.blurb && (
            <div className="case-study-blurb fade-in" style={{ animationDelay: '0.2s' }}>
              <ReactMarkdown>{caseStudy.blurb}</ReactMarkdown>
            </div>
          )}

          {hasMetaContent && (
            <div className="case-study-meta fade-in" style={{ animationDelay: '0.28s' }}>
              {caseStudy.role && (
                <div className="meta-item">
                  <h2>Role</h2>
                  <p>{caseStudy.role}</p>
                </div>
              )}
              {caseStudy.timeline && (
                <div className="meta-item">
                  <h2>Timeline</h2>
                  <p>{caseStudy.timeline}</p>
                </div>
              )}
              {(caseStudy.team || caseStudy.teamHtml) && (
                <div className="meta-item">
                  <h2>Team</h2>
                  {caseStudy.teamHtml
                    ? <p dangerouslySetInnerHTML={{ __html: caseStudy.teamHtml }} />
                    : <p>{caseStudy.team}</p>
                  }
                </div>
              )}
            </div>
          )}

          {caseStudy.videoUrl && (
            <div className="case-study-video fade-in" style={{ animationDelay: '0.35s' }}>
              <iframe
                src={caseStudy.videoUrl}
                title={`${title} — video`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* -------------------------------------------------------------- */}
          {/* Narrative. These fields existed in the data but nothing         */}
          {/* rendered them, so every case study read as an image gallery.    */}
          {/* -------------------------------------------------------------- */}
          {hasNarrative && (
            <div className="case-study-body fade-in" style={{ animationDelay: '0.4s' }}>
              <Section title="Overview" text={caseStudy.overview} />

              {hasItems(caseStudy.objectives) && (
                <Section title="Objectives">
                  <ul className="objectives-list">
                    {caseStudy.objectives.filter(o => o && o.trim()).map((objective) => (
                      <li key={objective}>{objective}</li>
                    ))}
                  </ul>
                </Section>
              )}

              <Section title="Challenge" text={caseStudy.challenge} />
              <Section title="Approach" text={caseStudy.approach} />

              {((ux.description && ux.description.trim()) || hasItems(ux.insights)) && (
                <Section title="User Experience" text={ux.description}>
                  {hasItems(ux.insights) && (
                    <div className="insights">
                      <h3>What we learned</h3>
                      <ul>
                        {ux.insights.filter(i => i && i.trim()).map((insight) => (
                          <li key={insight}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Section>
              )}

              <Section title="Solution" text={caseStudy.solution} />

              {hasItems(caseStudy.results) && (
                <Section title="Results">
                  <ul className="results-list">
                    {caseStudy.results.filter(r => r && r.trim()).map((result) => (
                      <li key={result}>{result}</li>
                    ))}
                  </ul>
                </Section>
              )}

              {articleLink?.url && (
                <a
                  className="case-study-link"
                  href={articleLink.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {articleLink.label} ↗
                </a>
              )}
            </div>
          )}

          {renderBentoGrid(0.45)}
        </>
      )}

      <div className="case-study-footer">
        <BackLink />
      </div>

      {lightboxIndex !== null && (
        <div
          className="lightbox-overlay"
          onClick={closeLightbox}
          role="dialog"
          aria-modal="true"
          aria-label={`Image viewer, ${lightboxIndex + 1} of ${activeImages.length}`}
          ref={lightboxRef}
        >
          <button type="button" className="lightbox-close" onClick={closeLightbox} aria-label="Close image viewer">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {activeImages.length > 1 && (
            <button type="button" className="lightbox-arrow lightbox-arrow-prev" onClick={goPrev} aria-label="Previous image">
              <Chevron direction="prev" />
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImages[lightboxIndex]?.src}
              alt={activeImages[lightboxIndex]?.caption || ''}
            />
            {activeImages[lightboxIndex]?.caption && (
              <p className="lightbox-caption">{activeImages[lightboxIndex].caption}</p>
            )}
            <p className="lightbox-counter">{lightboxIndex + 1} / {activeImages.length}</p>
          </div>

          {activeImages.length > 1 && (
            <button type="button" className="lightbox-arrow lightbox-arrow-next" onClick={goNext} aria-label="Next image">
              <Chevron direction="next" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CaseStudy
