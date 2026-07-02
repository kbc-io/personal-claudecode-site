import resumeData from "../data/resume.json"
import { defaultDescription } from "../data/siteMeta"
import PageMeta from "./PageMeta"

const clients = resumeData["clients and collaborators"];

function ClientList() {
  return (
    <ul>
      {clients.map((client, index) => (
        <li key={index}>
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
  );
}

function About() {
  return (
    <section className="section">
      <PageMeta
        title="About"
        description={defaultDescription}
        path="/about"
      />
      <h2 className="fade-in" style={{ animationDelay: '0s' }}>About</h2>
      <div className="about-content">
        <div className="about-blurb-container fade-in" style={{ animationDelay: '0.1s' }}>
          <p>
            I am a multidisciplinary designer and 3D artist specializing in
            in-house brand cultivation. In addition to graphic design, I have a
            robust background in video production and photography, giving me a
            skilled eye for composition, balance, and story.
          </p>
          <p>
            My experience working with different mediums allows me to coordinate
            branding efforts across the entire content spectrum, generating
            cohesive and impactful campaigns. I have worked for and collaborated
            with clients across the public and private sectors, including Agility
            Robotics, TIME, National Geographic, Active911, Oregon State
            University, and Daxbot.
          </p>
          <p>
            When I'm not working or chasing my kids around, I enjoy strength training, tinkering with my homelab, and chipping away at
            a Cosmere novel.
          </p>
        </div>
        <h2 className="fade-in" style={{ animationDelay: '0.2s' }}>Clients + Collaborators</h2>
        <div className="fade-in" style={{ animationDelay: '0.3s' }}>
          <ClientList />
        </div>
      </div>
    </section>
  );
}

export { ClientList };
export default About;