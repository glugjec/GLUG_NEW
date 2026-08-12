import Card from '../components/common/Card.jsx'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

const SECTIONS = [
  {
    title: 'Account',
    items: ['Username', 'Email', 'Password'],
  },
  {
    title: 'Notifications',
    items: ['Forum replies', 'Event reminders', 'Newsletter'],
  },
  {
    title: 'Preferences',
    items: ['Theme', 'Code editor settings', 'Language'],
  },
]

export default function Settings() {
  const { user } = useAuth()

  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          You are not logged in.{' '}
          <Link to="/login" className="link">Log in</Link> to manage your settings.
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="page-title">Settings</h1>
      <p className="page-subtitle">
        Manage your GLUG account preferences.
      </p>

      <div className="cards">
        {SECTIONS.map((section) => (
          <Card key={section.title}>
            <h2 className="card-title">{section.title}</h2>
            <p className="card-text">
              {section.items.join(', ')} — coming soon.
            </p>
          </Card>
        ))}
      </div>
    </section>
  )
}