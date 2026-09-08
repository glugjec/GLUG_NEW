import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { resourcesApi } from '../api.js'
import ResourceCard from '../components/resources/ResourceCard.jsx'

const DEFAULT_TOPICS = [
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
  const { user } = useAuth()
  const [topics, setTopics] = useState(DEFAULT_TOPICS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    resourcesApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setTopics(data)
        }
      })
      .catch((err) => console.warn('Could not load dynamic resources, using default curriculum:', err))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="page">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">Linux Resources</h1>
          <p className="page-subtitle">
            A student-friendly guide to Linux — from your first command to system administration.
          </p>
        </div>

        {user?.role === 'admin' && (
          <Link
            to="/admin?tab=resources"
            style={{
              background: '#238636',
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            🛡️ Manage Resources
          </Link>
        )}
      </div>

      {user?.role === 'admin' && (
        <div
          style={{
            background: 'rgba(88, 166, 255, 0.08)',
            border: '1px solid rgba(88, 166, 255, 0.25)',
            borderRadius: '8px',
            padding: '10px 16px',
            marginBottom: '24px',
            fontSize: '13px',
            color: '#8b949e',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>
            💡 You have administrator access. You can publish new tutorials, study notes, or edit curriculum topics.
          </span>
          <Link to="/admin?tab=resources" style={{ color: '#58a6ff', fontWeight: 600, textDecoration: 'none' }}>
            Open Resource Publisher &rarr;
          </Link>
        </div>
      )}

      <div className="cards">
        {topics.map((topic) => (
          <ResourceCard
            key={topic.id || topic.title}
            title={topic.title}
            description={topic.description}
            items={topic.items || []}
          />
        ))}
      </div>
    </section>
  )
}
