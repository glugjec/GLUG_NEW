import Card from '../common/Card.jsx'

export default function CommentItem({ comment }) {
  const formattedDate = new Date(comment.created_at).toLocaleString()

  return (
    <Card className="comment">
      <p className="post-meta">
        <strong>@{comment.username}</strong> · {formattedDate}
      </p>
      <p>{comment.body}</p>
    </Card>
  )
}
