import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usersApi, authApi } from '../api.js'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import {
  User,
  Settings as SettingsIcon,
  Edit3,
  Share2,
  Calendar,
  Mail,
  Shield,
  MessageSquare,
  ThumbsUp,
  Award,
  Sparkles,
  Terminal,
  Code2,
  ExternalLink,
  Globe,
  Plus,
  X,
  Check,
  CheckCircle2
} from 'lucide-react'
import './Profile.css'

function GithubIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  )
}

function LinkedinIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

function TwitterIcon({ size = 16, style = {} }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  )
}

function UserAvatar({ src, username, size = 96, className = '' }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <img
        src={src}
        alt={username || 'User'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setError(true)}
        className={className}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(username),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.42)}px`,
        fontWeight: 800,
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

const PRESET_AVATARS = [
  { id: 'tux', label: 'Tux', color: '#f59e0b', bg: '#0f172a', icon: 'tux' },
  { id: 'terminal', label: 'Terminal', color: '#10b981', bg: '#064e3b', icon: 'terminal' },
  { id: 'code', label: 'Hacker', color: '#38bdf8', bg: '#0c4a6e', icon: 'code' },
  { id: 'security', label: 'Cyber', color: '#a855f7', bg: '#3b0764', icon: 'security' },
  { id: 'star', label: 'Astral', color: '#ec4899', bg: '#500724', icon: 'star' },
  { id: 'flame', label: 'Kernel', color: '#ef4444', bg: '#450a0a', icon: 'flame' }
]

function renderPresetIcon(type, color) {
  if (type === 'terminal') return <Terminal size={22} color={color} />
  if (type === 'code') return <Code2 size={22} color={color} />
  if (type === 'security') return <Shield size={22} color={color} />
  if (type === 'star') return <Sparkles size={22} color={color} />
  if (type === 'flame') return <Award size={22} color={color} />
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill={color}>
      <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
    </svg>
  )
}

export default function Profile() {
  const { id } = useParams()
  const { user, updateUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState('overview')
  const [toastMessage, setToastMessage] = useState('')

  const [editModalOpen, setEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    username: '',
    bio: '',
    avatar: '',
    skills: [],
    socials: { github: '', linkedin: '', website: '', twitter: '' }
  })
  const [newSkillInput, setNewSkillInput] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const isOwnProfile = !id || (user && (id === user.id || id === user._id || id === user.username))

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      setError('')
      try {
        const targetId = isOwnProfile ? (user?.id || user?._id) : id
        if (!targetId) {
          setLoading(false)
          return
        }

        const [profData, postsData] = await Promise.all([
          usersApi.getProfile(targetId).catch(() => null),
          usersApi.getPosts(targetId).catch(() => [])
        ])

        if (profData) {
          setProfile(profData)
          if (isOwnProfile) {
            setEditForm({
              username: profData.username || '',
              bio: profData.bio || '',
              avatar: profData.avatar || '',
              skills: profData.skills || ['Linux', 'Git', 'Bash', 'Open Source'],
              socials: {
                github: profData.socials?.github || '',
                linkedin: profData.socials?.linkedin || '',
                website: profData.socials?.website || '',
                twitter: profData.socials?.twitter || ''
              }
            })
          }
        } else if (isOwnProfile && user) {
          const fallback = {
            id: user.id || user._id,
            username: user.username,
            email: user.email,
            role: user.role || 'student',
            bio: user.bio || '',
            skills: user.skills || ['Linux', 'Git', 'Bash', 'Open Source'],
            avatar: user.avatar || '',
            socials: user.socials || {},
            createdAt: user.createdAt,
            stats: { posts: 0, comments: 0, upvotes: 0 }
          }
          setProfile(fallback)
          setEditForm({
            username: fallback.username,
            bio: fallback.bio,
            avatar: fallback.avatar,
            skills: fallback.skills,
            socials: fallback.socials
          })
        }
        setUserPosts(postsData || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, user, isOwnProfile])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    showToast('Profile link copied to clipboard!')
  }

  const handleAddSkill = (e) => {
    e.preventDefault()
    const trimmed = newSkillInput.trim()
    if (!trimmed || editForm.skills.includes(trimmed)) return
    setEditForm((prev) => ({
      ...prev,
      skills: [...prev.skills, trimmed]
    }))
    setNewSkillInput('')
  }

  const handleRemoveSkill = (skill) => {
    setEditForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s !== skill)
    }))
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSavingProfile(true)
    setError('')
    try {
      const res = await authApi.updateProfile({
        username: editForm.username.trim(),
        bio: editForm.bio.trim(),
        avatar: editForm.avatar.trim(),
        skills: editForm.skills,
        socials: editForm.socials
      })

      if (res?.user) {
        updateUser(res.user)
        setProfile((prev) => ({
          ...prev,
          ...res.user
        }))
        showToast('Profile updated successfully!')
        setEditModalOpen(false)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  if (!user && isOwnProfile) {
    return (
      <div className="profile-page-container">
        <div className="profile-content-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <User size={48} style={{ color: 'var(--text-dim)', marginBottom: '1rem' }} />
          <h2 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>Sign in to view your profile</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
            Access your discussions, bookmarks, reputation points, and settings.
          </p>
          <Link to="/login" className="profile-btn-primary" style={{ display: 'inline-flex' }}>
            Log in to GLUG
          </Link>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="profile-page-container">
        <LoadingSpinner text="Loading profile…" />
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="profile-page-container">
        <ErrorMessage message="User not found." />
      </div>
    )
  }

  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(undefined, {
        month: 'short',
        year: 'numeric'
      })
    : 'Sep 2026'

  const repScore = (profile.stats?.upvotes || 0) * 5 + (profile.stats?.posts || userPosts.length) * 2 + (profile.stats?.comments || 0)

  return (
    <div className="profile-page-container">
      <ErrorMessage message={error} />

      <div className="profile-hero-card">
        <div className="profile-cover-banner">
          <div className="profile-cover-stars">
            <span className="pstar pstar-1">✦</span>
            <span className="pstar pstar-2">✦</span>
            <span className="pstar pstar-3">⋆</span>
            <span className="pstar pstar-4">✦</span>
            <span className="pstar pstar-5">⋆</span>
          </div>
          <div className="profile-cover-glow" />
        </div>

        <div className="profile-header-content">
          <div className="profile-avatar-row">
            <div className="profile-avatar-wrapper">
              <UserAvatar
                src={profile.avatar}
                username={profile.username}
                size={96}
                className="profile-avatar-img"
              />
            </div>

            <div className="profile-actions-group">
              {isOwnProfile ? (
                <>
                  <button
                    type="button"
                    className="profile-btn-primary"
                    onClick={() => setEditModalOpen(true)}
                  >
                    <Edit3 size={15} /> Edit Profile
                  </button>
                  <Link to="/settings" className="profile-btn-secondary">
                    <SettingsIcon size={15} /> Settings
                  </Link>
                  <button
                    type="button"
                    className="profile-btn-icon"
                    onClick={handleCopyLink}
                    title="Share Profile Link"
                  >
                    <Share2 size={16} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="profile-btn-secondary"
                    onClick={handleCopyLink}
                  >
                    <Share2 size={15} /> Share Profile
                  </button>
                  <Link to="/forum" className="profile-btn-primary">
                    <MessageSquare size={15} /> Browse Forum
                  </Link>
                </>
              )}
            </div>
          </div>

          <div className="profile-info-block">
            <div className="profile-title-badges">
              <h1 className="profile-display-name">
                {profile.username || 'Member'}
              </h1>
              <span
                className={`profile-role-badge ${
                  profile.role === 'admin'
                    ? 'role-admin'
                    : profile.role === 'moderator'
                    ? 'role-mod'
                    : 'role-student'
                }`}
              >
                <Shield size={12} />
                {profile.role === 'admin'
                  ? 'Administrator'
                  : profile.role === 'moderator'
                  ? 'Moderator'
                  : 'Student Member'}
              </span>
            </div>

            <div className="profile-meta-row">
              <span className="profile-meta-item">
                <Mail size={14} /> {profile.email}
              </span>
              <span className="profile-meta-item">
                <Calendar size={14} /> Joined {memberSince}
              </span>
            </div>

            <p className="profile-bio-text">
              {profile.bio || 'Exploring Linux, contributing to open source, and building systems.'}
            </p>
          </div>
        </div>
      </div>

      <div className="profile-stats-strip">
        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-blue-bg">
            <MessageSquare size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.posts ?? userPosts.length}</span>
            <span className="profile-stat-title">Discussions Created</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-emerald-bg">
            <MessageSquare size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.comments ?? 0}</span>
            <span className="profile-stat-title">Comments Posted</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-amber-bg">
            <ThumbsUp size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{profile.stats?.upvotes ?? 0}</span>
            <span className="profile-stat-title">Upvotes Received</span>
          </div>
        </div>

        <div className="profile-stat-card">
          <div className="profile-stat-icon-wrap icon-purple-bg">
            <Award size={20} />
          </div>
          <div className="profile-stat-data">
            <span className="profile-stat-number">{repScore}</span>
            <span className="profile-stat-title">Reputation Points</span>
          </div>
        </div>
      </div>

      <div className="profile-tabs-nav">
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'overview' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <User size={16} /> Overview
        </button>
        <button
          type="button"
          className={`profile-tab-btn ${activeTab === 'discussions' ? 'is-active' : ''}`}
          onClick={() => setActiveTab('discussions')}
        >
          <MessageSquare size={16} /> Discussions
          <span className="profile-tab-badge">{userPosts.length}</span>
        </button>
      </div>

      {activeTab === 'overview' && (
        <div className="profile-grid-2col">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Code2 size={18} color="#3b82f6" /> Skills &amp; Tech Stack
              </h2>
              <div className="profile-skills-wrap">
                {(profile.skills && profile.skills.length > 0
                  ? profile.skills
                  : ['Linux', 'Git', 'Bash', 'Docker', 'Open Source']
                ).map((s) => (
                  <span key={s} className="profile-skill-badge">
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Terminal size={18} color="#10b981" /> Terminal &amp; Systems
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div style={{ background: 'var(--bg-card-subtle)', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>Default Shell</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text)' }}>zsh / bash</span>
                </div>
                <div style={{ background: 'var(--bg-card-subtle)', padding: '0.85rem 1rem', borderRadius: 12, border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.2rem' }}>GLUG Terminal Status</span>
                  <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#10b981' }}>Active</span>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="profile-content-card">
              <h2 className="profile-card-title">
                <Globe size={18} color="#a855f7" /> Connect &amp; Socials
              </h2>
              <div className="profile-socials-list">
                {profile.socials?.github && (
                  <a
                    href={profile.socials.github.startsWith('http') ? profile.socials.github : `https://github.com/${profile.socials.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                  >
                    <GithubIcon size={16} />
                    <span>{profile.socials.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </a>
                )}
                {profile.socials?.linkedin && (
                  <a
                    href={profile.socials.linkedin.startsWith('http') ? profile.socials.linkedin : `https://linkedin.com/in/${profile.socials.linkedin}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                  >
                    <LinkedinIcon size={16} />
                    <span>{profile.socials.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </a>
                )}
                {profile.socials?.twitter && (
                  <a
                    href={profile.socials.twitter.startsWith('http') ? profile.socials.twitter : `https://twitter.com/${profile.socials.twitter}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                  >
                    <TwitterIcon size={16} />
                    <span>{profile.socials.twitter.replace(/^https?:\/\/(www\.)?twitter\.com\//, '')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </a>
                )}
                {profile.socials?.website && (
                  <a
                    href={profile.socials.website.startsWith('http') ? profile.socials.website : `https://${profile.socials.website}`}
                    target="_blank"
                    rel="noreferrer"
                    className="profile-social-link"
                  >
                    <Globe size={16} />
                    <span>{profile.socials.website.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />
                  </a>
                )}
                {!profile.socials?.github && !profile.socials?.linkedin && !profile.socials?.twitter && !profile.socials?.website && (
                  <div className="profile-social-empty">
                    No social links linked yet.
                    {isOwnProfile && ' Click "Edit Profile" to connect your GitHub or LinkedIn.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'discussions' && (
        <div className="profile-content-card">
          <h2 className="profile-card-title">
            <MessageSquare size={18} color="#3b82f6" /> Discussions Started ({userPosts.length})
          </h2>

          {userPosts.length === 0 ? (
            <div className="profile-empty-discussions">
              <MessageSquare size={36} className="profile-empty-icon" />
              <h3 style={{ margin: 0, color: 'var(--text)' }}>No discussions yet</h3>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                {isOwnProfile
                  ? 'Join the conversation by asking a question or sharing knowledge in the forum.'
                  : `${profile.username} hasn't posted any discussions yet.`}
              </p>
              {isOwnProfile && (
                <Link to="/forum" className="profile-btn-primary" style={{ marginTop: '0.5rem' }}>
                  Start a Discussion
                </Link>
              )}
            </div>
          ) : (
            <div className="profile-discussions-list">
              {userPosts.map((post) => (
                <Link
                  key={post.id || post._id}
                  to={`/forum/posts/${post.id || post._id}`}
                  className="profile-disc-item"
                >
                  <div className="profile-disc-main">
                    <span className="profile-disc-title">{post.title}</span>
                    <div className="profile-disc-meta">
                      <span style={{ color: '#3b82f6', fontWeight: 600 }}>{post.category || 'General'}</span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="profile-disc-metrics">
                    <span className="profile-disc-metric">
                      <ThumbsUp size={13} /> {post.voteScore || 0}
                    </span>
                    <span className="profile-disc-metric">
                      <MessageSquare size={13} /> {post.commentCount || 0}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {editModalOpen && (
        <div className="modal-backdrop" onClick={() => setEditModalOpen(false)}>
          <div className="profile-edit-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Profile</h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setEditModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile}>
              <div className="modal-body">
                <div className="modal-field">
                  <label className="modal-label">Choose Avatar Preset</label>
                  <div className="preset-avatars-grid">
                    {PRESET_AVATARS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        className={`preset-avatar-btn ${
                          editForm.avatar === preset.id ? 'is-selected' : ''
                        }`}
                        style={{ background: preset.bg }}
                        onClick={() => setEditForm((prev) => ({ ...prev, avatar: preset.id }))}
                        title={preset.label}
                      >
                        {renderPresetIcon(preset.icon, preset.color)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Or Custom Avatar Image URL</label>
                  <input
                    type="text"
                    className="modal-input"
                    placeholder="https://example.com/avatar.jpg"
                    value={editForm.avatar.startsWith('http') ? editForm.avatar : ''}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, avatar: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Username</label>
                  <input
                    type="text"
                    className="modal-input"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                    required
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Bio</label>
                  <textarea
                    rows={3}
                    className="modal-textarea"
                    placeholder="Tell the community about your journey with Linux, projects, and interests..."
                    value={editForm.bio}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, bio: e.target.value }))
                    }
                  />
                </div>

                <div className="modal-field">
                  <label className="modal-label">Skills &amp; Technologies</label>
                  <div className="profile-skills-wrap" style={{ marginBottom: '0.5rem' }}>
                    {editForm.skills.map((skill) => (
                      <span key={skill} className="profile-skill-badge" style={{ gap: '0.35rem' }}>
                        {skill}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(skill)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0, display: 'flex' }}
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="modal-input"
                      placeholder="Add a skill (e.g. Docker, Rust, Arch)"
                      value={newSkillInput}
                      onChange={(e) => setNewSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddSkill(e)
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="profile-btn-secondary"
                      onClick={handleAddSkill}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                </div>

                <div className="modal-field">
                  <label className="modal-label">Social Links</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <GithubIcon size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="GitHub username or link"
                        value={editForm.socials.github}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, github: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <LinkedinIcon size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="LinkedIn username or link"
                        value={editForm.socials.linkedin}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, linkedin: e.target.value }
                          }))
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Globe size={16} style={{ color: 'var(--text-dim)', flexShrink: 0 }} />
                      <input
                        type="text"
                        className="modal-input"
                        placeholder="Portfolio or personal website"
                        value={editForm.socials.website}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            socials: { ...prev.socials, website: e.target.value }
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="profile-btn-secondary"
                  onClick={() => setEditModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="profile-btn-primary"
                  disabled={savingProfile}
                >
                  {savingProfile ? 'Saving…' : <><Check size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="profile-toast">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}
