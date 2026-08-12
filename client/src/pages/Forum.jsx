import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import CategoryFilter from '../components/forum/CategoryFilter.jsx'
import PostCard from '../components/forum/PostCard.jsx'
import PostForm from '../components/forum/PostForm.jsx'

const CATEGORIES = ['general', 'help', 'linux', 'events']

export default function Forum() {
  const { user, token } = useAuth()
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadPosts = async (cat = category) => {
    setLoading(true)
    setError('')
    try {
      const data = await api.get(cat ? `/posts?category=${cat}` : '/posts')
      setPosts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts('')
  }, [])

  const handleSelectCategory = (selectedCat) => {
    setCategory(selectedCat)
    loadPosts(selectedCat)
  }

  const handleCreatePost = async (postData) => {
    try {
      await api.post('/posts', postData, token)
      setShowForm(false)
      loadPosts(category)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page">
      <div className="page-header">
        <h1 className="page-title">Community Forum</h1>
        {user ? (
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ New Post'}
          </Button>
        ) : (
          <Link to="/login" className="btn btn-primary">Login to Post</Link>
        )}
      </div>

      {showForm && (
        <PostForm categories={CATEGORIES} onSubmit={handleCreatePost} />
      )}

      <ErrorMessage message={error} />

      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={category}
        onSelectCategory={handleSelectCategory}
      />

      {loading && <LoadingSpinner text="Loading posts…" />}

      {!loading && posts.length === 0 && (
        <p>No posts yet — be the first to start a discussion!</p>
      )}

      <div className="post-list">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </section>
  )
}