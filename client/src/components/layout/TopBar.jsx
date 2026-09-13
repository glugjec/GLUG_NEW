import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { Search, Bell, ChevronDown, LogOut, User, Settings as SettingsIcon, MessageSquare, ArrowLeft, X, CheckCheck } from 'lucide-react'
import { notificationsApi } from '../../api.js'

function formatRelativeTime(date) {
  if (!date) return ''
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(date).toLocaleDateString()
}

function TopBarAvatar({ src, username, email, size = 30, className = '' }) {
  const [error, setError] = useState(false)
  const name = username || email || 'User'

  useEffect(() => {
    setError(false)
  }, [src])

  if (src && !error && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))) {
    return (
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
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
  const location = useLocation()
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadNotifCount, setUnreadNotifCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [notifLoading, setNotifLoading] = useState(false)
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false)
  const inputRef = useRef(null)
  const mobileInputRef = useRef(null)
  const menuRef = useRef(null)
  const notifRef = useRef(null)

  useEffect(() => {
    if (!user) {
      setUnreadNotifCount(0)
      setNotifications([])
      return
    }

    let isMounted = true
    const fetchUnread = async () => {
      try {
        const res = await notificationsApi.unreadCount()
        if (isMounted && typeof res.unreadCount === 'number') {
          setUnreadNotifCount(res.unreadCount)
        }
      } catch (err) {
        // silent
      }
    }

    fetchUnread()
    const interval = setInterval(fetchUnread, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (!notifOpen || !user) return
    let isMounted = true
    setNotifLoading(true)
    notificationsApi
      .list()
      .then((res) => {
        if (isMounted && res?.notifications) {
          setNotifications(res.notifications)
        }
      })
      .catch((err) => {
        console.error('[Notifications Error]', err)
      })
      .finally(() => {
        if (isMounted) setNotifLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [notifOpen, user])

  const handleMarkAllRead = async () => {
    try {
      await notificationsApi.markAllRead()
      setUnreadNotifCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
    } catch (err) {
      console.error('[Mark All Read Error]', err)
    }
  }

  const handleNotificationClick = async (notif) => {
    if (!notif.isRead) {
      notificationsApi.markRead(notif.id || notif._id).catch(() => {})
      setUnreadNotifCount((prev) => Math.max(0, prev - 1))
      setNotifications((prev) =>
        prev.map((n) => ((n.id === notif.id || n._id === notif._id) ? { ...n, isRead: true } : n))
      )
    }
    setNotifOpen(false)
    const targetPostId = notif.post?.id || notif.post?._id || notif.post
    if (targetPostId) {
      navigate(`/posts/${targetPostId}`)
    }
  }

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
    if (!mobileSearchOpen) return
    const handleEsc = (e) => {
      if (e.key === 'Escape') {
        setMobileSearchOpen(false)
      }
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [mobileSearchOpen])

  useEffect(() => {
    if (mobileSearchOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 50)
    }
  }, [mobileSearchOpen])

  useEffect(() => {
    document.body.classList.toggle('glug-mobile-search-open', mobileSearchOpen)
    return () => document.body.classList.remove('glug-mobile-search-open')
  }, [mobileSearchOpen])

  useEffect(() => {
    setMobileSearchOpen(false)
    setMenuOpen(false)
    setNotifOpen(false)
  }, [location.pathname])

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
      setMobileSearchOpen(false)
    }
  }

  const handleLogout = () => {
    setMenuOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <header className={`topbar-v2${mobileSearchOpen ? ' has-mobile-search-open' : ''}`}>
      {mobileSearchOpen && (
        <div className="topbar-mobile-search-overlay">
          <button
            type="button"
            className="topbar-mobile-search-back"
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
          >
            <ArrowLeft size={19} />
          </button>
          <form
            className="topbar-mobile-search-form"
            onSubmit={handleSearchSubmit}
          >
            <Search size={16} className="topbar-mobile-search-icon" />
            <input
              ref={mobileInputRef}
              type="text"
              className="topbar-mobile-search-input"
              placeholder="Search discussions, topics, members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="topbar-mobile-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={15} />
              </button>
            )}
          </form>
        </div>
      )}

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
        <button
          type="button"
          className="topbar-icon-btn topbar-mobile-search-trigger"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
        >
          <Search size={18} />
        </button>

        <div className="topbar-notif-wrap" ref={notifRef}>
          <button
            type="button"
            className="topbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            aria-label="Notifications"
          >
            <Bell size={19} />
            {unreadNotifCount > 0 && (
              <span className="notif-badge">
                {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="notif-popover">
              <div className="notif-header">
                <div className="notif-header-left">
                  <span className="notif-title">Notifications</span>
                  {unreadNotifCount > 0 && (
                    <span className="notif-count">{unreadNotifCount} new</span>
                  )}
                </div>
                {user && unreadNotifCount > 0 && (
                  <button
                    type="button"
                    className="notif-mark-all-btn"
                    onClick={handleMarkAllRead}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="notif-list">
                {!user ? (
                  <div className="notif-auth-box">
                    <div className="notif-auth-icon-wrap">
                      <Bell size={20} />
                    </div>
                    <h4 className="notif-auth-title">Stay in the loop</h4>
                    <p className="notif-auth-desc">
                      Sign in to see replies, comments on your posts, and community alerts.
                    </p>
                    <div className="notif-auth-actions">
                      <Link
                        to="/login"
                        className="notif-auth-btn"
                        onClick={() => setNotifOpen(false)}
                      >
                        Log In
                      </Link>
                      <Link
                        to="/register"
                        className="notif-auth-btn-outline"
                        onClick={() => setNotifOpen(false)}
                      >
                        Sign Up
                      </Link>
                    </div>
                  </div>
                ) : notifLoading ? (
                  <div className="notif-loading">Loading notifications...</div>
                ) : notifications.length === 0 ? (
                  <div className="notif-empty">
                    <Bell size={26} style={{ opacity: 0.3, marginBottom: '2px' }} />
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)' }}>No notifications yet</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      We will notify you when someone comments or replies to you.
                    </span>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id || notif._id}
                      className={`notif-item ${notif.isRead ? '' : 'is-unread'}`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="notif-avatar-wrap">
                        <TopBarAvatar
                          src={notif.sender?.avatar}
                          username={notif.sender?.username}
                          size={28}
                        />
                      </div>
                      <div className="notif-content">
                        <p className="notif-text">{notif.message}</p>
                        <span className="notif-time">
                          {formatRelativeTime(notif.createdAt)}
                        </span>
                      </div>
                      {!notif.isRead && <div className="notif-dot-unread" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {user && (
          <Link to="/chat" className="topbar-icon-btn" title="Direct Messages">
            <MessageSquare size={17} />
          </Link>
        )}

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