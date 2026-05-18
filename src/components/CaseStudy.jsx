import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { loadCaseStudies } from '../data/caseStudyLoader'

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

  const queue = items.map((_, i) => i) // indices of unplaced images
  const result = []
  let rowFill = 0

  while (queue.length > 0) {
    const remaining = GALLERY_COLS - rowFill

    // Find the first item in the front of the queue whose preferred span fits.
    // Lookahead up to 4 positions so narrow images can fill gaps left by wide ones.
    let chosenQueuePos = 0
    for (let qi = 0; qi < Math.min(queue.length, 4); qi++) {
      if (items[queue[qi]].preferredSpan <= remaining) {
        chosenQueuePos = qi
        break
      }
    }

    const idx = queue.splice(chosenQueuePos, 1)[0]
    const item = items[idx]
    // If nothing in the lookahead fits perfectly, cap span at remaining columns
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
  const sentinelRef = useRef(null)

  // Raw discovered images (alphabetical). Used for the image strip and for
  // standard (non-gallery) lightbox navigation.
  const images = project?.caseStudy?.images || []

  // For gallery pages, activeImages is the computed layout (may reorder images
  // to produce clean rows). For standard pages it's the same as images.
  const activeImages = project?.layout === 'gallery' ? (galleryLayout ?? []) : images

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

  // For gallery layouts: load every image's natural dimensions, then run the
  // layout algorithm. Re-runs whenever the slug changes (different gallery).
  useEffect(() => {
    if (project?.layout !== 'gallery' || !images.length) return
    setGalleryLayout(null) // reset while new dims are loading

    Promise.all(
      images.map(img => new Promise(resolve => {
        const el = new Image()
        el.onload = () => resolve({ src: img.src, caption: img.caption, width: el.naturalWidth, height: el.naturalHeight })
        el.onerror = () => resolve({ src: img.src, caption: img.caption, width: 1, height: 1 })
        el.src = img.src
      }))
    ).then(dims => setGalleryLayout(computeGalleryLayout(dims)))
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
  const stripImages = images.slice(0, 4)

  const closeLightbox = () => setLightboxIndex(null)
  const goPrev = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i - 1 + activeImages.length) % activeImages.length)
  }
  const goNext = (e) => {
    e.stopPropagation()
    setLightboxIndex(i => (i + 1) % activeImages.length)
  }

  return (
    <div className="case-study">
      {/* Sentinel — scrolls out of view to trigger sticky header collapse */}
      <div ref={sentinelRef} className="case-study-sentinel" />

      {/* Sticky header */}
      <div className={`case-study-sticky-header${isCollapsed ? ' collapsed' : ''}`}>
        {stripImages.length > 0 && (
          <div className="case-study-image-strip">
            {stripImages.map((image, index) => (
              <button
                key={index}
                className="image-strip-item"
                onClick={() => setLightboxIndex(index)}
                aria-label={`View image: ${image.caption}`}
              >
                <img src={image.src} alt={image.caption} />
              </button>
            ))}
          </div>
        )}

        <Link to="/portfolio" className="back-link"><svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/><line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/></svg>Back</Link>

        <div className="case-study-tags">
          {tags.map((tag, index) => (
            <span className="tag" key={index}>{tag}</span>
          ))}
        </div>

        <h1 className="case-study-title">{title}</h1>

        {caseStudy.overview && (
          <div className="case-study-overview-wrapper">
            <p className="case-study-overview">{caseStudy.overview}</p>
          </div>
        )}

        <div className="case-study-sticky-divider" />
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Gallery layout                                                       */}
      {/* ------------------------------------------------------------------ */}
      {project.layout === 'gallery' ? (
        galleryLayout && (
          <div className="bento-grid">
            {galleryLayout.map((image, index) => (
              <button
                key={index}
                className={`bento-item${image.span === 2 ? ' wide' : ''} fade-in`}
                style={{ animationDelay: `${index * 0.05}s` }}
                onClick={() => setLightboxIndex(index)}
                aria-label={`View image ${index + 1}`}
              >
                <img src={image.src} alt={image.caption || `Image ${index + 1}`} />
              </button>
            ))}
          </div>
        )
      ) : (
      /* ------------------------------------------------------------------ */
      /* Standard case study layout                                           */
      /* ------------------------------------------------------------------ */
        <>
          <div className="case-study-meta">
            <div className="meta-item">
              <h3>Role</h3>
              <p>{caseStudy.role}</p>
            </div>
            <div className="meta-item">
              <h3>Timeline</h3>
              <p>{caseStudy.timeline}</p>
            </div>
            <div className="meta-item">
              <h3>Team</h3>
              <p>{caseStudy.team}</p>
            </div>
          </div>

          <div className="case-study-hero">
            <img src={caseStudy.heroImage} alt={title} />
          </div>

          <section className="case-study-section">
            <h2>Objectives</h2>
            <ul className="objectives-list">
              {caseStudy.objectives.map((objective, index) => (
                <li key={index}>{objective}</li>
              ))}
            </ul>
          </section>

          <section className="case-study-section">
            <h2>The Challenge</h2>
            <p>{caseStudy.challenge}</p>
          </section>

          <section className="case-study-section">
            <h2>Approach</h2>
            <p>{caseStudy.approach}</p>
          </section>

          <section className="case-study-section">
            <h2>User Experience</h2>
            <p>{caseStudy.userExperience.description}</p>
            <div className="insights">
              <h3>Key Insights</h3>
              <ul>
                {caseStudy.userExperience.insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="case-study-section">
            <h2>Solution</h2>
            <p>{caseStudy.solution}</p>
          </section>

          {stripImages.length > 0 && (
            <section className="case-study-images">
              {stripImages.map((image, index) => (
                <figure key={index} className="case-study-figure">
                  <button
                    className="case-study-figure-btn"
                    onClick={() => setLightboxIndex(index)}
                    aria-label={`View image: ${image.caption}`}
                  >
                    <img src={image.src} alt={image.caption} />
                  </button>
                  <figcaption>{image.caption}</figcaption>
                </figure>
              ))}
            </section>
          )}

          <section className="case-study-section">
            <h2>Results</h2>
            <ul className="results-list">
              {caseStudy.results.map((result, index) => (
                <li key={index}>{result}</li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="case-study-footer">
        <Link to="/portfolio" className="back-link"><svg className="back-arrow" width="14" height="14" viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg"><polyline points="244,400 100,256 244,112" stroke="currentColor" strokeWidth="48" strokeLinecap="square" strokeLinejoin="miter"/><line x1="120" y1="256" x2="412" y2="256" stroke="currentColor" strokeWidth="48" strokeLinecap="square"/></svg>Back</Link>
      </div>

      {/* Lightbox — uses activeImages so gallery order matches clicked item */}
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
