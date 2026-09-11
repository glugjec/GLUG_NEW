import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { formatRelativeTime } from '../utils/timeAgo.js'
import {
  Home,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  MessageSquare,
  Eye,
  Share2,
  Bookmark,
  MoreHorizontal,
  CheckCircle2,
  CornerDownRight,
  Clock,
  RotateCw,
  ArrowRight,
  Image as ImageIcon,
  Bold,
  Italic,
  Code,
  Link2,
  ListOrdered,
  List,
  Terminal,
  Gamepad2,
  Monitor,
  Trash2,
  Check
} from 'lucide-react'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import './PostDetail.css'

function capitalize(str) {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function UserAvatar({ src, username, size = 36, className = '' }) {
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
        fontSize: `${Math.round(size * 0.4)}px`,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

const DEMO_DISCUSSION = {
  id: 'distro-2025',
  title: 'Best Linux distro for beginners in 2025?',
  body: `Hi everyone!\n\nI'm new to Linux and planning to switch from Windows. Which Linux distribution would you recommend for a beginner in 2025? I'm looking for something stable, user-friendly, and with good community support. Also, any tips for a smooth transition would be really helpful!\n\nThanks in advance! 🙌`,
  category: 'Linux',
  tags: ['Linux', 'Beginner'],
  allTags: ['Linux', 'Beginner', 'Help', 'Installation', 'Distribution'],
  voteScore: 24,
  userVote: 0,
  views: '1.2K',
  createdAt: '2 hours ago',
  author: {
    username: 'ananya',
    role: 'Original Poster'
  },
  comments: [
    {
      id: 'c1',
      author: {
        username: 'devansh',
        role: 'Core Member'
      },
      createdAt: '2 hours ago',
      body: `For beginners, I'd recommend Linux Mint. It's user-friendly, stable, and has a familiar desktop environment. If you like a more modern look, Ubuntu is also a great choice.`,
      voteScore: 18,
      userVote: 0,
      isAccepted: false
    },
    {
      id: 'c2',
      author: {
        username: 'isha',
        role: 'Community Moderator'
      },
      createdAt: '1 hour ago',
      body: `Here are some beginner-friendly distros in 2025:\n1. Linux Mint – simple, stable, great community\n2. Ubuntu – beginner friendly, lots of documentation\n3. Fedora – modern and up-to-date\n4. Zorin OS – clean and Windows-like interface\n5. Pop!_OS – great for students and developers\n\nNo matter which one you choose, here are a few tips:\n• Don't worry about breaking things — you'll learn!\n• Keep backups of important files\n• Explore and be part of the community (like GLUG! 😊)`,
      voteScore: 32,
      userVote: 0,
      isAccepted: true
    }
  ]
}

const RELATED_DISCUSSIONS = [
  {
    id: 'dual-boot',
    title: 'How to dual boot Ubuntu with Windows 11?',
    replies: 8,
    timeAgo: '2 days ago',
    icon: Terminal,
    iconBg: '#1e293b',
    iconColor: '#94a3b8'
  },
  {
    id: 'useful-cmds',
    title: 'Useful terminal commands everyone should know',
    replies: 24,
    timeAgo: '3 days ago',
    icon: Code,
    iconBg: '#3b0764',
    iconColor: '#c084fc'
  },
  {
    id: 'open-source-alt',
    title: 'Best open source alternatives for popular apps',
    replies: 9,
    timeAgo: '4 days ago',
    icon: Gamepad2,
    iconBg: '#064e3b',
    iconColor: '#34d399'
  },
  {
    id: 'dev-env',
    title: 'Setting up a development environment on Linux',
    replies: 11,
    timeAgo: '6 days ago',
    icon: Monitor,
    iconBg: '#1e3a8a',
    iconColor: '#60a5fa'
  }
]

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [activeReplyId, setActiveReplyId] = useState(null)
  const [subReplyText, setSubReplyText] = useState('')
  const [bookmarked, setBookmarked] = useState(false)
  const [showMoreMenu, setShowMoreMenu] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [sortBy, setSortBy] = useState('best')
  const [submitting, setSubmitting] = useState(false)

  const textareaRef = useRef(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await postsApi.get(id)
      if (res && res.post) {
        setPost(res.post)
        setComments(res.comments || [])
      } else {
        setPost(DEMO_DISCUSSION)
        setComments(DEMO_DISCUSSION.comments)
      }
    } catch {
      setPost(DEMO_DISCUSSION)
      setComments(DEMO_DISCUSSION.comments)
    } finally {
      setLoading(false)
    }
  }, [id, user?.id])

  useEffect(() => {
    load()
  }, [load])

  const showToast = (msg) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(''), 2500)
  }

  const handlePostVote = async (delta) => {
    if (!user) {
      showToast('Please log in to vote')
      navigate('/login')
      return
    }
    if (!post) return
    const currentVote = post.userVote || 0
    const nextVote = currentVote === delta ? 0 : delta

    if (post.id && !post.id.startsWith('distro-')) {
      try {
        const res = await postsApi.vote(post.id || post._id, nextVote)
        if (res && typeof res.voteScore === 'number') {
          setPost((prev) => ({
            ...prev,
            userVote: res.userVote,
            voteScore: Math.max(0, res.voteScore)
          }))
          return
        }
      } catch (err) {
        showToast(err.message || 'Failed to register vote')
        return
      }
    }

    const scoreDiff = nextVote - currentVote
    setPost((prev) => ({
      ...prev,
      userVote: nextVote,
      voteScore: Math.max(0, (prev.voteScore || 0) + scoreDiff)
    }))
  }

  const handleCommentVote = async (commentId, delta) => {
    if (!user) {
      showToast('Please log in to vote')
      navigate('/login')
      return
    }

    const currentComment = comments.find((c) => (c.id === commentId || c._id === commentId))
    const cur = currentComment?.userVote || 0
    const nxt = cur === delta ? 0 : delta
    const diff = nxt - cur

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId || c._id === commentId) {
          return {
            ...c,
            userVote: nxt,
            voteScore: Math.max(0, (c.voteScore || 0) + diff)
          }
        }
        return c
      })
    )

    try {
      const postId = post?.id || post?._id || id
      const res = await postsApi.voteComment(postId, commentId, nxt)
      if (res && typeof res.voteScore === 'number') {
        setComments((prev) =>
          prev.map((c) => {
            if (c.id === commentId || c._id === commentId) {
              return {
                ...c,
                userVote: res.userVote ?? nxt,
                voteScore: Math.max(0, res.voteScore)
              }
            }
            return c
          })
        )
      }
    } catch (err) {
      setComments((prev) =>
        prev.map((c) => {
          if (c.id === commentId || c._id === commentId) {
            return {
              ...c,
              userVote: cur,
              voteScore: Math.max(0, (c.voteScore || 0) - diff)
            }
          }
          return c
        })
      )
      showToast(err.message || 'Failed to register vote')
    }
  }

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Link copied to clipboard!')
    } catch {
      showToast('URL copied!')
    }
  }

  const insertFormat = (prefix, suffix = '') => {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart || 0
    const end = el.selectionEnd || 0
    const val = replyText
    const selected = val.substring(start, end)
    const replacement = prefix + (selected || 'text') + suffix
    const nextVal = val.substring(0, start) + replacement + val.substring(end)
    setReplyText(nextVal)
    setTimeout(() => {
      el.focus()
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected ? selected.length : 4))
    }, 10)
  }

  const handleAddComment = async (text, parentId = null) => {
    if (!user) {
      showToast('Please log in to reply')
      navigate('/login')
      return
    }
    if (!text.trim()) return
    setSubmitting(true)
    const authorUsername = user ? user.username : 'student@glug'
    const newComment = {
      id: 'c_' + Date.now(),
      author: {
        username: authorUsername,
        role: user?.role === 'admin' ? 'Community Moderator' : 'Member'
      },
      createdAt: 'Just now',
      body: text.trim(),
      voteScore: 1,
      userVote: 1,
      parentComment: parentId,
      isAccepted: false
    }

    try {
      if (post && post._id && !post.id?.startsWith('distro-')) {
        await postsApi.addComment(post._id || post.id, { body: text, parentComment: parentId })
        await load()
      } else {
        setComments((prev) => [...prev, newComment])
      }
      if (parentId) {
        setActiveReplyId(null)
        setSubReplyText('')
      } else {
        setReplyText('')
      }
      showToast('Reply posted!')
    } catch (err) {
      showToast('Error: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Delete this discussion?')) return
    try {
      if (post && post._id) {
        await postsApi.delete(post._id || post.id)
      }
      navigate('/forum')
    } catch (err) {
      showToast(err.message)
    }
  }

  if (loading) {
    return (
      <section className="page post-detail-page post-detail-skeleton-wrap">
        <div className="post-breadcrumb-skeleton">
          <div className="post-skel-crumb glug-skeleton-shimmer" />
        </div>

        <div className="post-main-thread" style={{ padding: '1.75rem' }}>
          <div className="post-skel-tags-row">
            <div className="post-skel-tag glug-skeleton-shimmer" />
            <div className="post-skel-tag glug-skeleton-shimmer" />
          </div>
          <div className="post-skel-line post-skel-title-1 glug-skeleton-shimmer" />
          <div className="post-skel-line post-skel-title-2 glug-skeleton-shimmer" />

          <div className="post-author-skeleton">
            <div className="post-skel-avatar glug-skeleton-shimmer" />
            <div className="post-skel-author-col">
              <div className="post-skel-line post-skel-author-name glug-skeleton-shimmer" />
              <div className="post-skel-line post-skel-author-time glug-skeleton-shimmer" />
            </div>
          </div>

          <div className="post-body-skeleton">
            <div className="post-skel-line post-skel-body-line glug-skeleton-shimmer" style={{ width: '100%' }} />
            <div className="post-skel-line post-skel-body-line glug-skeleton-shimmer" style={{ width: '92%' }} />
            <div className="post-skel-line post-skel-body-line glug-skeleton-shimmer" style={{ width: '84%' }} />
            <div className="post-skel-code-block glug-skeleton-shimmer" />
            <div className="post-skel-line post-skel-body-line glug-skeleton-shimmer" style={{ width: '88%' }} />
          </div>

          <div className="post-skel-actions-bar glug-skeleton-shimmer" />
        </div>

        <div className="post-detail-loader-center">
          <LoadingSpinner text="Loading discussion…" size="md" />
        </div>

        <div className="comments-skeleton-stream">
          {[1, 2].map((n) => (
            <div key={n} className="comment-skeleton-row">
              <div className="post-skel-mini-avatar glug-skeleton-shimmer" />
              <div className="comment-skel-content">
                <div className="post-skel-line comment-skel-header glug-skeleton-shimmer" />
                <div className="post-skel-line comment-skel-body glug-skeleton-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  const activePost = post || DEMO_DISCUSSION
  const authorName = activePost.author?.username || activePost.username || 'kaushik'
  const formattedCreatedTime = formatRelativeTime(activePost.createdAt || activePost.created_at)

  let lastActivityText = ''
  if (comments.length > 0) {
    const lastComment = comments[comments.length - 1]
    const lastUser = lastComment.author?.username || 'member'
    const lastTime = formatRelativeTime(lastComment.createdAt)
    lastActivityText = `${lastTime} by ${lastUser}`
  } else {
    lastActivityText = `${formattedCreatedTime} by ${authorName}`
  }

  const displayTags = (activePost.tags && activePost.tags.length > 0)
    ? activePost.tags
    : [capitalize(activePost.category || 'General'), 'Beginner']

  const allCategoryTags = [
    capitalize(activePost.category || 'Linux'),
    'Beginner',
    'Help',
    'Installation',
    'Distribution'
  ]

  const sortedComments = [...comments].sort((a, b) => {
    if (sortBy === 'best') return (b.voteScore || 0) - (a.voteScore || 0)
    if (sortBy === 'newest') return (b.createdAt || '').localeCompare(a.createdAt || '')
    return (a.createdAt || '').localeCompare(b.createdAt || '')
  })

  const viewsCount = activePost.views ?? 0
  const repliesCount = comments.length

  return (
    <div className="post-detail-page">
      <nav className="discussion-breadcrumb" aria-label="Breadcrumb">
        <Link to="/" className="breadcrumb-item" title="Home">
          <Home size={15} />
        </Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link to="/forum" className="breadcrumb-item">
          Discussions
        </Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <Link to={`/forum?category=${(activePost.category || 'linux').toLowerCase()}`} className="breadcrumb-item">
          {capitalize(activePost.category || 'Linux')}
        </Link>
        <ChevronRight size={13} className="breadcrumb-sep" />
        <span className="breadcrumb-current">{activePost.title}</span>
      </nav>

      <div className="discussion-main-layout">
        <div className="discussion-content-col">
          <article className="discussion-card">
            <header className="discussion-author-row">
              <div className="author-meta-left">
                <UserAvatar
                  src={activePost.author?.avatar}
                  username={authorName}
                  size={42}
                  className="author-avatar"
                />
                <div className="author-text-details">
                  <div className="author-name-badge-row">
                    <Link to={`/profile/${encodeURIComponent(authorName)}`} className="author-username">
                      {authorName}
                    </Link>
                    <span className="op-badge">Original Poster</span>
                  </div>
                  <span className="author-time">{formattedCreatedTime}</span>
                </div>
              </div>

              <div className="author-actions-right">
                <button
                  type="button"
                  className={`icon-action-btn ${bookmarked ? 'bookmarked' : ''}`}
                  onClick={() => {
                    setBookmarked(!bookmarked)
                    showToast(bookmarked ? 'Bookmark removed' : 'Saved to bookmarks!')
                  }}
                  title="Bookmark"
                >
                  <Bookmark size={18} fill={bookmarked ? '#3b82f6' : 'none'} />
                </button>

                <button
                  type="button"
                  className="icon-action-btn"
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  title="More options"
                >
                  <MoreHorizontal size={18} />
                </button>

                {showMoreMenu && (
                  <div className="post-more-menu" onClick={() => setShowMoreMenu(false)}>
                    <button type="button" className="post-more-item" onClick={handleShare}>
                      <Share2 size={14} /> Copy link
                    </button>
                    {(user?.role === 'admin' || user?.username === authorName) && (
                      <button type="button" className="post-more-item danger" onClick={handleDeletePost}>
                        <Trash2 size={14} /> Delete post
                      </button>
                    )}
                  </div>
                )}
              </div>
            </header>

            <h1 className="discussion-title">{activePost.title}</h1>

            <div className="discussion-tags-list">
              {displayTags.map((tag, idx) => (
                <Link
                  key={tag}
                  to={`/forum?tag=${tag}`}
                  className={`disc-tag-pill ${idx === 0 ? 'disc-tag-linux' : idx === 1 ? 'disc-tag-purple' : 'disc-tag-generic'}`}
                >
                  {tag}
                </Link>
              ))}
            </div>

            <div className="discussion-body-text">
              {activePost.body.split('\n').map((para, i) => (
                <p key={i}>{para || '\u00A0'}</p>
              ))}
            </div>

            <footer className="discussion-bottom-bar">
              <div className="discussion-bottom-left">
                <div className={`vote-capsule ${activePost.userVote === 1 ? 'voted-up' : activePost.userVote === -1 ? 'voted-down' : ''}`}>
                  <button
                    type="button"
                    className={`vote-capsule-btn ${activePost.userVote === 1 ? 'voted-up' : ''}`}
                    onClick={() => handlePostVote(1)}
                    title={activePost.userVote === 1 ? 'Upvoted (click to undo)' : 'Upvote'}
                    aria-pressed={activePost.userVote === 1}
                  >
                    <ChevronUp size={16} strokeWidth={activePost.userVote === 1 ? 2.8 : 2} />
                  </button>
                  <span className="vote-score-num">{Math.max(0, activePost.voteScore ?? 0)}</span>
                  <button
                    type="button"
                    className={`vote-capsule-btn ${activePost.userVote === -1 ? 'voted-down' : ''}`}
                    onClick={() => handlePostVote(-1)}
                    title={activePost.userVote === -1 ? 'Downvoted (click to undo)' : 'Downvote'}
                    aria-pressed={activePost.userVote === -1}
                  >
                    <ChevronDown size={16} strokeWidth={activePost.userVote === -1 ? 2.8 : 2} />
                  </button>
                </div>

                <div className="meta-count-item">
                  <MessageSquare size={16} />
                  <span>{repliesCount} {repliesCount === 1 ? 'reply' : 'replies'}</span>
                </div>

                <div className="meta-count-item">
                  <Eye size={16} />
                  <span>{viewsCount} views</span>
                </div>
              </div>

              <button type="button" className="btn-share-post" onClick={handleShare}>
                <Share2 size={15} />
                <span>Share</span>
              </button>
            </footer>
          </article>

          <section className="replies-section-wrapper">
            <div className="replies-header-bar">
              <h3 className="replies-title">Replies</h3>
              <div className="sort-dropdown-wrap">
                <span>Sort by:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="sort-select-btn"
                >
                  <option value="best">Best</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
            </div>

            {sortedComments.length === 0 ? (
              <div className="no-replies-placeholder">
                <div className="no-replies-icon-wrap">
                  <MessageSquare size={26} />
                </div>
                <h4 className="no-replies-title">No replies yet</h4>
                <p className="no-replies-sub">Be the first to share your thoughts and join the discussion below.</p>
              </div>
            ) : (
              <div className="replies-list-container">
                {sortedComments.map((reply) => {
                  const rAuthor = reply.author?.username || 'member'
                  const rRole = reply.author?.role || 'Core Member'
                  const rTime = formatRelativeTime(reply.createdAt)
                  return (
                    <div
                      key={reply.id || reply._id}
                      className={`reply-card ${reply.isAccepted ? 'is-accepted' : ''}`}
                    >
                      <div className="reply-top-header">
                        <div className="reply-user-left">
                          <UserAvatar
                            src={reply.author?.avatar}
                            username={rAuthor}
                            size={36}
                            className="reply-avatar"
                          />
                          <div className="reply-user-info">
                            <Link to={`/profile/${encodeURIComponent(rAuthor)}`} className="reply-username">
                              {rAuthor}
                            </Link>
                            <span
                              className={`role-badge ${
                                rRole.toLowerCase().includes('moderator')
                                  ? 'role-mod'
                                  : 'role-core-member'
                              }`}
                            >
                              {rRole}
                            </span>
                            <span className="reply-time">{rTime}</span>
                          </div>
                        </div>

                        {reply.isAccepted && (
                          <div className="accepted-answer-pill">
                            <CheckCircle2 size={14} />
                            <span>Accepted Answer</span>
                          </div>
                        )}
                      </div>

                      <div className="reply-body-content">
                        {reply.body.split('\n').map((line, lidx) => (
                          <p key={lidx}>{line || '\u00A0'}</p>
                        ))}
                      </div>

                      <div className="reply-footer-actions">
                        <div className={`vote-capsule ${reply.userVote === 1 ? 'voted-up' : reply.userVote === -1 ? 'voted-down' : ''}`}>
                          <button
                            type="button"
                            className={`vote-capsule-btn ${reply.userVote === 1 ? 'voted-up' : ''}`}
                            onClick={() => handleCommentVote(reply.id || reply._id, 1)}
                            title={reply.userVote === 1 ? 'Upvoted (click to undo)' : 'Upvote'}
                            aria-pressed={reply.userVote === 1}
                          >
                            <ChevronUp size={15} strokeWidth={reply.userVote === 1 ? 2.8 : 2} />
                          </button>
                          <span className="vote-score-num">{reply.voteScore || 0}</span>
                        </div>

                        <button
                          type="button"
                          className="btn-reply-action"
                          onClick={() => {
                            if (!user) {
                              showToast('Please log in to reply')
                              navigate('/login')
                              return
                            }
                            setActiveReplyId(activeReplyId === reply.id ? null : reply.id)
                          }}
                        >
                          <CornerDownRight size={14} />
                          <span>Reply</span>
                        </button>

                        <button type="button" className="icon-action-btn" title="More">
                          <MoreHorizontal size={15} />
                        </button>
                      </div>

                      {activeReplyId === reply.id && (
                        <div className="inline-nested-reply">
                          <div className="composer-input-area">
                            <input
                              type="text"
                              placeholder={`Reply to @${rAuthor}…`}
                              value={subReplyText}
                              onChange={(e) => setSubReplyText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleAddComment(subReplyText, reply.id)
                                }
                              }}
                              className="composer-textarea"
                              style={{ minHeight: '38px' }}
                            />
                            <button
                              type="button"
                              className="btn-post-reply"
                              onClick={() => handleAddComment(subReplyText, reply.id)}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {user ? (
              <div className="reply-composer-card">
                <div className="composer-input-area">
                  <UserAvatar
                    src={user?.avatar}
                    username={user.username}
                    size={38}
                    className="composer-avatar"
                  />
                  <textarea
                    ref={textareaRef}
                    className="composer-textarea"
                    placeholder="Write a reply..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="composer-toolbar-bottom">
                  <div className="composer-tools-left">
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Insert Image"
                      onClick={() => insertFormat('![alt](', ')')}
                    >
                      <ImageIcon size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Bold"
                      onClick={() => insertFormat('**', '**')}
                    >
                      <Bold size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Italic"
                      onClick={() => insertFormat('*', '*')}
                    >
                      <Italic size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Code"
                      onClick={() => insertFormat('`', '`')}
                    >
                      <Code size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Insert Link"
                      onClick={() => insertFormat('[', '](url)')}
                    >
                      <Link2 size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Ordered List"
                      onClick={() => insertFormat('\n1. ')}
                    >
                      <ListOrdered size={15} />
                    </button>
                    <button
                      type="button"
                      className="tool-icon-btn"
                      title="Bullet List"
                      onClick={() => insertFormat('\n• ')}
                    >
                      <List size={15} />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn-post-reply"
                    disabled={!replyText.trim() || submitting}
                    onClick={() => handleAddComment(replyText)}
                  >
                    {submitting ? 'Posting…' : 'Post Reply'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="reply-composer-card reply-login-gate">
                <div className="login-gate-left">
                  <div className="login-gate-icon">
                    <MessageSquare size={22} />
                  </div>
                  <div className="login-gate-text">
                    <h4>Join the Discussion</h4>
                    <p>Log in or register to post a reply and contribute to this discussion.</p>
                  </div>
                </div>
                <div className="login-gate-actions">
                  <Link to="/login" className="btn-post-reply login-gate-btn">
                    Log In to Reply
                  </Link>
                  <Link to="/register" className="login-gate-secondary-btn">
                    Register
                  </Link>
                </div>
              </div>
            )}
          </section>
        </div>

        <aside className="discussion-sidebar-col">
          <div className="sidebar-widget-card">
            <div className="widget-header-row">
              <h4 className="widget-heading">About This Discussion</h4>
            </div>
            <div className="about-stats-list">
              <div className="about-stat-item">
                <MessageSquare size={16} />
                <span><b>{repliesCount}</b> {repliesCount === 1 ? 'reply' : 'replies'}</span>
              </div>
              <div className="about-stat-item">
                <Eye size={16} />
                <span><b>{viewsCount}</b> views</span>
              </div>
              <div className="about-stat-item">
                <RotateCw size={16} />
                <span>Created <b>{formattedCreatedTime}</b> by <b>{authorName}</b></span>
              </div>
              <div className="about-stat-item">
                <Clock size={16} />
                <span>Last activity <b>{lastActivityText}</b></span>
              </div>
            </div>
          </div>

          <div className="sidebar-widget-card">
            <div className="widget-header-row">
              <h4 className="widget-heading">Tags</h4>
            </div>
            <div className="sidebar-tags-wrap">
              {allCategoryTags.map((tag) => (
                <Link key={tag} to={`/forum?tag=${tag}`} className="sidebar-tag-badge">
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          <div className="sidebar-widget-card">
            <div className="widget-header-row">
              <h4 className="widget-heading">Related Discussions</h4>
              <Link to="/forum" className="widget-view-all">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="related-discussions-list">
              {RELATED_DISCUSSIONS.map((item) => {
                const ItemIcon = item.icon
                return (
                  <Link
                    key={item.id}
                    to={`/forum/posts/${item.id}`}
                    className="related-item-link"
                  >
                    <div
                      className="related-icon-box"
                      style={{ background: item.iconBg, color: item.iconColor }}
                    >
                      <ItemIcon size={16} />
                    </div>
                    <div className="related-item-content">
                      <span className="related-item-title">{item.title}</span>
                      <span className="related-item-meta">
                        {item.replies} replies • {item.timeAgo}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          <div className="lighthouse-quote-card">
            <div className="lighthouse-quote-text">
              <h5 className="lh-quote-title">Students Build a More Open Tomorrow.</h5>
              <span className="lh-quote-author">— GLUG</span>
            </div>

            <div className="lh-vector-art">
              <svg viewBox="0 0 140 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="lhBeam" x1="100" y1="45" x2="0" y2="100" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
                  </linearGradient>
                  <radialGradient id="lhGlow" cx="100" cy="45" r="30" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx="100" cy="45" r="28" fill="url(#lhGlow)" />
                <polygon points="100,45 0,70 0,120 100,45" fill="url(#lhBeam)" />
                <circle cx="20" cy="20" r="1" fill="#fff" opacity="0.6" />
                <circle cx="55" cy="15" r="1.2" fill="#fff" opacity="0.8" />
                <circle cx="80" cy="22" r="1" fill="#fff" opacity="0.5" />
                <circle cx="35" cy="40" r="1.5" fill="#fff" opacity="0.7" />
                <path d="M70 140 C85 110, 105 105, 140 100 L140 140 Z" fill="#0f172a" />
                <path d="M85 140 C100 120, 115 115, 140 110 L140 140 Z" fill="#090d16" />
                <path d="M96 52 L94 98 L106 98 L104 52 Z" fill="#1e293b" />
                <rect x="95" y="44" width="10" height="8" rx="1" fill="#334155" />
                <circle cx="100" cy="48" r="3" fill="#fde047" />
                <polygon points="100,38 94,44 106,44" fill="#0f172a" />
                <line x1="93" y1="52" x2="107" y2="52" stroke="#475569" strokeWidth="1.5" />
                <line x1="92" y1="98" x2="108" y2="98" stroke="#0f172a" strokeWidth="2" />
              </svg>
            </div>
          </div>
        </aside>
      </div>

      {toastMessage && (
        <div className="share-toast">
          <Check size={16} />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  )
}