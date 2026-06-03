import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { loadCaseStudies } from '../data/caseStudyLoader'

const projects = loadCaseStudies()

function Portfolio() {
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
    projects.forEach(project => {
      project.tags.forEach(tag => tags.add(tag))
    })
    return ['All', ...Array.from(tags).sort()]
  }, [projects])

  const filteredProjects = useMemo(() => {
    if (activeFilter === 'All') return projects
    return projects.filter(project => project.tags.includes(activeFilter))
  }, [projects, activeFilter])

  return (
    <section className="section">
      <h2>Recent Work</h2>

      <div className="filter-bar">
        <div className="filter-tags">
          {allTags.map((tag) => (
            <button
              key={tag}
              className={`filter-tag ${activeFilter === tag ? 'active' : ''}`}
              onClick={() => setActiveFilter(activeFilter === tag ? 'All' : tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="view-toggle" role="group" aria-label="View mode">
          <button
            className={`view-toggle-btn${viewMode === 'grid' ? ' active' : ''}`}
            onClick={() => handleSetViewMode('grid')}
            aria-pressed={viewMode === 'grid'}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="1" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="1" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="1" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="9" y="9" width="6" height="6" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
          <button
            className={`view-toggle-btn${viewMode === 'list' ? ' active' : ''}`}
            onClick={() => handleSetViewMode('list')}
            aria-pressed={viewMode === 'list'}
            title="List view"
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

      {viewMode === 'list' ? (
        <div className="portfolio-grid">
          {filteredProjects.map((project, index) => (
            <Link
              to={`/portfolio/${project.slug}`}
              className="project-card fade-in"
              key={project.slug}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="project-image">
                <img
                  src={project.image}
                  alt={project.title}
                  style={project.thumbnailPosition ? { objectPosition: project.thumbnailPosition } : undefined}
                />
              </div>
              <div className="project-info">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, i) => (
                    <span className="tag" key={i}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="portfolio-grid-view">
          {filteredProjects.map((project, index) => (
            <Link
              to={`/portfolio/${project.slug}`}
              className="project-grid-card fade-in"
              key={project.slug}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <div className="project-grid-image">
                <img
                  src={project.image}
                  alt={project.title}
                  style={project.thumbnailPosition ? { objectPosition: project.thumbnailPosition } : undefined}
                />
              </div>
              <div className="project-grid-info">
                <h3 className="project-title">{project.title}</h3>
                <p className="project-description">{project.description}</p>
                <div className="project-tags">
                  {project.tags.map((tag, i) => (
                    <span className="tag" key={i}>{tag}</span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export default Portfolio
