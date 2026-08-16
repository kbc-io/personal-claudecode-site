import { useState, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { loadCaseStudies, getCaseStudyImageUrls } from '../data/caseStudyLoader'
import { usePageMeta } from '../hooks/usePageMeta'

const projects = loadCaseStudies()

// Filters are ordered deliberately rather than alphabetically, so the work
// that leads the positioning sits first.
const TAG_ORDER = ['Product', 'Brand', 'Visual', 'Motion']

// Warm a single case study's images when the visitor signals intent by
// hovering or focusing its card. Replaces an unconditional prefetch of every
// image on the site (~15 MB) that ran on page load whether or not a visitor
// ever opened a case study.
const warmed = new Set()
function prefetchProject(slug) {
  if (warmed.has(slug)) return
  warmed.add(slug)
  for (const url of getCaseStudyImageUrls(slug)) {
    const img = new Image()
    img.fetchPriority = 'low'
    img.decoding = 'async'
    img.src = url
  }
}

function ProjectCard({ project, variant, index, onPrefetch }) {
  const isGrid = variant === 'grid'
  return (
    <Link
      to={`/portfolio/${project.slug}`}
      className={`${isGrid ? 'project-grid-card' : 'project-card'} fade-in`}
      style={{ animationDelay: `${index * (isGrid ? 0.05 : 0.08)}s` }}
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <div className={isGrid ? 'project-grid-image' : 'project-image'}>
        <img
          src={project.image}
          /* The visible <h3> immediately below carries the same text, so the
             thumbnail is decorative in context. */
          alt=""
          loading="lazy"
          decoding="async"
          style={project.thumbnailPosition ? { objectPosition: project.thumbnailPosition } : undefined}
        />
      </div>
      <div className={isGrid ? 'project-grid-info' : 'project-info'}>
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        <div className="project-tags">
          {project.tags.map((tag) => (
            <span className="tag" key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </Link>
  )
}

function Portfolio() {
  usePageMeta({
    title: 'Portfolio',
    description:
      'Selected product, brand, and visual design work by Kevin Coalwell, including UI and design system work for Carnegie Mellon and Agility Robotics.'
  })

  const [activeFilter, setActiveFilter] = useState('All')
  const [viewMode, setViewMode] = useState(
    () => sessionStorage.getItem('portfolioViewMode') || 'grid'
  )

  const handleSetViewMode = (mode) => {
    sessionStorage.setItem('portfolioViewMode', mode)
    setViewMode(mode)
  }

  const allTags = useMemo(() => {
    const tags = new Set()
    projects.forEach(project => project.tags.forEach(tag => tags.add(tag)))
    const ordered = TAG_ORDER.filter(tag => tags.has(tag))
    const rest = [...tags].filter(tag => !TAG_ORDER.includes(tag)).sort()
    return ['All', ...ordered, ...rest]
  }, [])

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects
    return projects.filter(project => project.tags.includes(activeFilter))
  }, [activeFilter])

  const handlePrefetch = useCallback((slug) => () => prefetchProject(slug), [])

  const isGrid = viewMode === 'grid'

  return (
    <section className="section">
      <h1 className="page-title">Recent Work</h1>

      <div className="filter-bar">
        <div className="filter-tags" role="group" aria-label="Filter work by discipline">
          {allTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="filter-tag"
              aria-pressed={activeFilter === tag}
              onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className="view-toggle-btn"
            onClick={() => handleSetViewMode('grid')}
            aria-pressed={isGrid}
            aria-label="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button
            type="button"
            className="view-toggle-btn"
            onClick={() => handleSetViewMode('list')}
            aria-pressed={!isGrid}
            aria-label="List view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <line x1="5" y1="4" x2="15" y2="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              <line x1="5" y1="8" x2="15" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              <line x1="5" y1="12" x2="15" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square"/>
              <rect x="1" y="2.5" width="2.5" height="2.5" fill="currentColor"/>
              <rect x="1" y="6.5" width="2.5" height="2.5" fill="currentColor"/>
              <rect x="1" y="10.5" width="2.5" height="2.5" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Announces filter results, which are otherwise a silent visual change. */}
      <p className="filter-status" role="status">
        {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
        {activeFilter !== 'All' ? ` tagged ${activeFilter}` : ''}
      </p>

      <div className={isGrid ? 'portfolio-grid-view' : 'portfolio-grid'}>
        {filteredProjects.map((project, index) => (
          <ProjectCard
            key={project.slug}
            project={project}
            variant={isGrid ? 'grid' : 'list'}
            index={index}
            onPrefetch={handlePrefetch(project.slug)}
          />
        ))}
      </div>
    </section>
  )
}

export default Portfolio
