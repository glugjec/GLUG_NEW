import ResourceCard from '../components/resources/ResourceCard.jsx'

const topics = [
  {
    title: 'Getting Started',
    description: 'What is Linux, distributions, and installing your first OS.',
    items: ['What is Linux?', 'Choosing a distribution', 'Dual-booting basics'],
  },
  {
    title: 'Command Line Basics',
    description: 'The terminal is your superpower. Master the essentials.',
    items: ['Navigating the filesystem (cd, ls, pwd)', 'File operations (cp, mv, rm)', 'Pipes, redirection and grep'],
  },
  {
    title: 'System Administration',
    description: 'Manage users, permissions, and processes like a pro.',
    items: ['Users and groups', 'File permissions (chmod, chown)', 'Process management (ps, top, kill)'],
  },
  {
    title: 'Advanced Topics',
    description: 'Level up with scripting and automation.',
    items: ['Bash scripting fundamentals', 'Package managers (apt, dnf, pacman)', 'Networking basics (ip, ping, curl)'],
  },
]

export default function Resources() {
  return (
    <section className="page">
      <h1 className="page-title">Linux Resources</h1>
      <p className="page-subtitle">
        A student-friendly guide to Linux — from your first command to system
        administration.
      </p>
      <div className="cards">
        {topics.map((topic) => (
          <ResourceCard
            key={topic.title}
            title={topic.title}
            description={topic.description}
            items={topic.items}
          />
        ))}
      </div>
    </section>
  )
}