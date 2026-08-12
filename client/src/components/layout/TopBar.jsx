import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'

export default function TopBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const wrapRef = useRef(null)

  // Close the menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="topbar-logo">G</span>
        <span className="topbar-name">GLUG</span>
      </Link>
      <div className="topbar-auth">
        {user ? (
          <div className="topbar-profile-wrap" ref={wrapRef}>
            {/* Dropdown menu */}
            <div className={`topbar-user-menu${menuOpen ? ' topbar-user-menu--open' : ''}`} role="menu">
              <div className="topbar-menu-header">
                <div
                  className="topbar-menu-avatar"
                  style={{ background: avatarColor(user.username) }}
                >
                  {avatarInitials(user.username)}
                </div>
                <div className="topbar-menu-names">
                  <span className="topbar-menu-username">{user.username}</span>
                  <span className="topbar-menu-email">{user.email}</span>
                </div>
              </div>

              <Link to="/profile" className="topbar-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" />
                </svg>
                Profile
              </Link>
              <Link to="/settings" className="topbar-menu-item" role="menuitem" onClick={() => setMenuOpen(false)}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54a.48.48 0 0 0-.48-.41h-3.84a.48.48 0 0 0-.48.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.48.48 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.48-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58ZM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2Z" />
                </svg>
                Settings
              </Link>

              <div className="topbar-menu-divider" />

              <button className="topbar-menu-item topbar-menu-item--danger" role="menuitem" onClick={handleLogout}>
                <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                  <path d="M17 8l-1.41 1.41L17.17 11H9v2h8.17l-1.58 1.58L17 16l4-4-4-4ZM5 5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7v-2H5V5Z" />
                </svg>
                Logout
              </button>
            </div>

            {/* Profile avatar button */}
            <button
              type="button"
              className={`topbar-avatar-btn${menuOpen ? ' topbar-avatar-btn--active' : ''}`}
              style={{ background: avatarColor(user.username) }}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              title={user.email}
            >
              {avatarInitials(user.username)}
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  )
}