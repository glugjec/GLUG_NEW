import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { usersApi, authApi } from '../api.js'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import Card from '../components/common/Card.jsx'
import Chip from '../components/common/Chip.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import { Plus, X, Check, MessageSquare, ThumbsUp } from 'lucide-react'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [profileData, setProfileData] = useState(null)
  const [userPosts, setUserPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Bio editing
  const [bio, setBio] = useState('')
  const [savingBio, setSavingBio] = useState(false)
  const [bioSaved, setBioSaved] = useState(false)

  // Skills editing
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [savingSkills, setSavingSkills] = useState(false)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }

    const fetchUserData = async () => {
      setLoading(true)
      setError('')
      const userId = user.id || user._id

      try {
        const [profile, posts] = await Promise.all([
          usersApi.getProfile(userId).catch(() => null),
          usersApi.getPosts(userId).catch(() => []),
        ])

        if (profile) {
          setProfileData(profile)
          setBio(profile.bio || '')
          setSkills(profile.skills || ['Linux', 'Bash', 'Git', 'Open Source'])
        } else {
          setBio(user.bio || '')
          setSkills(user.skills || ['Linux', 'Bash', 'Git', 'Open Source'])
        }

        setUserPosts(posts || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchUserData()
  }, [user])

  const handleSaveBio = async () => {
    setSavingBio(true)
    try {
      const res = await authApi.updateProfile({ bio })
      if (res?.user) {
        updateUser({ bio: res.user.bio })
      }
      setBioSaved(true)
      setTimeout(() => setBioSaved(false), 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingBio(false)
    }
  }

  const handleAddSkill = async (e) => {
    e.preventDefault()
    const trimmed = newSkill.trim()
    if (!trimmed || skills.includes(trimmed)) return

    const updated = [...skills, trimmed]
    setSkills(updated)
    setNewSkill('')
    setSavingSkills(true)

    try {
      const res = await authApi.updateProfile({ skills: updated })
      if (res?.user) {
        updateUser({ skills: res.user.skills })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSkills(false)
    }
  }

  const handleRemoveSkill = async (skillToRemove) => {
    const updated = skills.filter((s) => s !== skillToRemove)
    setSkills(updated)
    setSavingSkills(true)

    try {
      const res = await authApi.updateProfile({ skills: updated })
      if (res?.user) {
        updateUser({ skills: res.user.skills })
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setSavingSkills(false)
    }
  }

  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">
          You are not logged in.{' '}
          <Link to="/login" className="link">
            Log in
          </Link>{' '}
          to view your profile and contributions.
        </p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="page">
        <LoadingSpinner text="Loading profile…" />
      </section>
    )
  }

  const stats = profileData?.stats || {
    posts: userPosts.length,
    comments: 0,
    upvotes: 0,
  }

  const memberSince = profileData?.createdAt
    ? new Date(profileData.createdAt).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      })
    : 'Recently'

  return (
    <section className="page profile-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Student Profile</h1>
          <p className="page-subtitle">Your public GLUG profile, reputation, and contributions.</p>
        </div>
        <Link to="/settings" className="btn btn-ghost">
          Account Settings
        </Link>
      </div>

      <ErrorMessage message={error} />

      <div className="profile-card">
        <div className="profile-avatar" style={{ background: avatarColor(user.username) }}>
          {avatarInitials(user.username)}
        </div>
        <div className="profile-names">
          <div className="profile-user-row">
            <span className="profile-username">@{user.username}</span>
            {user.role === 'admin' ? (
              <span className="admin-badge">Admin</span>
            ) : (
              <span className="student-badge">Student Member</span>
            )}
          </div>
          <span className="profile-email">{user.email}</span>
          <span className="profile-since">Member since {memberSince}</span>
        </div>
      </div>

      <div className="profile-stats">
        <div className="profile-stat">
          <span className="profile-stat-value">{stats.posts}</span>
          <span className="profile-stat-label">Discussions</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{stats.comments}</span>
          <span className="profile-stat-label">Comments</span>
        </div>
        <div className="profile-stat">
          <span className="profile-stat-value">{stats.upvotes}</span>
          <span className="profile-stat-label">Upvotes Received</span>
        </div>
      </div>

      <div className="cards profile-sections">
        <Card>
          <h2>About Me</h2>
          <textarea
            className="profile-bio"
            rows="3"
            placeholder="Tell the community a little about yourself, your year, branch, and tech interests…"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
          />
          <div className="profile-bio-actions">
            <p className="profile-hint">This bio is visible to other students in the forum.</p>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSaveBio}
              disabled={savingBio}
            >
              {savingBio ? 'Saving…' : bioSaved ? <><Check size={14} /> Saved</> : 'Save Bio'}
            </button>
          </div>
        </Card>

        <Card>
          <h2>Skills &amp; Interests</h2>
          <div className="profile-chips">
            {skills.map((skill) => (
              <span className="chip profile-skill-chip" key={skill}>
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  title={`Remove ${skill}`}
                  disabled={savingSkills}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>

          <form className="add-skill-form" onSubmit={handleAddSkill}>
            <input
              type="text"
              placeholder="Add a skill or distro (e.g. Arch, Docker, C++)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
            <button type="submit" className="btn btn-ghost btn-sm" disabled={!newSkill.trim()}>
              <Plus size={14} /> Add
            </button>
          </form>
        </Card>
      </div>

      <div className="cards">
        <Card>
          <h2>My Discussions ({userPosts.length})</h2>
          {userPosts.length === 0 ? (
            <p className="no-activity-text">
              You haven't posted in the forum yet.{' '}
              <Link to="/forum" className="link">
                Start a discussion
              </Link>
              !
            </p>
          ) : (
            <ul className="profile-post-list">
              {userPosts.map((p) => (
                <li key={p.id || p._id} className="profile-post-item">
                  <div className="profile-post-meta">
                    <Chip label={p.category} />
                    <Link to={`/forum/posts/${p.id || p._id}`} className="profile-post-title">
                      {p.title}
                    </Link>
                  </div>
                  <div className="profile-post-metrics">
                    <span title="Score">
                      <ThumbsUp size={13} /> {p.voteScore || 0}
                    </span>
                    <span title="Comments">
                      <MessageSquare size={13} /> {p.commentCount || 0}
                    </span>
                    <span className="profile-post-date">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </section>
  )
}

