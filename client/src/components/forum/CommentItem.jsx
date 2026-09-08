import { useState } from 'react'
import Card from '../common/Card.jsx'
import { avatarInitials, avatarColor } from '../common/avatar.js'
import { MessageSquare, Trash2, CornerDownRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext.jsx'

export default function CommentItem({ comment, replies = [], onReply, onDelete }) {
  const { user } = useAuth()
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)

  const authorName = comment.author?.username || comment.username || 'Anonymous'
  const authorId = comment.author?.id || comment.author?._id
  const isAuthor = user && (user.id === authorId || user._id === authorId || user.username === authorName)
  const isAdmin = user?.role === 'admin'
  const canDelete = isAuthor || isAdmin

  const formattedDate = new Date(comment.createdAt || comment.created_at).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyText.trim()) return

    setSubmittingReply(true)
    try {
      await onReply(replyText, comment.id || comment._id)
      setReplyText('')
      setShowReplyForm(false)
    } finally {
      setSubmittingReply(false)
    }
  }

  return (
    <div className="comment-wrapper">
      <Card className="comment">
        <div className="comment-header">
          <div className="comment-author-badge">
            <div
              className="comment-mini-avatar"
              style={{ background: avatarColor(authorName) }}
            >
              {avatarInitials(authorName)}
            </div>
            <span className="comment-author-name">@{authorName}</span>
            {comment.author?.role === 'admin' && (
              <span className="admin-badge">Admin</span>
            )}
            <span className="comment-dot">·</span>
            <span className="comment-date">{formattedDate}</span>
          </div>

          {canDelete && onDelete && (
            <button
              type="button"
              className="comment-delete-btn"
              title="Delete comment"
              onClick={() => onDelete(comment.id || comment._id)}
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <p className="comment-body-text">{comment.body}</p>

        {user && onReply && (
          <div className="comment-footer">
            <button
              type="button"
              className="comment-reply-btn"
              onClick={() => setShowReplyForm(!showReplyForm)}
            >
              <MessageSquare size={13} />
              <span>{showReplyForm ? 'Cancel' : 'Reply'}</span>
            </button>
          </div>
        )}

        {showReplyForm && (
          <form className="inline-reply-form" onSubmit={handleSendReply}>
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder={`Replying to @${authorName}…`}
              rows={2}
              required
            />
            <div className="reply-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setShowReplyForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-sm"
                disabled={submittingReply}
              >
                {submittingReply ? 'Replying…' : 'Post Reply'}
              </button>
            </div>
          </form>
        )}
      </Card>

      {/* Render nested replies */}
      {replies.length > 0 && (
        <div className="nested-replies">
          {replies.map((reply) => {
            const replyAuthor = reply.author?.username || reply.username || 'Anonymous'
            const replyAuthorId = reply.author?.id || reply.author?._id
            const canDeleteReply =
              user &&
              (user.id === replyAuthorId ||
                user._id === replyAuthorId ||
                user.username === replyAuthor ||
                user.role === 'admin')

            const replyDate = new Date(reply.createdAt || reply.created_at).toLocaleString(undefined, {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div className="nested-reply-item" key={reply.id || reply._id}>
                <div className="reply-curve">
                  <CornerDownRight size={14} />
                </div>
                <Card className="comment comment-nested">
                  <div className="comment-header">
                    <div className="comment-author-badge">
                      <div
                        className="comment-mini-avatar"
                        style={{ background: avatarColor(replyAuthor) }}
                      >
                        {avatarInitials(replyAuthor)}
                      </div>
                      <span className="comment-author-name">@{replyAuthor}</span>
                      {reply.author?.role === 'admin' && (
                        <span className="admin-badge">Admin</span>
                      )}
                      <span className="comment-dot">·</span>
                      <span className="comment-date">{replyDate}</span>
                    </div>

                    {canDeleteReply && onDelete && (
                      <button
                        type="button"
                        className="comment-delete-btn"
                        title="Delete reply"
                        onClick={() => onDelete(reply.id || reply._id)}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <p className="comment-body-text">{reply.body}</p>
                </Card>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

