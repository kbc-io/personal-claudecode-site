import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import { useRef, useEffect } from 'react'
import './App.css'
import resumeData from './data/resume.json'
import Resume from './components/Resume'
import Portfolio from './components/Portfolio'
import CaseStudy from './components/CaseStudy'
import About from './components/About'

function App() {
  const { name, bio, contact } = resumeData
  const isFirstLoad = useRef(!sessionStorage.getItem('hasLoaded'))

  useEffect(() => {
    sessionStorage.setItem('hasLoaded', 'true')
  }, [])

  const intro = isFirstLoad.current
  const d = (i) => intro ? { style: { animationDelay: `${i * 0.1}s` } } : {}

  return (
    <BrowserRouter>
      <div className="portfolio">
        <nav className={`navbar${intro ? ' fade-in' : ''}`} {...d(0)}>
          <div className="navbar-content">
            <ul className="nav-links">
              <li><NavLink to="/">Experience</NavLink></li>
              <li><NavLink to="/portfolio">Portfolio</NavLink></li>
              <li><NavLink to="/about">About</NavLink></li>
            </ul>
          </div>
        </nav>

        <aside className="sidebar">
          <h1 className={intro ? 'fade-in' : ''} {...d(1)}>{name}</h1>
          <p className={`bio${intro ? ' fade-in' : ''}`} {...d(2)}>{bio}</p>
          <div className={`contact${intro ? ' fade-in' : ''}`} {...d(3)}>
            <h3>Contact</h3>
            <ul>
              <li><a href={`mailto:${contact.email}`}>{contact.email}</a></li>
              <li><a href={contact.linkedin} target="_blank" rel="noopener noreferrer">LinkedIn</a></li>
            </ul>
          </div>
        </aside>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Resume />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/portfolio/:slug" element={<CaseStudy />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
