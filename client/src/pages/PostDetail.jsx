import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { formatRelativeTime } from '../utils/timeAgo.js'
import { calculateNextVoteScore } from '../utils/voteCalculator.js'
import MarkdownRenderer from '../components/common/MarkdownRenderer.jsx'
import RichTextEditor from '../components/common/RichTextEditor.jsx'
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
  Terminal,
  Gamepad2,
  Monitor,
  Trash2,
  Check,
  Loader2,
  Code
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

function CommentThreadItem({
  comment,
  activeReplyId,
  setActiveReplyId,
  subReplyText,
  setSubReplyText,
  handleAddComment,
  handleCommentVote,
  submitting,
  user,
  navigate,
  showToast
}) {
  const [showReplies, setShowReplies] = useState(true)
  const [visibleCount, setVisibleCount] = useState(3)

  if (!comment) return null
  const commentId = String(comment.id || comment._id || '')
  if (!commentId) return null

  const rAuthor = comment.author?.username || 'member'
  const rRole = comment.author?.role || 'Core Member'
  const rTime = formatRelativeTime(comment.createdAt)
  const isReplying = activeReplyId === commentId

  const replies = Array.isArray(comment.replies) ? comment.replies : []
  const hasReplies = replies.length > 0
  const repliesToShow = replies.slice(0, visibleCount)
  const remainingReplies = replies.length - repliesToShow.length
  const bodyText = typeof comment.body === 'string' ? comment.body : String(comment.body || '')

  return (
    <div id={`comment-${commentId}`} className={`reply-card ${comment.isAccepted ? 'is-accepted' : ''}`}>
      <div className="reply-top-header">
        <div className="reply-user-left">
          <UserAvatar
            src={comment.author?.avatar}
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

        {comment.isAccepted && (
          <div className="accepted-answer-pill">
            <CheckCircle2 size={14} />
            <span>Accepted Answer</span>
          </div>
        )}
      </div>

      <div className="reply-body-content">
        <MarkdownRenderer content={bodyText} />
      </div>

      <div className="reply-footer-actions">
        <div className={`vote-capsule ${comment.userVote === 1 ? 'voted-up' : comment.userVote === -1 ? 'voted-down' : ''}`}>
          <button
            type="button"
            className={`vote-capsule-btn ${comment.userVote === 1 ? 'voted-up' : ''}`}
            onClick={() => handleCommentVote(commentId, 1)}
            title={comment.userVote === 1 ? 'Upvoted (click to undo)' : 'Upvote'}
            aria-pressed={comment.userVote === 1}
          >
            <ChevronUp size={15} strokeWidth={comment.userVote === 1 ? 2.8 : 2} />
          </button>
          <span className="vote-score-num">{comment.voteScore || 0}</span>
        </div>

        <button
          type="button"
          className={`btn-reply-action ${isReplying ? 'active-reply-btn' : ''}`}
          onClick={() => {
            if (!user) {
              showToast('Please log in to reply')
              navigate('/login')
              return
            }
            setActiveReplyId(isReplying ? null : commentId)
            setSubReplyText('')
          }}
        >
          <CornerDownRight size={14} />
          <span>Reply</span>
        </button>
      </div>

      {isReplying && (
        <div className="inline-nested-reply">
          <div className="inline-reply-header">
            <span className="inline-reply-target">
              <CornerDownRight size={13} />
              <span>Replying to <strong>@{rAuthor}</strong></span>
            </span>
          </div>
          <textarea
            placeholder={`Write a reply to @${rAuthor}...`}
            value={subReplyText}
            onChange={(e) => setSubReplyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                if (!submitting && subReplyText.trim()) {
                  handleAddComment(subReplyText, commentId)
                }
              }
            }}
            className="inline-reply-textarea"
            rows={2}
            autoFocus
          />
          <div className="inline-reply-footer">
            <div className="inline-reply-btn-group">
              <button
                type="button"
                className="btn-cancel-inline-reply"
                onClick={() => {
                  setActiveReplyId(null)
                  setSubReplyText('')
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-submit-inline-reply"
                disabled={submitting || !subReplyText.trim()}
                onClick={() => handleAddComment(subReplyText, commentId)}
              >
                {submitting ? 'Posting…' : 'Reply'}
              </button>
            </div>
          </div>
        </div>
      )}

      {hasReplies && (
        <div className="yt-thread-container">
          <button
            type="button"
            className="btn-yt-replies-toggle"
            onClick={() => setShowReplies(!showReplies)}
          >
            <ChevronDown size={15} className={`yt-toggle-chevron ${showReplies ? 'is-open' : ''}`} />
            <span>{showReplies ? 'Hide' : ''} {replies.length} {replies.length === 1 ? 'reply' : 'replies'}</span>
          </button>

          {showReplies && (
            <div className="yt-replies-stream">
              {repliesToShow.map((reply) => {
                const repId = String(reply.id || reply._id || '')
                const repAuthor = reply.author?.username || 'member'
                const repRole = reply.author?.role || 'Core Member'
                const repTime = formatRelativeTime(reply.createdAt)
                const isRepReplying = activeReplyId === repId
                const repBody = typeof reply.body === 'string' ? reply.body : String(reply.body || '')

                return (
                  <div key={repId} id={`comment-${repId}`} className="yt-reply-item">
                    <div className="reply-top-header">
                      <div className="reply-user-left">
                        <UserAvatar
                          src={reply.author?.avatar}
                          username={repAuthor}
                          size={28}
                          className="reply-avatar"
                        />
                        <div className="reply-user-info">
                          <Link to={`/profile/${encodeURIComponent(repAuthor)}`} className="reply-username">
                            {repAuthor}
                          </Link>
                          {reply.parentAuthor && (
                            <span className="reply-parent-mention">
                              <CornerDownRight size={11} />
                              <span>@{reply.parentAuthor}</span>
                            </span>
                          )}
                          <span
                            className={`role-badge ${
                              repRole.toLowerCase().includes('moderator')
                                ? 'role-mod'
                                : 'role-core-member'
                            }`}
                          >
                            {repRole}
                          </span>
                          <span className="reply-time">{repTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="reply-body-content yt-reply-body">
                      <MarkdownRenderer content={repBody} />
                    </div>

                    <div className="reply-footer-actions">
                      <div className={`vote-capsule ${reply.userVote === 1 ? 'voted-up' : reply.userVote === -1 ? 'voted-down' : ''}`}>
                        <button
                          type="button"
                          className={`vote-capsule-btn ${reply.userVote === 1 ? 'voted-up' : ''}`}
                          onClick={() => handleCommentVote(repId, 1)}
                          title={reply.userVote === 1 ? 'Upvoted (click to undo)' : 'Upvote'}
                          aria-pressed={reply.userVote === 1}
                        >
                          <ChevronUp size={15} strokeWidth={reply.userVote === 1 ? 2.8 : 2} />
                        </button>
                        <span className="vote-score-num">{reply.voteScore || 0}</span>
                      </div>

                      <button
                        type="button"
                        className={`btn-reply-action ${isRepReplying ? 'active-reply-btn' : ''}`}
                        onClick={() => {
                          if (!user) {
                            showToast('Please log in to reply')
                            navigate('/login')
                            return
                          }
                          setActiveReplyId(isRepReplying ? null : repId)
                          setSubReplyText('')
                        }}
                      >
                        <CornerDownRight size={14} />
                        <span>Reply</span>
                      </button>
                    </div>

                    {isRepReplying && (
                      <div className="inline-nested-reply">
                        <div className="inline-reply-header">
                          <span className="inline-reply-target">
                            <CornerDownRight size={13} />
                            <span>Replying to <strong>@{repAuthor}</strong></span>
                          </span>
                        </div>
                        <textarea
                          placeholder={`Write a reply to @${repAuthor}...`}
                          value={subReplyText}
                          onChange={(e) => setSubReplyText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault()
                              if (!submitting && subReplyText.trim()) {
                                handleAddComment(subReplyText, repId)
                              }
                            }
                          }}
                          className="inline-reply-textarea"
                          rows={2}
                          autoFocus
                        />
                        <div className="inline-reply-footer">
                          <div className="inline-reply-btn-group">
                            <button
                              type="button"
                              className="btn-cancel-inline-reply"
                              onClick={() => {
                                setActiveReplyId(null)
                                setSubReplyText('')
                              }}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn-submit-inline-reply"
                              disabled={submitting || !subReplyText.trim()}
                              onClick={() => handleAddComment(subReplyText, repId)}
                            >
                              {submitting ? 'Posting…' : 'Reply'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}

              {remainingReplies > 0 && (
                <button
                  type="button"
                  className="btn-show-more-thread-replies"
                  onClick={() => setVisibleCount((prev) => prev + 5)}
                >
                  <CornerDownRight size={13} />
                  <span>Show {remainingReplies} more {remainingReplies === 1 ? 'reply' : 'replies'}</span>
                </button>
              )}

              {visibleCount > 3 && replies.length > 3 && (
                <button
                  type="button"
                  className="btn-show-more-thread-replies btn-show-fewer"
                  onClick={() => setVisibleCount(3)}
                >
                  <span>Show fewer replies</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
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
  const [visibleRootCount, setVisibleRootCount] = useState(5)
  const [submitting, setSubmitting] = useState(false)
  const [imageUploading, setImageUploading] = useState(false)
  const pendingPostVoteRef = useRef(null)
  const isPostVotingRef = useRef(false)
  const pendingCommentVotesRef = useRef(new Map())
  const activeCommentVotesRef = useRef(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await postsApi.get(id)
      if (res && res.post) {
        setPost(res.post)
        setComments(res.comments || [])
        setBookmarked(!!res.post.isBookmarked)
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

  const commentTree = useMemo(() => {
    if (!Array.isArray(comments) || comments.length === 0) return []

    const map = new Map()
    comments.forEach((c) => {
      if (!c) return
      const cid = String(c.id || c._id || '')
      if (cid) {
        map.set(cid, { ...c, id: cid, replies: [] })
      }
    })

    const findRoot = (c) => {
      let curr = c
      let steps = 0
      while (curr && steps < 50) {
        let pId = curr.parentComment
        if (pId && typeof pId === 'object') {
          pId = pId._id || pId.id
        }
        pId = pId ? String(pId) : null
        if (!pId || pId === curr.id || !map.has(pId)) {
          return curr
        }
        curr = map.get(pId)
        steps++
      }
      return curr
    }

    const roots = []
    comments.forEach((c) => {
      if (!c) return
      const cid = String(c.id || c._id || '')
      if (!cid) return
      const node = map.get(cid)
      if (!node) return

      let pId = c.parentComment
      if (pId && typeof pId === 'object') {
        pId = pId._id || pId.id
      }
      pId = pId ? String(pId) : null

      if (pId && map.has(pId) && pId !== cid) {
        const parentNode = map.get(pId)
        node.parentAuthor = parentNode.author?.username || null
        const rootNode = findRoot(c)
        if (rootNode && rootNode.id !== cid && map.has(rootNode.id)) {
          map.get(rootNode.id).replies.push(node)
        } else {
          roots.push(node)
        }
      } else {
        roots.push(node)
      }
    })

    const compareFn = (a, b) => {
      if (sortBy === 'best') return (b.voteScore || 0) - (a.voteScore || 0)
      if (sortBy === 'newest') return new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      return new Date(a.createdAt || 0) - new Date(b.createdAt || 0)
    }

    roots.sort(compareFn)

    roots.forEach((root) => {
      if (Array.isArray(root.replies)) {
        root.replies.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0))
      }
    })

    return roots
  }, [comments, sortBy])

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
    const currentScore = Math.max(0, post.voteScore || 0)
    const nextScore = calculateNextVoteScore(currentScore, currentVote, nextVote)

    setPost((prev) => ({
      ...prev,
      userVote: nextVote,
      voteScore: nextScore
    }))

    if (!post.id || post.id.startsWith('distro-')) return

    pendingPostVoteRef.current = nextVote
    if (isPostVotingRef.current) return
    isPostVotingRef.current = true

    try {
      while (pendingPostVoteRef.current !== null) {
        const targetVote = pendingPostVoteRef.current
        pendingPostVoteRef.current = null
        const res = await postsApi.vote(post.id || post._id, targetVote)
        if (pendingPostVoteRef.current === null && res && typeof res.voteScore === 'number') {
          setPost((prev) => ({
            ...prev,
            userVote: res.userVote,
            voteScore: Math.max(0, res.voteScore)
          }))
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to register vote')
    } finally {
      isPostVotingRef.current = false
    }
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
    const curScore = Math.max(0, currentComment?.voteScore || 0)
    const nxtScore = calculateNextVoteScore(curScore, cur, nxt)

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId || c._id === commentId) {
          return {
            ...c,
            userVote: nxt,
            voteScore: nxtScore
          }
        }
        return c
      })
    )

    pendingCommentVotesRef.current.set(commentId, nxt)
    if (activeCommentVotesRef.current.has(commentId)) return
    activeCommentVotesRef.current.add(commentId)

    const postId = post?.id || post?._id || id
    try {
      while (pendingCommentVotesRef.current.has(commentId)) {
        const targetVote = pendingCommentVotesRef.current.get(commentId)
        pendingCommentVotesRef.current.delete(commentId)
        const res = await postsApi.voteComment(postId, commentId, targetVote)
        if (!pendingCommentVotesRef.current.has(commentId) && res && typeof res.voteScore === 'number') {
          setComments((prev) =>
            prev.map((c) => {
              if (c.id === commentId || c._id === commentId) {
                return {
                  ...c,
                  userVote: res.userVote ?? targetVote,
                  voteScore: Math.max(0, res.voteScore)
                }
              }
              return c
            })
          )
        }
      }
    } catch (err) {
      showToast(err.message || 'Failed to register vote')
    } finally {
      activeCommentVotesRef.current.delete(commentId)
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

  const handleToggleBookmark = async () => {
    if (!user) {
      showToast('Please log in to bookmark')
      navigate('/login')
      return
    }
    const next = !bookmarked
    setBookmarked(next)
    showToast(next ? 'Saved to bookmarks!' : 'Bookmark removed')
    try {
      const res = await postsApi.bookmark(post.id || post._id)
      if (res && typeof res.bookmarked === 'boolean') {
        setBookmarked(res.bookmarked)
      }
    } catch {
      setBookmarked(!next)
      showToast('Failed to update bookmark')
    }
  }

  const handleAddComment = async (text, parentId = null) => {
    if (!user) {
      showToast('Please log in to reply')
      navigate('/login')
      return
    }
    if (!parentId && imageUploading) return
    const hasContent = text.replace(/<[^>]*>/g, '').trim().length > 0 || text.includes('<img')
    if (!hasContent) return
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
        await postsApi.addComment(post._id || post.id, { body: text.trim(), parentComment: parentId })
        await load()
      } else {
        setComments((prev) => [...prev, newComment])
      }
      if (parentId) {
        setActiveReplyId(null)
        setSubReplyText('')
      } else {
        setReplyText('')
        setVisibleRootCount((prev) => prev + 1)
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
                  onClick={handleToggleBookmark}
                  title={bookmarked ? 'Remove Bookmark' : 'Bookmark'}
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
              <MarkdownRenderer content={activePost.body || ''} />
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

            {commentTree.length === 0 ? (
              <div className="no-replies-placeholder">
                <div className="no-replies-icon-wrap">
                  <MessageSquare size={26} />
                </div>
                <h4 className="no-replies-title">No replies yet</h4>
                <p className="no-replies-sub">Be the first to share your thoughts and join the discussion below.</p>
              </div>
            ) : (
              <div className="replies-list-container">
                {commentTree.slice(0, visibleRootCount).map((root) => (
                  <CommentThreadItem
                    key={root.id || root._id}
                    comment={root}
                    activeReplyId={activeReplyId}
                    setActiveReplyId={setActiveReplyId}
                    subReplyText={subReplyText}
                    setSubReplyText={setSubReplyText}
                    handleAddComment={handleAddComment}
                    handleCommentVote={handleCommentVote}
                    submitting={submitting}
                    user={user}
                    navigate={navigate}
                    showToast={showToast}
                  />
                ))}

                {commentTree.length > visibleRootCount && (
                  <div className="show-more-comments-wrapper">
                    <button
                      type="button"
                      className="btn-show-more-roots"
                      onClick={() => setVisibleRootCount((prev) => prev + 5)}
                    >
                      <ChevronDown size={16} />
                      <span>Show more replies ({commentTree.length - visibleRootCount} remaining)</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="reply-composer-card">
                <div className="reply-composer-body">
                  <UserAvatar
                    src={user?.avatar}
                    username={user.username}
                    size={38}
                    className="composer-avatar"
                  />
                  <div className="composer-rte-container">
                    <RichTextEditor
                      content={replyText}
                      onChange={setReplyText}
                      placeholder="Write a reply..."
                      minHeight="100px"
                      onError={showToast}
                      toolbarPosition="bottom"
                      onUploadingChange={setImageUploading}
                      actions={
                        <button
                          type="button"
                          className="btn-post-reply"
                          disabled={
                            submitting ||
                            imageUploading ||
                            (!replyText.replace(/<[^>]*>/g, '').trim() && !replyText.includes('<img'))
                          }
                          onClick={() => handleAddComment(replyText)}
                        >
                          {submitting ? 'Posting…' : 'Post Reply'}
                        </button>
                      }
                    />
                  </div>
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