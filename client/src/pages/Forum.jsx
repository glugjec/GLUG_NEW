import { useEffect, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import Button from '../components/common/Button.jsx'
import ErrorMessage from '../components/common/ErrorMessage.jsx'
import LoadingSpinner from '../components/common/LoadingSpinner.jsx'
import CategoryFilter from '../components/forum/CategoryFilter.jsx'
import PostCard from '../components/forum/PostCard.jsx'
import PostForm from '../components/forum/PostForm.jsx'
import { Search, Plus } from 'lucide-react'

const CATEGORIES = ['general', 'help', 'linux', 'events', 'projects', 'resources']

export default function Forum() {
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [category, setCategory] = useState('')
  const [sort, setSort] = useState('hot')
  const [tag, setTag] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, hasMore: false, totalPages: 1 })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const loadPosts = useCallback(
    async (currentPage = 1, append = false) => {
      if (currentPage === 1) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      setError('')

      try {
        const params = {
          page: currentPage,
          limit: 15,
          sort,
        }
        if (category) params.category = category
        if (tag) params.tag = tag
        if (search) params.search = search

        const data = await postsApi.list(params)
        const incomingPosts = data.posts || []

        if (append) {
          setPosts((prev) => [...prev, ...incomingPosts])
        } else {
          setPosts(incomingPosts)
        }

        if (data.pagination) {
          setPagination(data.pagination)
        }
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [category, sort, tag, search]
  )

  useEffect(() => {
    setPage(1)
    loadPosts(1, false)
  }, [category, sort, tag, search, loadPosts])

  const handleSelectCategory = (cat) => {
    setCategory(cat)
    setPage(1)
  }

  const handleSelectSort = (newSort) => {
    setSort(newSort)
    setPage(1)
  }

  const handleTagClick = (newTag) => {
    setTag(newTag)
    setPage(1)
  }

  const handleClearTag = () => {
    setTag('')
    setPage(1)
  }

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    setSearch(searchInput.trim())
    setPage(1)
  }

  const handleLoadMore = () => {
    if (!pagination.hasMore || loadingMore) return
    const nextPage = page + 1
    setPage(nextPage)
    loadPosts(nextPage, true)
  }

  const handleCreatePost = async (postData) => {
    try {
      await postsApi.create(postData)
      setShowForm(false)
      setPage(1)
      loadPosts(1, false)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <section className="page forum-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Community Forum</h1>
          <p className="page-subtitle">
            Open-source discussions, Linux lab queries, workshops, and project showcases.
          </p>
        </div>

        <div className="forum-header-actions">
          {user ? (
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : <><Plus size={16} /> New Post</>}
            </Button>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Log in to Post
            </Link>
          )}
        </div>
      </div>

      {showForm && (
        <PostForm
          categories={CATEGORIES}
          onSubmit={handleCreatePost}
          onCancel={() => setShowForm(false)}
        />
      )}

      <div className="forum-search-bar">
        <form onSubmit={handleSearchSubmit} className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search discussions by keyword or topic…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {search && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => {
                setSearch('')
                setSearchInput('')
              }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      <CategoryFilter
        categories={CATEGORIES}
        activeCategory={category}
        onSelectCategory={handleSelectCategory}
        activeSort={sort}
        onSelectSort={handleSelectSort}
        activeTag={tag}
        onClearTag={handleClearTag}
      />

      <ErrorMessage message={error} />

      {loading && <LoadingSpinner text="Loading community discussions…" />}

      {!loading && posts.length === 0 && (
        <div className="empty-state-card">
          <p className="empty-title">No discussions found</p>
          <p className="empty-desc">
            {search || tag || category
              ? 'Try changing your filters or search keywords.'
              : 'Be the first one to start a conversation in this section!'}
          </p>
        </div>
      )}

      <div className="post-list">
        {posts.map((post) => (
          <PostCard
            key={post.id || post._id}
            post={post}
            onTagClick={handleTagClick}
          />
        ))}
      </div>

      {pagination.hasMore && (
        <div className="load-more-container">
          <button
            type="button"
            className="btn btn-ghost"
            onClick={handleLoadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading more…' : 'Load More Discussions'}
          </button>
        </div>
      )}
    </section>
  )
}

