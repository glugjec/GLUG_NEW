import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/common/Card.jsx'

const NOTIFICATIONS = [
  { id: 'forum', label: 'Forum replies', desc: 'When someone replies to your posts' },
  { id: 'events', label: 'Event reminders', desc: 'Reminders about upcoming GLUG events' },
  { id: 'newsletter', label: 'Newsletter', desc: 'Monthly community digest' },
]

export default function Settings() {
  const { user } = useAuth()
  const [toggles, setToggles] = useState({ forum: true, events: true, newsletter: false })

  const toggle = (id) => setToggles((curr) => ({ ...curr, [id]: !curr[id] }))

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
      <p className="page-subtitle">Manage your GLUG account and preferences.</p>

      <div className="settings-stack">
        <Card>
          <h2>Account</h2>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-username">Username</label>
              <input id="set-username" className="settings-input" type="text" defaultValue={user.username} />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-email">Email</label>
              <input id="set-email" className="settings-input" type="email" defaultValue={user.email} />
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-password">New password</label>
              <input id="set-password" className="settings-input" type="password" placeholder="••••••••" />
            </div>
          </div>
        </Card>

        <Card>
          <h2>Notifications</h2>
          <div className="settings-list">
            {NOTIFICATIONS.map((item) => (
              <div className="settings-row" key={item.id}>
                <div className="settings-row-info">
                  <span className="settings-row-label">{item.label}</span>
                  <span className="settings-row-desc">{item.desc}</span>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={toggles[item.id]}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h2>Preferences</h2>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-theme">Theme</label>
              <select id="set-theme" className="settings-input settings-select" defaultValue="dark">
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="system">System</option>
              </select>
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-fontsize">Editor font size</label>
              <select id="set-fontsize" className="settings-input settings-select" defaultValue="14">
                <option value="13">13px</option>
                <option value="14">14px</option>
                <option value="16">16px</option>
              </select>
            </div>
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-lang">Language</label>
              <select id="set-lang" className="settings-input settings-select" defaultValue="en">
                <option value="en">English</option>
                <option value="hi">हिन्दी</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="settings-actions">
          <button type="button" className="btn btn-ghost">Cancel</button>
          <button type="button" className="btn btn-primary">Save Changes</button>
        </div>
      </div>
    </section>
  )
}