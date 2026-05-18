import resumeData from "../data/resume.json"
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
      <h2 className="fade-in" style={{ animationDelay: '0s' }}>About</h2>
      <div className="about-content">
        <p className="fade-in" style={{ animationDelay: '0.1s' }}>
          I am a multidisciplinary designer and 3D artist specializing in
          in-house brand cultivation. In addition to graphic design, I have a
          robust background in video production and photography, giving me a
          skilled eye for composition, balance, and story.
        </p>
        <p className="fade-in" style={{ animationDelay: '0.2s' }}>
          My experience working with different mediums allows me to coordinate
          branding efforts across the entire content spectrum, generating
          cohesive and impactful campaigns. I have worked for and collaborated
          with clients across the public and private sectors, including Agility
          Robotics, TIME, National Geographic, Active911, Oregon State
          University, and Daxbot.
        </p>
        <p className="fade-in" style={{ animationDelay: '0.3s' }}>
          When I'm not working or chasing my kids around, I enjoy strength training, tinkering with my homelab, and chipping away at
          a Cosmere novel.
        </p>
        <br></br>
        <h2 className="fade-in" style={{ animationDelay: '0.4s' }}>Clients + Collaborators</h2>
        <div className="fade-in" style={{ animationDelay: '0.5s' }}>
          <ClientList />
        </div>
      </div>
    </section>
  );
}

export { ClientList };
export default About;