import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon } from 'lucide-react'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const inputRef = useRef(null)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotifOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/forum?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar-v2">
      <form className="topbar-search-wrapper" onSubmit={handleSearchSubmit}>
        <Search size={17} className="topbar-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="topbar-search-input"
          placeholder="Search discussions, topics, or members..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="topbar-search-shortcut">
          <span>⌘ K</span>
        </div>
      </form>

      <div className="topbar-actions">
        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            <span className="notif-dot"></span>
          </button>

          {notifOpen && (
            <div className="notif-popover">
              <div className="notif-header">
                <span className="notif-title">Notifications</span>
                <span className="notif-count">1 new</span>
              </div>
              <div className="notif-list">
                <div className="notif-item">
                  <div className="notif-dot-unread"></div>
                  <div className="notif-content">
                    <p className="notif-text">Welcome to GLUG! Check out upcoming workshops and join the community forum.</p>
                    <span className="notif-time">Just now</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {user ? (
          <div className="topbar-user-wrap" ref={menuRef}>
            <button
              type="button"
              className="topbar-user-pill"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <div
                className="topbar-pill-avatar"
                style={{ background: avatarColor(user.username) }}
              >
                {avatarInitials(user.username)}
              </div>
              <span className="topbar-pill-name">
                {user.email || user.username}
              </span>
              <ChevronDown size={14} className="topbar-pill-chevron" />
            </button>

            {menuOpen && (
              <div className="topbar-dropdown-menu">
                <div className="topbar-dd-header">
                  <div
                    className="topbar-dd-avatar"
                    style={{ background: avatarColor(user.username) }}
                  >
                    {avatarInitials(user.username)}
                  </div>
                  <div className="topbar-dd-user-meta">
                    <span className="topbar-dd-name">{user.username}</span>
                    <span className="topbar-dd-email">{user.email}</span>
                  </div>
                </div>

                <div className="topbar-dd-divider" />

                <Link
                  to="/profile"
                  className="topbar-dd-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <User size={16} /> Profile
                </Link>
                <Link
                  to="/settings"
                  className="topbar-dd-item"
                  onClick={() => setMenuOpen(false)}
                >
                  <SettingsIcon size={16} /> Settings
                </Link>

                <div className="topbar-dd-divider" />

                <button
                  type="button"
                  className="topbar-dd-item topbar-dd-danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="topbar-auth-btns">
            <Link to="/login" className="topbar-btn-login">
              Log In
            </Link>
            <Link to="/register" className="topbar-btn-signup">
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </header>
  )
}