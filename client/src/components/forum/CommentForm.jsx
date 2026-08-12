import { useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'

export default function CommentForm({ onSubmit }) {
  const [comment, setComment] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(comment)
    setComment('')
  }

  return (
    <Card className="comment-form-card">
      <form className="comment-form" onSubmit={handleSubmit}>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          placeholder="Share your thoughts…"
          required
        />
        <Button type="submit">Comment</Button>
      </form>
    </Card>
  )
}
