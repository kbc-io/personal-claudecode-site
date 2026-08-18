import { BrowserRouter, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom'
import { Suspense, lazy, useEffect, useState } from 'react'
import './App.css'
import resumeData from './data/resume.json'
import Portfolio from './components/Portfolio'

// Route-level code splitting. CaseStudy pulls in react-markdown and the
// bento layout algorithm, neither of which a visitor to /about needs.
const Resume = lazy(() => import('./components/Resume'))
const CaseStudy = lazy(() => import('./components/CaseStudy'))
const About = lazy(() => import('./components/About'))
const DesignSystem = lazy(() => import('./components/DesignSystem'))
const NotFound = lazy(() => import('./components/NotFound'))

const pacificTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  hour: 'numeric',
  minute: '2-digit',
  second: '2-digit',
  hour12: true,
  timeZoneName: 'short',
})

/**
 * Local time where Kevin is, ticking every second.
 *
 * State lives in this leaf rather than in App so the per-second update
 * re-renders one <li> instead of cascading through the whole route tree.
 * The timeout is re-aligned to the next second boundary on every tick, so
 * the display stays on the second instead of drifting the way a plain
 * setInterval would.
 */
function LocalTime() {
  const [time, setTime] = useState(() => pacificTimeFormatter.format(new Date()))

  useEffect(() => {
    let timeoutId

    const schedule = () => {
      timeoutId = setTimeout(() => {
        setTime(pacificTimeFormatter.format(new Date()))
        schedule()
      }, 1000 - (Date.now() % 1000))
    }

    schedule()
    return () => clearTimeout(timeoutId)
  }, [])

  return <li className="local-time">{time}</li>
}

/**
 * Restores scroll position to the top on route change. Previously only
 * CaseStudy did this, so navigating from a scrolled portfolio to
 * /experience landed mid-page.
 */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

function ContactLinks({ className }) {
  const { contact } = resumeData
  return (
    <ul className={className}>
      <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
      <li>
        <a href={contact.linkedin} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
      </li>
      {contact.github && (
        <li>
          <a href={contact.github} target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </li>
      )}
      <LocalTime />
    </ul>
  )
}

function App() {
  const { name, tagline, bio } = resumeData

  // The staggered intro plays once per session, not on every navigation.
  const [intro] = useState(() => !sessionStorage.getItem('hasLoaded'))

  useEffect(() => {
    sessionStorage.setItem('hasLoaded', 'true')
  }, [])

  const d = (i) => (intro ? { style: { animationDelay: `${i * 0.1}s` } } : {})

  return (
    <BrowserRouter>
      <ScrollToTop />
      <a className="skip-link" href="#main">Skip to content</a>

      <div className="portfolio">
        <nav className={`navbar${intro ? ' fade-in' : ''}`} {...d(0)} aria-label="Primary">
          <div className="navbar-content">
            <NavLink to="/portfolio" className="navbar-home">KC</NavLink>
            <ul className="nav-links">
              <li><NavLink to="/portfolio">Portfolio</NavLink></li>
              <li><NavLink to="/experience">Experience</NavLink></li>
              <li><NavLink to="/system">System</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
            </ul>
          </div>
        </nav>

        <aside className="sidebar" aria-label="Site information">
          {/* Site chrome, not the page heading — each route supplies its own
              <h1>, so this is a <p> rather than a second top-level heading. */}
          <p className={`site-name${intro ? ' fade-in' : ''}`} {...d(1)}>{name}</p>
          <p className={`tagline${intro ? ' fade-in' : ''}`} {...d(2)}>{tagline}</p>
          <p className={`bio${intro ? ' fade-in' : ''}`} {...d(3)}>{bio}</p>

          <div className={`contact${intro ? ' fade-in' : ''}`} {...d(4)}>
            <h2>Contact</h2>
            <ContactLinks />
          </div>
        </aside>

        <main className="main-content" id="main" tabIndex={-1}>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Navigate to="/portfolio" replace />} />
              <Route path="/portfolio" element={<Portfolio />} />
              <Route path="/portfolio/:slug" element={<CaseStudy />} />
              <Route path="/experience" element={<Resume />} />
              <Route path="/system" element={<DesignSystem />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
      </div>

      {/* Mobile-only: the sidebar contact block is hidden below 768px, so the
          primary calls to action live here instead of disappearing. */}
      <footer className="site-footer">
        <h2>Contact</h2>
        <ContactLinks />
      </footer>
    </BrowserRouter>
  )
}

export default App
