import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import { loadCaseStudies, getCaseStudyLayout } from '../data/caseStudyLoader'

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
// Component
// ---------------------------------------------------------------------------

function CaseStudy() {
  const { slug } = useParams()
  const project = projects.find(p => p.slug === slug)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [galleryLayout, setGalleryLayout] = useState(null)
  const [galleryGroups, setGalleryGroups] = useState(null)
  const [carouselIndices, setCarouselIndices] = useState({})
  const getCarouselIndex = (label) => carouselIndices[label] ?? 0
  const setCarouselGroupIndex = (label, idx) =>
    setCarouselIndices(prev => ({ ...prev, [label]: idx }))
  const sentinelRef = useRef(null)

  // Raw discovered images from the images array
  const images = project?.caseStudy?.images || []

  // For standard layouts: combine heroImage (if not already in images) with the images array
  const heroImg = project?.caseStudy?.heroImage
  const heroAlreadyInImages = heroImg && images.some(i => i.src === heroImg)
  const stripImages =
    heroImg && !heroAlreadyInImages
      ? [{ src: heroImg, caption: '' }, ...images]
      : images

  // activeImages drives the lightbox for all layout types.
  // For standard layout, galleryLayout order matches the rendered grid order.
  const activeImages =
    project?.layout === 'gallery'       ? (galleryLayout ?? []) :
    project?.layout === 'multi-gallery' ? (galleryGroups?.flatMap(g => g.images) ?? []) :
    (galleryLayout ?? stripImages)

  // Scroll to top on every case study entry
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [slug])

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (lightboxIndex === null) return
    const handleKey = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') setLightboxIndex(i => (i - 1 + activeImages.length) % activeImages.length)
      if (e.key === 'ArrowRight') setLightboxIndex(i => (i + 1) % activeImages.length)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxIndex, activeImages.length])

  // Lock body scroll while lightbox is open
  useEffect(() => {
    document.body.style.overflow = lightboxIndex !== null ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [lightboxIndex])

  // Load natural image dimensions and compute bento layout.
  // Runs for both 'gallery' layouts (Renders + Artwork) and standard case study
  // layouts that have images, so both share the same grid algorithm and CSS.
  useEffect(() => {
    if (project?.layout === 'multi-gallery') return

    const targetImages = project?.layout === 'gallery' ? images : stripImages
    if (!targetImages.length) return

    setGalleryLayout(null)
    Promise.all(
      targetImages.map(img => new Promise(resolve => {
        const el = new Image()
        el.onload = () => resolve({ src: img.src, caption: img.caption, width: el.naturalWidth, height: el.naturalHeight })
        el.onerror = () => resolve({ src: img.src, caption: img.caption, width: 1, height: 1 })
        el.src = img.src
      }))
    ).then(dims => setGalleryLayout(computeGalleryLayout(dims)))
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // For multi-gallery layouts: populate groups from already-resolved project data.
  useEffect(() => {
    if (project?.layout !== 'multi-gallery') return
    const groups = project.caseStudy?.groups || []
    setGalleryGroups(null)
    setCarouselIndices({})
    if (!groups.length) return
    setGalleryGroups(groups.map(g => ({ label: g.label, images: g.images })))
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  // -------------------------------------------------------------------------

  if (!project) {
    return (
      <section className="section">
        <h2>Project Not Found</h2>
        <p>The project you're looking for doesn't exist.</p>
        <Link to="/portfolio" className="back-link"><svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/><line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/></svg>Back</Link>
      </section>
    )
  }

  const { title, tags, caseStudy } = project

  // Optional bespoke layout: a `layout.jsx` in the case study folder + `"layout": "custom"`.
  // Renders inside the shared chrome and gets the resolved data plus lightbox control.
  const CustomLayout =
    project.layout === 'custom' ? getCaseStudyLayout(slug) : null

  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i - 1 + activeImages.length) % activeImages.length)
  }
  const goNext = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i + 1) % activeImages.length)
  }

  const hasMetaContent = caseStudy.role || caseStudy.timeline || caseStudy.team || caseStudy.teamHtml

  // Shared bento grid renderer — used for both 'gallery' layout and standard case studies.
  // startDelay offsets all item delays so the grid animates in after the meta content above it.
  const renderBentoGrid = (startDelay = 0) =>
    galleryLayout && (
      <div className="bento-grid">
        {galleryLayout.map((image, index) => (
          <button
            key={index}
            className={`bento-item${image.span === 2 ? ' wide' : ''} fade-in`}
            style={{ animationDelay: `${startDelay + index * 0.05}s` }}
            onClick={() => setLightboxIndex(index)}
            aria-label={`View image ${index + 1}`}
          >
            <img src={image.src} alt={image.caption || `Image ${index + 1}`} loading="lazy" decoding="async" />
          </button>
        ))}
      </div>
    )

  return (
    <div className="case-study">
      {/* Sentinel — scrolls out of view to trigger sticky header collapse */}
      <div ref={sentinelRef} className="case-study-sentinel" />

      {/* Sticky header */}
      <div className={`case-study-sticky-header${isCollapsed ? ' collapsed' : ''}`}>
        <Link to="/portfolio" className="back-link fade-in" style={{ animationDelay: '0s' }}><svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/><line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/></svg>Back</Link>

        <div className="case-study-tags fade-in" style={{ animationDelay: '0.05s' }}>
          {tags.map((tag, index) => (
            <span className="tag" key={index}>{tag}</span>
          ))}
        </div>

        <h1 className="case-study-title fade-in" style={{ animationDelay: '0.1s' }}>{title}</h1>

        <div className="case-study-sticky-divider fade-in" style={{ animationDelay: '0.15s' }} />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Custom layout — bespoke per-case-study component (escape hatch)      */}
      {/* ------------------------------------------------------------------ */}
      {CustomLayout ? (
        <CustomLayout
          project={project}
          images={activeImages}
          openLightbox={setLightboxIndex}
        />
      ) : project.layout === 'multi-gallery' ? (
        galleryGroups && (() => {
          let offset = 0
          return galleryGroups.map((group, groupIdx) => {
            const groupOffset = offset
            offset += group.images.length
            const carouselStart = getCarouselIndex(group.label)
            const canGoPrev = carouselStart > 0
            const canGoNext = group.images.length > 4 && carouselStart < group.images.length - 4
            const visibleImages = group.images.slice(carouselStart, carouselStart + 4)
            return (
              <div key={group.label} className="gallery-group">
                <h2 className="gallery-group-label fade-in" style={{ animationDelay: `${groupIdx * 0.08}s` }}>{group.label}</h2>
                <div className="carousel">
                  <div className="carousel-track">
                    {visibleImages.map((image, i) => (
                      <button
                        key={carouselStart + i}
                        className="carousel-item fade-in"
                        onClick={() => setLightboxIndex(groupOffset + carouselStart + i)}
                        aria-label={`View image ${carouselStart + i + 1}`}
                      >
                        <img src={image.src} alt={image.caption || `Image ${carouselStart + i + 1}`} loading="lazy" decoding="async" />
                      </button>
                    ))}
                  </div>
                  {group.images.length > 4 && (
                    <div className="carousel-nav">
                      <button
                        className={`carousel-arrow${!canGoPrev ? ' disabled' : ''}`}
                        onClick={() => canGoPrev && setCarouselGroupIndex(group.label, carouselStart - 1)}
                        disabled={!canGoPrev}
                        aria-label="Previous image"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="13,3 5,10 13,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        className={`carousel-arrow${!canGoNext ? ' disabled' : ''}`}
                        onClick={() => canGoNext && setCarouselGroupIndex(group.label, carouselStart + 1)}
                        disabled={!canGoNext}
                        aria-label="Next image"
                      >
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <polyline points="7,3 15,10 7,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        })()
      ) : project.layout === 'gallery' ? (
      /* ------------------------------------------------------------------ */
      /* Gallery layout (Renders + Artwork — bento grid only)                */
      /* ------------------------------------------------------------------ */
        renderBentoGrid()
      ) : (
      /* ------------------------------------------------------------------ */
      /* Standard case study layout                                           */
      /* ------------------------------------------------------------------ */
        <>
          {/* Condensed blurb — between title/tags and role/timeline/team */}
          {caseStudy.blurb && (
            <div className="case-study-blurb fade-in" style={{ animationDelay: '0.2s' }}>
              <ReactMarkdown>{caseStudy.blurb}</ReactMarkdown>
            </div>
          )}

          {/* Role / Timeline / Team */}
          {hasMetaContent && (
            <div className="case-study-meta fade-in" style={{ animationDelay: '0.28s' }}>
              {caseStudy.role && (
                <div className="meta-item">
                  <h3>Role</h3>
                  <p>{caseStudy.role}</p>
                </div>
              )}
              {caseStudy.timeline && (
                <div className="meta-item">
                  <h3>Timeline</h3>
                  <p>{caseStudy.timeline}</p>
                </div>
              )}
              {(caseStudy.team || caseStudy.teamHtml) && (
                <div className="meta-item">
                  <h3>Team</h3>
                  {caseStudy.teamHtml
                    ? <p dangerouslySetInnerHTML={{ __html: caseStudy.teamHtml }} />
                    : <p>{caseStudy.team}</p>
                  }
                </div>
              )}
            </div>
          )}

          {/* Video embed (Hero Brand Film) */}
          {caseStudy.videoUrl && (
            <div className="case-study-video fade-in" style={{ animationDelay: '0.35s' }}>
              <iframe
                src={caseStudy.videoUrl}
                title={title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          )}

          {/* Bento grid — same algorithm as Renders + Artwork; starts after meta */}
          {renderBentoGrid(0.35)}
        </>
      )}

      <div className="case-study-footer">
        <Link to="/portfolio" className="back-link"><svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/><line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/></svg>Back</Link>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <div className="lightbox-overlay" onClick={closeLightbox} role="dialog" aria-modal="true">
          <button className="lightbox-close" onClick={closeLightbox} aria-label="Close lightbox">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <line x1="2" y1="2" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <line x1="18" y1="2" x2="2" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>

          {activeImages.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-prev" onClick={goPrev} aria-label="Previous image">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="13,3 5,10 13,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            <img
              src={activeImages[lightboxIndex]?.src}
              alt={activeImages[lightboxIndex]?.caption}
            />
            {activeImages[lightboxIndex]?.caption && (
              <p className="lightbox-caption">{activeImages[lightboxIndex].caption}</p>
            )}
            <p className="lightbox-counter">{lightboxIndex + 1} / {activeImages.length}</p>
          </div>

          {activeImages.length > 1 && (
            <button className="lightbox-arrow lightbox-arrow-next" onClick={goNext} aria-label="Next image">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="7,3 15,10 7,17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default CaseStudy
