import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { authApi } from '../api.js'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import {
  User,
  Shield,
  Palette,
  Bell,
  AlertTriangle,
  Check,
  CheckCircle2,
  Lock,
  Mail,
  Moon,
  Sun,
  Monitor,
  Terminal,
  LogOut,
  Trash2,
  ArrowRight,
  Sparkles
} from 'lucide-react'
import './Settings.css'

export default function Settings() {
  const { user, updateUser, logout } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('account')
  const [toastMessage, setToastMessage] = useState('')
  const [error, setError] = useState('')

  // Account State
  const [username, setUsername] = useState(user?.username || '')
  const [savingAccount, setSavingAccount] = useState(false)

  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  // Theme & Appearance State
  const [theme, setTheme] = useState(() => localStorage.getItem('glug_theme') || 'dark')
  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem('glug_editor_font_size') || '14'
  )

  // Notification State
  const [notifs, setNotifs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('glug_notif_prefs')) || {
        replies: true,
        events: true,
        newsletter: false,
        toasts: true
      }
    } catch {
      return { replies: true, events: true, newsletter: false, toasts: true }
    }
  })

  useEffect(() => {
    if (user) {
      setUsername(user.username || '')
      if (user.preferences?.theme) {
        setTheme(user.preferences.theme)
      }
    }
  }, [user])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 3000)
  }

  const handleUpdateUsername = async (e) => {
    e.preventDefault()
    setError('')
    if (!username.trim() || username.trim() === user?.username) return

    setSavingAccount(true)
    try {
      const res = await authApi.updateProfile({ username: username.trim() })
      if (res?.user) {
        updateUser(res.user)
        showToast('Username updated successfully!')
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingAccount(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword) {
      setError('Please enter a new password.')
      return
    }
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await authApi.updateProfile({ currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password changed successfully!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  const handleThemeSelect = (selectedTheme) => {
    setTheme(selectedTheme)
    localStorage.setItem('glug_theme', selectedTheme)
    document.documentElement.setAttribute('data-theme', selectedTheme)
    window.dispatchEvent(new CustomEvent('glug-theme-change', { detail: selectedTheme }))
    showToast(`Switched to ${selectedTheme === 'dark' ? 'Dark' : selectedTheme === 'light' ? 'Light' : 'Cyber'} mode`)

    if (user) {
      authApi.updateProfile({ preferences: { ...user.preferences, theme: selectedTheme } }).catch(() => {})
    }
  }

  const handleFontSizeChange = (val) => {
    setFontSize(val)
    localStorage.setItem('glug_editor_font_size', val)
    showToast(`Editor font size set to ${val}px`)
  }

  const handleToggleNotif = (key) => {
    const updated = { ...notifs, [key]: !notifs[key] }
    setNotifs(updated)
    localStorage.setItem('glug_notif_prefs', JSON.stringify(updated))
    showToast('Preferences updated')

    if (user) {
      authApi.updateProfile({
        preferences: {
          ...user.preferences,
          emailNotifs: updated.newsletter,
          replyNotifs: updated.replies,
          eventNotifs: updated.events
        }
      }).catch(() => {})
    }
  }

  const handleClearCache = () => {
    localStorage.removeItem('glug_terminal_state')
    showToast('Terminal session cache reset.')
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  if (!user) {
    return (
      <div className="settings-page-container">
        <div className="settings-section-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <Lock size={44} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h2 style={{ color: 'var(--text)', margin: '0 0 0.5rem' }}>Please sign in to view settings</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            You need to be logged into your student account to customize interface and security options.
          </p>
          <Link to="/login" className="profile-btn-primary" style={{ display: 'inline-flex' }}>
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="settings-page-container">
      <div className="settings-header-banner">
        <div>
          <h1 className="settings-header-title">Settings &amp; Preferences</h1>
          <p className="settings-header-subtitle">
            Manage your account security, appearance, and notification settings.
          </p>
        </div>
        <Link to="/profile" className="profile-btn-secondary">
          View Profile <ArrowRight size={14} />
        </Link>
      </div>

      <ErrorMessage message={error} />

      <div className="settings-layout-grid">
        <aside className="settings-sidebar-nav">
          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'account' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('account'); setError(''); }}
          >
            <User size={16} />
            <span>Account</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'security' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('security'); setError(''); }}
          >
            <Shield size={16} />
            <span>Security &amp; Password</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'appearance' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('appearance'); setError(''); }}
          >
            <Palette size={16} />
            <span>Theme &amp; Editor</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'notifications' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('notifications'); setError(''); }}
          >
            <Bell size={16} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            className={`settings-nav-item ${activeTab === 'danger' ? 'is-active' : ''}`}
            onClick={() => { setActiveTab('danger'); setError(''); }}
          >
            <AlertTriangle size={16} color="#ef4444" />
            <span style={{ color: '#ef4444' }}>Danger Zone</span>
          </button>
        </aside>

        <div className="settings-content-stack">
          {activeTab === 'account' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <User size={20} color="#3b82f6" /> Account &amp; Identity
                </h2>
                <p className="settings-section-desc">
                  Update your display handle and view your registered student details.
                </p>
              </div>

              <form onSubmit={handleUpdateUsername}>
                <div className="settings-form-grid">
                  <div className="settings-field-group">
                    <label className="settings-input-label">Username</label>
                    <input
                      type="text"
                      className="settings-input-control"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                    <span className="settings-field-hint">
                      Visible on all your forum discussions and comments.
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type="email"
                        className="settings-input-control"
                        value={user.email}
                        disabled
                      />
                    </div>
                    <span className="settings-field-hint">
                      Registered student email linked to your account.
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Community Role</label>
                    <input
                      type="text"
                      className="settings-input-control"
                      value={user.role === 'admin' ? 'Administrator' : 'Student Member'}
                      disabled
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Member Since</label>
                    <input
                      type="text"
                      className="settings-input-control"
                      value={user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Sep 2026'}
                      disabled
                    />
                  </div>
                </div>

                <div className="settings-save-bar">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={savingAccount || username === user.username}
                  >
                    {savingAccount ? 'Saving…' : <><Check size={14} /> Update Username</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Shield size={20} color="#10b981" /> Security &amp; Password
                </h2>
                <p className="settings-section-desc">
                  Protect your GLUG student account with a strong password.
                </p>
              </div>

              {user.googleId && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '1rem 1.25rem', borderRadius: 12, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <CheckCircle2 size={18} color="#3b82f6" />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text)' }}>
                    Your account is securely connected to <strong>Google OAuth</strong>. You can also set a password below to log in directly via email.
                  </span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword}>
                <div className="settings-form-grid">
                  <div className="settings-field-group settings-field-full">
                    <label className="settings-input-label">Current Password</label>
                    <input
                      type="password"
                      className="settings-input-control"
                      placeholder="Enter your current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                    />
                    <span className="settings-field-hint">
                      Required if you already have an existing password.
                    </span>
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">New Password</label>
                    <input
                      type="password"
                      className="settings-input-control"
                      placeholder="At least 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>

                  <div className="settings-field-group">
                    <label className="settings-input-label">Confirm New Password</label>
                    <input
                      type="password"
                      className="settings-input-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="settings-save-bar">
                  <button
                    type="submit"
                    className="profile-btn-primary"
                    disabled={savingPassword || !newPassword}
                  >
                    {savingPassword ? 'Updating…' : <><Check size={14} /> Update Password</>}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Palette size={20} color="#a855f7" /> Theme &amp; Interface
                </h2>
                <p className="settings-section-desc">
                  Choose your visual style, color scheme, and coding font preferences.
                </p>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label className="settings-input-label" style={{ display: 'block', marginBottom: '0.5rem' }}>
                  Interface Theme
                </label>
                <div className="settings-theme-selector">
                  <div
                    className={`theme-card-option ${theme === 'dark' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('dark')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#090d16', border: '1px solid #1e293b' }}>
                      <Moon size={18} color="#3b82f6" />
                    </div>
                    <span className="theme-name">Dark Mode</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Default Midnight</span>
                  </div>

                  <div
                    className={`theme-card-option ${theme === 'light' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('light')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#f8fafc', border: '1px solid #cbd5e1' }}>
                      <Sun size={18} color="#f59e0b" />
                    </div>
                    <span className="theme-name">Light Mode</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Crisp &amp; Clean</span>
                  </div>

                  <div
                    className={`theme-card-option ${theme === 'cyber' ? 'is-selected' : ''}`}
                    onClick={() => handleThemeSelect('cyber')}
                  >
                    <div className="theme-preview-pill" style={{ background: '#05050f', border: '1px solid #3b0764' }}>
                      <Sparkles size={18} color="#a855f7" />
                    </div>
                    <span className="theme-name">Cyberpunk</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Neon Violet</span>
                  </div>
                </div>
              </div>

              <div className="settings-form-grid">
                <div className="settings-field-group">
                  <label className="settings-input-label">Online Compiler &amp; Editor Font Size</label>
                  <select
                    className="settings-select-control"
                    value={fontSize}
                    onChange={(e) => handleFontSizeChange(e.target.value)}
                  >
                    <option value="12">12px — Compact</option>
                    <option value="14">14px — Default Recommended</option>
                    <option value="16">16px — Comfortable</option>
                    <option value="18">18px — Large</option>
                  </select>
                  <span className="settings-field-hint">
                    Applies to the web code compiler and interactive terminal.
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="settings-section-card">
              <div className="settings-section-header">
                <h2 className="settings-section-title">
                  <Bell size={20} color="#f59e0b" /> Notification Preferences
                </h2>
                <p className="settings-section-desc">
                  Choose which community updates and activity alerts you wish to receive.
                </p>
              </div>

              <div className="settings-toggle-list">
                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">Discussion &amp; Reply Alerts</span>
                    <span className="settings-toggle-subtitle">
                      Notify me when someone replies to my post or comments on my discussion.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.replies}
                      onChange={() => handleToggleNotif('replies')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">GLUG Workshop &amp; Event Reminders</span>
                    <span className="settings-toggle-subtitle">
                      Receive notices about upcoming installation drives, hackathons, and guest lectures.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.events}
                      onChange={() => handleToggleNotif('events')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">Open Source Digest Newsletter</span>
                    <span className="settings-toggle-subtitle">
                      Monthly curated digest highlighting Linux utilities, campus projects, and GSoC tips.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.newsletter}
                      onChange={() => handleToggleNotif('newsletter')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>

                <div className="settings-toggle-row">
                  <div className="settings-toggle-meta">
                    <span className="settings-toggle-title">In-App Toast Alerts</span>
                    <span className="settings-toggle-subtitle">
                      Show popup confirmation bubbles when performing actions like copying links or upvoting.
                    </span>
                  </div>
                  <label className="glug-switch">
                    <input
                      type="checkbox"
                      checked={notifs.toasts}
                      onChange={() => handleToggleNotif('toasts')}
                    />
                    <span className="glug-slider" />
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'danger' && (
            <div className="settings-section-card danger-zone-card">
              <div className="settings-section-header" style={{ borderColor: 'rgba(239, 68, 68, 0.25)' }}>
                <h2 className="settings-section-title" style={{ color: '#ef4444' }}>
                  <AlertTriangle size={20} color="#ef4444" /> Danger Zone
                </h2>
                <p className="settings-section-desc">
                  Session management and local cache reset actions.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="danger-action-box">
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: 'var(--text)', fontSize: '0.95rem' }}>
                      Reset Terminal Local Cache
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Clears offline file system state and command history stored in your browser.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={handleClearCache}
                  >
                    <Trash2 size={14} /> Clear Cache
                  </button>
                </div>

                <div className="danger-action-box">
                  <div>
                    <h4 style={{ margin: '0 0 0.2rem', color: 'var(--text)', fontSize: '0.95rem' }}>
                      Sign Out of Your Account
                    </h4>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      Terminates your current session and clears your local authentication token.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="danger-btn"
                    onClick={handleLogout}
                  >
                    <LogOut size={14} /> Log Out
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}