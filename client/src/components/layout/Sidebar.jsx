import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'

const NAV_SECTIONS = [
  {
    title: 'Community',
    items: [
      { to: '/', label: 'Home', icon: 'home', end: true },
      { to: '/resources', label: 'Resources', icon: 'book' },
      { to: '/compiler', label: 'Compiler', icon: 'code' },
      { to: '/forum', label: 'Forum', icon: 'chat' },
    ],
  },
]

const icon = (name) => {
  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8h5Z" />
        </svg>
      )
    case 'book':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M18 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-1 14H7v-2h10v2Zm0-4H7v-2h10v2Z" />
        </svg>
      )
    case 'chat':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2Zm-3 9H7V9h10v2Zm0-4H7V5h10v2Z" />
        </svg>
      )
    case 'code':
      return (
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
          <path d="M8.7 15.9 4.8 12l3.9-3.9a1 1 0 0 0-1.4-1.4L2.4 11.3a1 1 0 0 0 0 1.4l4.9 4.9a1 1 0 0 0 1.4-1.4Zm6.6 0 3.9-3.9-3.9-3.9a1 1 0 1 1 1.4-1.4l4.9 4.9a1 1 0 0 1 0 1.4l-4.9 4.9a1 1 0 0 1-1.4-1.4ZM13 6.3a1 1 0 0 0-1.9-.5l-4 12a1 1 0 1 0 1.9.5l4-12Z" />
        </svg>
      )
    default:
      return null
  }
}

const SectionIcon = ({ name }) => icon(name)

export default function Sidebar({ collapsed, onToggle, mobileOpen, onToggleMobile }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cardOpen, setCardOpen] = useState(false)
  const [cardDir, setCardDir] = useState('up')   // 'up' | 'right'
  const [cardPos, setCardPos] = useState({ bottom: 0, left: 0 })
  const wrapRef = useRef(null)
  const btnRef = useRef(null)
  const cardRef = useRef(null)

  const linkClass = ({ isActive }) =>
    `sidebar-link${isActive ? ' sidebar-link-active' : ''}`

  // Compute fixed position from the trigger button
  const openCard = () => {
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      if (collapsed) {
        // Collapsed: card pops out to the RIGHT of the avatar
        setCardDir('right')
        setCardPos({
          bottom: window.innerHeight - r.bottom,
          left: r.right + 10,
        })
      } else {
        // Expanded: card pops UP above the profile strip
        setCardDir('up')
        setCardPos({
          bottom: window.innerHeight - r.top + 8,
          left: r.left,
        })
      }
    }
    setCardOpen(true)
  }

  const toggleCard = () => cardOpen ? setCardOpen(false) : openCard()

  // Close card on outside click (including clicks inside errors of the card)
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
        {mobileOpen ? (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M18.3 5.71 12 12l6.3 6.29-1.42 1.42-6.3-6.3-6.29 6.3-1.42-1.42L10.59 12 4.3 5.71l1.41-1.42L12 10.59l6.3-6.3 1.41 1.42Z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
            <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
          </svg>
        )}
      </button>

      <aside className={`sidebar${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
        <div className="sidebar-top">
          <button
            type="button"
            className="sidebar-toggle"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M3 6h18v2H3V6Zm0 5h18v2H3v-2Zm0 5h18v2H3v-2Z" />
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_SECTIONS.map((section) => (
            <div className="sidebar-section" key={section.title}>
              <p className="sidebar-section-title">{section.title}</p>
              {section.items.map((item) => (
                <NavLink key={item.to} to={item.to} end={item.end} className={linkClass}>
                  <span className="sidebar-icon">{SectionIcon({ name: item.icon })}</span>
                  <span className="sidebar-label">{item.label}</span>
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* ── Profile area at the bottom ── */}
        <div className="sidebar-bottom">
          {user ? (
            <div className="sb-profile-wrap" ref={wrapRef}>
              {/* Floating profile card — portaled to <body> so it escapes the
                  sidebar's overflow/transform and always renders on screen */}
              {createPortal(
                <div
                  ref={cardRef}
                  className={`sb-profile-card${cardOpen ? ' sb-profile-card--open' : ''}${cardDir === 'right' ? ' sb-profile-card--right' : ''}`}
                  style={{ bottom: cardPos.bottom, left: cardPos.left }}
                >
                  {/* Card header banner */}
                  <div className="sb-card-banner" style={{ background: `linear-gradient(135deg, ${avatarColor(user.username)}55, ${avatarColor(user.username)}22)` }} />
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

                  <button className="sb-card-action" onClick={handleLogout}>
                    <svg viewBox="0 0 24 24" width="17" height="17" fill="currentColor">
                      <path d="M17 8l-1.41 1.41L17.17 11H9v2h8.17l-1.58 1.58L17 16l4-4-4-4ZM5 5h7V3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7v-2H5V5Z" />
                    </svg>
                    Log out
                  </button>
                </div>,
                document.body
              )}

              {/* Clickable profile strip */}
              <button
                ref={btnRef}
                className={`sb-profile-btn${cardOpen ? ' sb-profile-btn--active' : ''}`}
                onClick={toggleCard}
                aria-label="Open profile menu"
              >
                <div
                  className="sb-avatar"
                  style={{ background: avatarColor(user.username) }}
                >
                  {avatarInitials(user.username)}
                </div>
                <div className="sb-info sidebar-label">
                  <span className="sb-name">{user.username}</span>
                  <span className="sb-sub">{user.email}</span>
                </div>
                <svg className="sb-chevron sidebar-label" viewBox="0 0 24 24" width="15" height="15" fill="currentColor">
                  <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6Z" />
                </svg>
              </button>
            </div>
          ) : (
            <NavLink to="/login" className="sb-profile-btn sb-profile-btn--guest">
              <div className="sb-avatar sb-avatar--guest">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4Z" />
                </svg>
              </div>
              <span className="sidebar-label">Log in</span>
            </NavLink>
          )}
        </div>
      </aside>
    </>
  )
}