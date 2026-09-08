import { useEffect, useState, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/common/Card.jsx'
import Chip from '../components/common/Chip.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import CommentItem from '../components/forum/CommentItem.jsx'
import CommentForm from '../components/forum/CommentForm.jsx'
import VoteButtons from '../components/forum/VoteButtons.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { ArrowLeft, Trash2, Pin } from 'lucide-react'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await postsApi.get(id)
      setData(res)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    load()
  }, [load])

  const handleAddComment = async (commentBody, parentComment = null) => {
    try {
      await postsApi.addComment(id, { body: commentBody, parentComment })
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return
    try {
      await postsApi.deleteComment(id, commentId)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post? This cannot be undone.')) return
    setDeleting(true)
    try {
      await postsApi.delete(id)
      navigate('/forum')
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  const handleTogglePin = async () => {
    try {
      await postsApi.pin(id)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <LoadingSpinner text="Loading discussion…" />
      </section>
    )
  }

  if (error && !data) {
    return (
      <section className="page">
        <Link to="/forum" className="back-link">
          <ArrowLeft size={16} /> Back to forum
        </Link>
        <ErrorMessage message={error} />
      </section>
    )
  }

  if (!data || !data.post) return null

  const { post, comments = [] } = data
  const authorName = post.author?.username || post.username || 'Anonymous'
  const authorId = post.author?.id || post.author?._id
  const isAuthor = user && (user.id === authorId || user._id === authorId || user.username === authorName)
  const isAdmin = user?.role === 'admin'
  const canDeletePost = isAuthor || isAdmin

  const formattedDate = new Date(post.createdAt || post.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  const rootComments = comments.filter((c) => !c.parentComment)
  const repliesByParent = {}
  comments.forEach((c) => {
    if (c.parentComment) {
      if (!repliesByParent[c.parentComment]) {
        repliesByParent[c.parentComment] = []
      }
      repliesByParent[c.parentComment].push(c)
    }
  })

  return (
    <section className="page post-detail-page">
      <div className="post-detail-nav">
        <Link to="/forum" className="back-link">
          <ArrowLeft size={16} /> Back to forum
        </Link>

        <div className="post-actions-top">
          {isAdmin && (
            <button
              type="button"
              className={`btn btn-ghost btn-sm ${post.isPinned ? 'pinned-active' : ''}`}
              onClick={handleTogglePin}
            >
              <Pin size={14} />
              <span>{post.isPinned ? 'Unpin Post' : 'Pin Post'}</span>
            </button>
          )}

          {canDeletePost && (
            <button
              type="button"
              className="btn btn-ghost btn-sm text-danger"
              onClick={handleDeletePost}
              disabled={deleting}
            >
              <Trash2 size={14} />
              <span>{deleting ? 'Deleting…' : 'Delete'}</span>
            </button>
          )}
        </div>
      </div>

      <Card className="post-detail-card">
        <div className="post-detail-layout">
          <VoteButtons
            postId={post.id || post._id}
            initialScore={post.voteScore || 0}
            initialVote={post.userVote || 0}
            orientation="vertical"
          />

          <div className="post-detail-main">
            <div className="post-header-line">
              <div className="post-author-badge">
                <div
                  className="post-mini-avatar"
                  style={{ background: avatarColor(authorName) }}
                >
                  {avatarInitials(authorName)}
                </div>
                <div className="post-author-meta">
                  <div className="post-author-row">
                    <span className="post-author-name">@{authorName}</span>
                    {post.author?.role === 'admin' && <span className="admin-badge">Admin</span>}
                  </div>
                  <span className="post-date">{formattedDate}</span>
                </div>
              </div>

              {post.isPinned && (
                <span className="pinned-badge">
                  <Pin size={13} /> Pinned
                </span>
              )}
            </div>

            <h1 className="post-detail-title">{post.title}</h1>

            <div className="post-tags-container" style={{ margin: '0.75rem 0' }}>
              <Chip label={post.category} />
              {post.tags?.map((tag) => (
                <span key={tag} className="post-tag-pill">
                  #{tag}
                </span>
              ))}
            </div>

            <div className="post-detail-body">
              {post.body.split('\n').map((line, idx) => (
                <p key={idx}>{line || '\u00A0'}</p>
              ))}
            </div>
          </div>
        </div>
      </Card>

      <div className="comments-section">
        <div className="comments-header-row">
          <h2 className="comments-title">
            Discussion ({comments.length})
          </h2>
        </div>

        {user ? (
          <CommentForm onSubmit={(text) => handleAddComment(text, null)} />
        ) : (
          <div className="comment-login-prompt">
            <p>
              Want to join this discussion?{' '}
              <Link to="/login" className="link">
                Log in
              </Link>{' '}
              or{' '}
              <Link to="/register" className="link">
                Register
              </Link>{' '}
              to share your thoughts.
            </p>
          </div>
        )}

        <ErrorMessage message={error} />

        {comments.length === 0 ? (
          <p className="no-comments-text">No comments yet. Start the conversation!</p>
        ) : (
          <div className="comment-list">
            {rootComments.map((comment) => (
              <CommentItem
                key={comment.id || comment._id}
                comment={comment}
                replies={repliesByParent[comment.id || comment._id] || []}
                onReply={(text, parentId) => handleAddComment(text, parentId)}
                onDelete={(commentId) => handleDeleteComment(commentId)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}