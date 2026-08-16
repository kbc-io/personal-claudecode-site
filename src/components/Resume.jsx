import resumeData from '../data/resume.json'
import { usePageMeta } from '../hooks/usePageMeta'

function Resume() {
  usePageMeta({
    title: 'Experience',
    description:
      'Kevin Coalwell — Brand Designer at Agility Robotics, freelance UI/UX Designer for Carnegie Mellon, previously Brand Manager at Active911.'
  })

  const { experience, education, skills, awards } = resumeData

  // Group consecutive roles at the same company to show tenure.
  const visibleExperience = experience.filter(job => job.visible !== false)
  const groupedExperience = visibleExperience.reduce((groups, job, i) => {
    if (i === 0 || job.company !== visibleExperience[i - 1].company) {
      groups.push([job])
    } else {
      groups[groups.length - 1].push(job)
    }
    return groups
  }, [])

  let delayIndex = 0
  const nextDelay = () => `${++delayIndex * 0.06}s`

  return (
    <>
      <section className="section">
        <h1 className="page-title fade-in">Experience</h1>

        {groupedExperience.map((group) => (
          <div key={group[0].company + group[0].duration} className="company-group">
            {group.map((job) => (
              <div className="job fade-in" key={job.title + job.duration} style={{ animationDelay: nextDelay() }}>
                <div className="job-header">
                  <span className="job-title">{job.title}</span>
                  <span className="job-date">{job.duration}</span>
                </div>
                <div className="job-company">
                  {job.url ? (
                    <a href={job.url} target="_blank" rel="noopener noreferrer">{job.company}</a>
                  ) : (
                    job.company
                  )}
                  {job.time && <span className="job-location"> · {job.time}</span>}
                </div>
                {job.highlights?.length > 0 && (
                  <div className="job-description">
                    <ul>
                      {job.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="section">
        <h2 className="section-heading">Skills</h2>
        <div className="resume-section-container">
          {skills.map((group) => (
            <div className="job fade-in" key={group.category} style={{ animationDelay: nextDelay() }}>
              <div className="job-header">
                <span className="job-title">{group.category}</span>
              </div>
              <div className="job-description">
                <p>{group.items.join(' · ')}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <h2 className="section-heading">Education</h2>
        <div className="resume-section-container">
          {education.map((edu) => (
            <div className="job fade-in" key={edu.degree} style={{ animationDelay: nextDelay() }}>
              <div className="job-header">
                <span className="job-title">{edu.degree}</span>
                <span className="job-date">
                  {edu.issued ? edu.issued : `${edu.startDate}–${edu.endDate}`}
                </span>
              </div>
              <div className="job-company">{edu.institution}</div>
            </div>
          ))}
        </div>
      </section>

      {awards?.length > 0 && (
        <section className="section">
          <h2 className="section-heading">Awards</h2>
          <ul className="award-list">
            {awards.map((award) => (
              <li key={award.title + award.year}>
                <span>{award.title}</span>
                <span className="award-year">{award.year}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  )
}

export default Resume
