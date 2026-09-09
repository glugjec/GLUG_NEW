import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import {
  Home,
  MessageSquare,
  Folder,
  Users,
  Calendar,
  FileText,
  Terminal,
  Code2,
  Info,
  Plus,
  Sun,
  Moon,
  Shield,
  LogOut,
  ChevronUp,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react'

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/forum', label: 'Discussions', icon: MessageSquare },
  { to: '/categories', label: 'Categories', icon: Folder },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/events', label: 'Events', icon: Calendar },
  { to: '/resources', label: 'Resources', icon: FileText },
  { to: '/terminal', label: 'Terminal', icon: Terminal },
  { to: '/compiler', label: 'Compiler', icon: Code2 },
  { to: '/about', label: 'About', icon: Info },
]

export default function Sidebar({ collapsed, onToggle, mobileOpen, onToggleMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cardOpen, setCardOpen] = useState(false)
  const [cardPos, setCardPos] = useState({ bottom: 0, left: 0 })
  const [theme, setTheme] = useState(() => localStorage.getItem('glug_theme') || 'dark')
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const cardRef = useRef(null)

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('glug_theme', nextTheme)
    document.documentElement.setAttribute('data-theme', nextTheme)
  }

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const linkClass = ({ isActive }) =>
    `sb-nav-item${isActive ? ' sb-nav-item-active' : ''}`

  const openCard = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setCardPos({
        bottom: window.innerHeight - r.top + 8,
        left: collapsed ? r.right + 10 : r.left,
      })
    }
    setCardOpen(true)
  }

  const toggleCard = () => (cardOpen ? setCardOpen(false) : openCard())

  useEffect(() => {
    if (!cardOpen) return
    const handler = (e) => {
      if (cardRef.current && cardRef.current.contains(e.target)) return
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setCardOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [cardOpen])

  const handleLogout = () => {
    setCardOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      <button
        type="button"
        className={`sidebar-hamburger${mobileOpen ? ' is-open' : ''}`}
        onClick={onToggleMobile}
        aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
          <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
        </svg>
      </button>

      <aside className={`sidebar-v2${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <div className="sb-header">
          <Link to="/" className="sb-brand">
            <div className="sb-brand-logo">G</div>
            <div className="sb-brand-meta">
              <span className="sb-brand-title">GLUG</span>
              <span className="sb-brand-sub">Learn · Share · Grow</span>
            </div>
          </Link>
          <button
            type="button"
            className="sb-collapse-btn"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? <PanelLeft size={17} /> : <PanelLeftClose size={17} />}
          </button>
        </div>

        <nav className="sb-nav-list">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={linkClass}
                title={collapsed ? item.label : undefined}
              >
                <span className="sb-nav-icon">
                  <Icon size={19} />
                </span>
                <span className="sb-nav-text">{item.label}</span>
              </NavLink>
            )
          })}

          {user?.role === 'admin' && (
            <NavLink
              to="/admin"
              className={linkClass}
              title={collapsed ? 'Admin Panel' : undefined}
            >
              <span className="sb-nav-icon" style={{ color: '#f59e0b' }}>
                <Shield size={19} />
              </span>
              <span className="sb-nav-text" style={{ color: '#f59e0b', fontWeight: 600 }}>
                Admin Panel
              </span>
            </NavLink>
          )}

          <div className="sb-action-wrap">
            <Link to="/forum" className="sb-new-post-btn" title={collapsed ? 'New Post' : undefined}>
              <Plus size={18} />
              <span className="sb-nav-text">New Post</span>
            </Link>
          </div>
        </nav>

        <div className="sb-footer">
          <div className="sb-quote-card">
            <p className="sb-quote-text">“Open minds build a better world.”</p>
            <span className="sb-quote-author">— GLUG</span>
            <div className="sb-quote-art">
              <svg viewBox="0 0 100 45" className="sb-tux-mini-svg">
                <ellipse cx="50" cy="38" rx="45" ry="12" fill="#090d16" />
                <ellipse cx="50" cy="22" rx="14" ry="16" fill="#0f172a" />
                <ellipse cx="50" cy="24" rx="9" ry="12" fill="#f8fafc" />
                <circle cx="50" cy="11" r="8" fill="#0f172a" />
                <polygon points="48,13 52,13 50,17" fill="#f59e0b" />
                <ellipse cx="44" cy="35" rx="5" ry="2.5" fill="#f59e0b" />
                <ellipse cx="56" cy="35" rx="5" ry="2.5" fill="#f59e0b" />
              </svg>
            </div>
          </div>

          <div className="sb-controls">
            <button
              type="button"
              className="sb-theme-switch"
              onClick={toggleTheme}
              aria-label="Toggle color theme"
            >
              <Sun size={15} className={`theme-icon ${theme === 'light' ? 'is-active' : ''}`} />
              <Moon size={15} className={`theme-icon ${theme === 'dark' ? 'is-active' : ''}`} />
            </button>
          </div>

          {user ? (
            <div className="sb-user-box" ref={wrapRef}>
              {createPortal(
                <div
                  ref={cardRef}
                  className={`sb-profile-card${cardOpen ? ' sb-profile-card--open' : ''}`}
                  style={{ bottom: cardPos.bottom, left: cardPos.left }}
                >
                  <div
                    className="sb-card-banner"
                    style={{
                      background: `linear-gradient(135deg, ${avatarColor(user.username)}66, #1e2638)`
                    }}
                  />
                  <div className="sb-card-identity">
                    <div
                      className="sb-card-avatar"
                      style={{ background: avatarColor(user.username) }}
                    >
                      {avatarInitials(user.username)}
                    </div>
                    <div className="sb-card-names">
                      <span className="sb-card-username">{user.username}</span>
                      <span className="sb-card-email">{user.email}</span>
                    </div>
                  </div>
                  <div className="sb-card-divider" />
                  <Link
                    to="/profile"
                    className="sb-card-action"
                    onClick={() => setCardOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link
                    to="/settings"
                    className="sb-card-action"
                    onClick={() => setCardOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="sb-card-divider" />
                  <button className="sb-card-action sb-card-danger" onClick={handleLogout}>
                    <LogOut size={16} /> Log out
                  </button>
                </div>,
                document.body
              )}

              <button
                ref={btnRef}
                className="sb-user-btn"
                onClick={toggleCard}
                aria-label="User account"
              >
                <div
                  className="sb-avatar-pill"
                  style={{ background: avatarColor(user.username) }}
                >
                  {avatarInitials(user.username)}
                </div>
                <div className="sb-user-meta sb-nav-text">
                  <span className="sb-user-name">{user.username}</span>
                  <span className="sb-user-handle">{user.email}</span>
                </div>
                <ChevronUp size={15} className="sb-user-chev sb-nav-text" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="sb-login-link">
              <span className="sb-nav-icon">
                <Users size={18} />
              </span>
              <span className="sb-nav-text">Sign In</span>
            </Link>
          )}
        </div>
      </aside>
    </>
  )
}