import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon } from 'lucide-react'

function TopBarAvatar({ src, username, email, size = 30, className = '' }) {
  const [error, setError] = useState(false)
  const name = username || email || 'User'

  if (src && !error && src.startsWith('http')) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setError(true)}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }

  if (src === 'tux') {
    return (
      <div
        className={className}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}
      >
        <svg viewBox="0 0 24 24" width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} fill="#fbbf24">
          <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
        </svg>
      </div>
    )
  }

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(name),
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.42)}px`,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {avatarInitials(name)}
    </div>
  )
}

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
              className={`topbar-user-pill${menuOpen ? ' is-active' : ''}`}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
            >
              <TopBarAvatar
                src={user.avatar}
                username={user.username}
                email={user.email}
                size={30}
                className="topbar-pill-avatar"
              />
              <span className="topbar-pill-name">
                {user.username
                  ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                  : (user.email ? user.email.split('@')[0] : 'Member')}
              </span>
              <ChevronDown
                size={14}
                className={`topbar-pill-chevron${menuOpen ? ' is-open' : ''}`}
              />
            </button>

            {menuOpen && (
              <div className="topbar-dropdown-menu">
                <div className="topbar-dd-header">
                  <TopBarAvatar
                    src={user.avatar}
                    username={user.username}
                    email={user.email}
                    size={38}
                    className="topbar-dd-avatar"
                  />
                  <div className="topbar-dd-user-meta">
                    <span className="topbar-dd-name">
                      {user.username
                        ? (user.username.includes('@') ? user.username.split('@')[0] : user.username)
                        : (user.email ? user.email.split('@')[0] : 'Member')}
                    </span>
                    <span className="topbar-dd-email" title={user.email}>
                      {user.email}
                    </span>
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