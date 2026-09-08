import { Link } from 'react-router-dom'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'
import VoteButtons from './VoteButtons.jsx'
import { Pin, MessageSquare } from 'lucide-react'
import { avatarInitials, avatarColor } from '../common/avatar.js'

export default function PostCard({ post, onTagClick }) {
  const authorName = post.author?.username || post.username || 'Anonymous'
  const postDate = new Date(post.createdAt || post.created_at).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <Card className={`post-card ${post.isPinned ? 'post-card-pinned' : ''}`}>
      <div className="post-card-layout">
        <VoteButtons
          postId={post.id || post._id}
          initialScore={post.voteScore || 0}
          initialVote={post.userVote || 0}
          orientation="vertical"
        />

        <div className="post-card-main">
          <div className="post-header-line">
            <div className="post-author-badge">
              <div
                className="post-mini-avatar"
                style={{ background: avatarColor(authorName) }}
              >
                {avatarInitials(authorName)}
              </div>
              <span className="post-author-name">@{authorName}</span>
              {post.author?.role === 'admin' && <span className="admin-badge">Admin</span>}
            </div>

            <div className="post-header-badges">
              {post.isPinned && (
                <span className="pinned-badge" title="Pinned by moderators">
                  <Pin size={13} /> Pinned
                </span>
              )}
              <span className="post-date">{postDate}</span>
            </div>
          </div>

          <Link to={`/forum/posts/${post.id || post._id}`} className="post-title">
            <h2>{post.title}</h2>
          </Link>

          <p className="post-preview">{post.body}</p>

          <div className="post-footer-line">
            <div className="post-tags-container">
              <Chip label={post.category} />
              {post.tags?.map((tag) => (
                <span
                  key={tag}
                  className="post-tag-pill"
                  onClick={(e) => {
                    if (onTagClick) {
                      e.preventDefault()
                      e.stopPropagation()
                      onTagClick(tag)
                    }
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>

            <Link to={`/forum/posts/${post.id || post._id}`} className="post-comment-counter">
              <MessageSquare size={14} />
              <span>{post.commentCount ?? post.comment_count ?? 0} comments</span>
            </Link>
          </div>
        </div>
      </div>
    </Card>
  )
}

