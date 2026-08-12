import { useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'

export default function PostForm({ categories, onSubmit }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState(categories[0] || 'general')

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({ title, body, category })
    setTitle('')
    setBody('')
  }

  return (
    <Card className="post-form-card">
      <form className="post-form" onSubmit={handleSubmit}>
        <h2>Create a post</h2>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </label>
        <label>
          Body
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            required
          />
        </label>
        <label>
          Category
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>
        <Button type="submit">Post</Button>
      </form>
    </Card>
  )
}
