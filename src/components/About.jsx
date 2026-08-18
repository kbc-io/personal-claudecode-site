import resumeData from '../data/resume.json'
import { usePageMeta } from '../hooks/usePageMeta'

const clients = resumeData['clients and collaborators']

function ClientList() {
  return (
    <ul className="client-list">
      {clients.map((client) => (
        <li key={client.name}>
          {client.url ? (
            <a href={client.url} target="_blank" rel="noopener noreferrer">
              {client.name}
            </a>
          ) : (
            client.name
          )}
        </li>
      ))}
    </ul>
  )
}

function About() {
  usePageMeta({
    title: 'About',
    description:
      'Kevin Coalwell is a product and brand designer working on interfaces for complex technical systems, currently at Agility Robotics.'
  })

  return (
    <section className="section">
      <h1 className="page-title fade-in">About</h1>

      <div className="about-content">
        <div className="about-blurb-container fade-in" style={{ animationDelay: '0.1s' }}>
          {resumeData.about.map((paragraph) => (
            <p key={paragraph.slice(0, 40)}>{paragraph}</p>
          ))}
        </div>

        <h2 className="section-heading fade-in" style={{ animationDelay: '0.2s' }}>
          Clients + Collaborators
        </h2>
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          <ClientList />
        </div>
      </div>
    </section>
  )
}

export { ClientList }
export default About
