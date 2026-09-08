import { useState } from 'react'
import Card from '../common/Card.jsx'
import Button from '../common/Button.jsx'

export default function PostForm({ categories, onSubmit, onCancel }) {
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [category, setCategory] = useState(categories[0] || 'general')
  const [tagsInput, setTagsInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)

    setSubmitting(true)
    try {
      await onSubmit({ title, body, category, tags })
      setTitle('')
      setBody('')
      setTagsInput('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card className="post-form-card">
      <form className="post-form" onSubmit={handleSubmit}>
        <div className="form-header-row">
          <h2>Start a Discussion</h2>
          {onCancel && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
        </div>

        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What would you like to discuss or ask?"
            required
            maxLength={250}
          />
        </label>

        <div className="form-row-split">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c.charAt(0).toUpperCase() + c.slice(1)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tags (comma-separated)
            <input
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="e.g. bash, ubuntu, first-year"
            />
          </label>
        </div>

        <label>
          Content (Markdown supported)
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Provide context, code snippets, or error details…"
            rows={6}
            required
          />
        </label>

        <div className="form-submit-row">
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Publishing…' : 'Publish Post'}
          </Button>
        </div>
      </form>
    </Card>
  )
}

