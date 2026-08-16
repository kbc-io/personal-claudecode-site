import { Link } from 'react-router-dom'
import { usePageMeta } from '../hooks/usePageMeta'

function NotFound() {
  usePageMeta({ title: 'Page not found' })

  return (
    <section className="section not-found">
      <h1 className="page-title">Page not found</h1>
      <p>
        That page doesn&rsquo;t exist. It may have moved, or the link that
        brought you here may be out of date.
      </p>
      <Link to="/portfolio" className="case-study-link">View recent work</Link>
    </section>
  )
}

export default NotFound
