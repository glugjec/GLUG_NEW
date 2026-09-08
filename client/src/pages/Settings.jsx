import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi } from '../api.js'
import Card from '../components/common/Card.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import { Check } from 'lucide-react'

const NOTIFICATIONS = [
  { id: 'forum', label: 'Forum replies', desc: 'When someone replies to your posts or comments' },
  { id: 'events', label: 'Event reminders', desc: 'Reminders about upcoming GLUG workshops & hackathons' },
  { id: 'newsletter', label: 'Open-Source Digest', desc: 'Monthly Linux tools and project highlights' },
]

export default function Settings() {
  const { user } = useAuth()

  // Notification toggles
  const [toggles, setToggles] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('glug_notif_prefs')) || {
        forum: true,
        events: true,
        newsletter: false,
      }
    } catch {
      return { forum: true, events: true, newsletter: false }
    }
  })

  // Preferences
  const [theme, setTheme] = useState(() => localStorage.getItem('glug_theme') || 'dark')
  const [editorFontSize, setEditorFontSize] = useState(
    () => localStorage.getItem('glug_editor_font_size') || '14'
  )

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [saving, setSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [error, setError] = useState('')

  const toggle = (id) => {
    const updated = { ...toggles, [id]: !toggles[id] }
    setToggles(updated)
    localStorage.setItem('glug_notif_prefs', JSON.stringify(updated))
  }

  const handleThemeChange = (val) => {
    setTheme(val)
    localStorage.setItem('glug_theme', val)
  }

  const handleFontSizeChange = (val) => {
    setEditorFontSize(val)
    localStorage.setItem('glug_editor_font_size', val)
  }

  const handleSaveChanges = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (newPassword) {
      if (newPassword.length < 6) {
        setError('New password must be at least 6 characters.')
        return
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.')
        return
      }
      if (!currentPassword) {
        setError('Please enter your current password to set a new password.')
        return
      }
    }

    setSaving(true)
    try {
      if (newPassword) {
        await authApi.updateProfile({ currentPassword, newPassword })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      }

      setSuccessMessage('Settings updated successfully!')
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">
          You are not logged in.{' '}
          <Link to="/login" className="link">
            Log in
          </Link>{' '}
          to manage your account settings.
        </p>
      </section>
    )
  }

  return (
    <section className="page settings-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Account Settings</h1>
          <p className="page-subtitle">Manage your GLUG account security and interface preferences.</p>
        </div>
      </div>

      <ErrorMessage message={error} />
      {successMessage && (
        <div className="success-banner">
          <Check size={16} />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSaveChanges} className="settings-stack">
        <Card>
          <h2>Account Details</h2>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-username">
                Username
              </label>
              <input
                id="set-username"
                className="settings-input"
                type="text"
                value={user.username}
                disabled
                title="Usernames cannot be changed"
              />
              <span className="field-note">Username cannot be changed</span>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="set-email">
                Email Address
              </label>
              <input
                id="set-email"
                className="settings-input"
                type="email"
                value={user.email}
                disabled
                title="Contact an admin to change your registered email"
              />
              <span className="field-note">Linked to your student account</span>
            </div>
          </div>
        </Card>

        <Card>
          <h2>Security &amp; Password</h2>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="cur-password">
                Current Password
              </label>
              <input
                id="cur-password"
                className="settings-input"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="new-password">
                New Password
              </label>
              <input
                id="new-password"
                className="settings-input"
                type="password"
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="confirm-password">
                Confirm New Password
              </label>
              <input
                id="confirm-password"
                className="settings-input"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
        </Card>

        <Card>
          <h2>Notification Preferences</h2>
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
          <h2>Editor &amp; Interface</h2>
          <div className="settings-grid">
            <div className="settings-field">
              <label className="settings-label" htmlFor="set-theme">
                Theme
              </label>
              <select
                id="set-theme"
                className="settings-input settings-select"
                value={theme}
                onChange={(e) => handleThemeChange(e.target.value)}
              >
                <option value="dark">Dark (Terminal Black)</option>
                <option value="cyber">Cyberpunk Dark</option>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="set-fontsize">
                Online Compiler Font Size
              </label>
              <select
                id="set-fontsize"
                className="settings-input settings-select"
                value={editorFontSize}
                onChange={(e) => handleFontSizeChange(e.target.value)}
              >
                <option value="12">12px</option>
                <option value="14">14px (Recommended)</option>
                <option value="16">16px</option>
                <option value="18">18px</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="settings-actions">
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? 'Saving changes…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </section>
  )
}