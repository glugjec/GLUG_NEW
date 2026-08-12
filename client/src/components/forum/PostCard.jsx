import { Link } from 'react-router-dom'
import Card from '../common/Card.jsx'
import Chip from '../common/Chip.jsx'

export default function PostCard({ post }) {
  const formattedDate = new Date(post.created_at).toLocaleString()

  return (
    <Card className="post-card">
      <Link to={`/forum/posts/${post.id}`} className="post-title">
        <h2>{post.title}</h2>
      </Link>
      <p className="post-meta">
        <Chip label={post.category} />
        {' '}by <strong>@{post.username}</strong> · {post.comment_count} comments ·{' '}
        {formattedDate}
      </p>
      <p className="post-preview">{post.body}</p>
    </Card>
  )
}
