import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Card from '../components/common/Card.jsx'
import Chip from '../components/common/Chip.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import CommentItem from '../components/forum/CommentItem.jsx'
import CommentForm from '../components/forum/CommentForm.jsx'

export default function PostDetail() {
  const { id } = useParams()
  const { user, token } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      setData(await api.get(`/posts/${id}`))
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [id])

  const handleAddComment = async (commentBody) => {
    try {
      await api.post(`/posts/${id}/comments`, { body: commentBody }, token)
      load()
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <section className="page"><LoadingSpinner text="Loading post…" /></section>
  if (error) return <section className="page"><ErrorMessage message={error} /></section>
  if (!data) return null

  const formattedDate = new Date(data.post.created_at).toLocaleString()

  return (
    <section className="page">
      <Link to="/forum" className="back-link">← Back to forum</Link>
      <Card>
        <h1 className="page-title">{data.post.title}</h1>
        <p className="post-meta">
          <Chip label={data.post.category} />
          {' '}by <strong>@{data.post.username}</strong> ·{' '}
          {formattedDate}
        </p>
        <p className="post-body">{data.post.body}</p>
      </Card>

      <h2 className="comments-title">Comments ({data.comments.length})</h2>

      {user ? (
        <CommentForm onSubmit={handleAddComment} />
      ) : (
        <p><Link to="/login">Login</Link> to join the discussion.</p>
      )}

      <div className="comment-list">
        {data.comments.map((comment) => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </section>
  )
}