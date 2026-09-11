import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { formatRelativeTime } from '../utils/timeAgo.js'
import VoteButtons from '../components/forum/VoteButtons.jsx'
import {
  Sparkles,
  Flame,
  Clock,
  Award,
  MessageSquare,
  Share2,
  Bookmark,
  Pin,
  Compass,
  RefreshCw
} from 'lucide-react'
import './ForYou.css'

function extractFirstImage(body) {
  if (!body || typeof body !== 'string') return null
  const imgTagMatch = body.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imgTagMatch && imgTagMatch[1]) return imgTagMatch[1]
  const mdImgMatch = body.match(/!\[[^\]]*\]\((https?:\/\/[^\s)]+)\)/i)
  if (mdImgMatch && mdImgMatch[1]) return mdImgMatch[1]
  return null
}

function cleanSnippet(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/<img[^>]*>/gi, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/<pre[\s\S]*?<\/pre>/gi, '')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[*_#`~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function FeedAvatar({ src, username, size = 38 }) {
  const [error, setError] = useState(false)

  if (src && !error) {
    return (
      <img
        src={src}
        alt={username || 'Member'}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          objectFit: 'cover',
          flexShrink: 0
        }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(username),
        color: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: '0.85rem',
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

export default function ForYou() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [feedTab, setFeedTab] = useState('for-you')
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [toastText, setToastText] = useState('')
  const [bookmarkedMap, setBookmarkedMap] = useState({})
  const [feedSeed, setFeedSeed] = useState(() => Math.floor(Math.random() * 1000000))

  const showToast = (msg) => {
    setToastText(msg)
    setTimeout(() => setToastText(''), 2500)
  }

  const loadFeed = useCallback(async (tab, seed) => {
    setLoading(true)
    try {
      let res

      if (tab === 'for-you') {
        res = await postsApi.feed({ limit: 25, seed })
      } else {
        let params = { limit: 25 }
        if (tab === 'trending') {
          params.sort = 'hot'
        } else if (tab === 'latest') {
          params.sort = 'new'
        } else if (tab === 'top') {
          params.sort = 'top'
        }
        res = await postsApi.list(params)
      }

      if (res && Array.isArray(res.posts)) {
        setPosts(res.posts)
        const initialBookmarks = {}
        res.posts.forEach((p) => {
          const pid = p._id || p.id
          if (p.isBookmarked) initialBookmarks[pid] = true
        })
        setBookmarkedMap(initialBookmarks)
      } else {
        setPosts([])
      }
    } catch {
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadFeed(feedTab, feedSeed)
  }, [feedTab, feedSeed, loadFeed])

  const handleShare = async (e, postId) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}/forum/posts/${postId}`
    try {
      await navigator.clipboard.writeText(url)
      showToast('Discussion link copied to clipboard!')
    } catch {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      showToast('Discussion link copied to clipboard!')
    }
  }

  const handleToggleBookmark = async (e, postId) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }

    const current = !!bookmarkedMap[postId]
    setBookmarkedMap((prev) => ({ ...prev, [postId]: !current }))
    try {
      await postsApi.bookmark(postId)
      showToast(!current ? 'Saved to bookmarks!' : 'Removed from bookmarks')
    } catch {
      setBookmarkedMap((prev) => ({ ...prev, [postId]: current }))
      showToast('Failed to update bookmark')
    }
  }

  return (
    <div className="foryou-page-container">
      <div className="foryou-feed-col">
        <div className="foryou-filter-bar">
          <button
            type="button"
            className={`foryou-tab-btn ${feedTab === 'for-you' ? 'is-active' : ''}`}
            onClick={() => setFeedTab('for-you')}
          >
            <Sparkles size={16} /> For You
          </button>
          <button
            type="button"
            className={`foryou-tab-btn ${feedTab === 'trending' ? 'is-active' : ''}`}
            onClick={() => setFeedTab('trending')}
          >
            <Flame size={16} /> Trending
          </button>
          <button
            type="button"
            className={`foryou-tab-btn ${feedTab === 'latest' ? 'is-active' : ''}`}
            onClick={() => setFeedTab('latest')}
          >
            <Clock size={16} /> Latest
          </button>
          <button
            type="button"
            className={`foryou-tab-btn ${feedTab === 'top' ? 'is-active' : ''}`}
            onClick={() => setFeedTab('top')}
          >
            <Award size={16} /> Top Ranked
          </button>
          {feedTab === 'for-you' && (
            <button
              type="button"
              className="foryou-tab-btn foryou-refresh-btn"
              onClick={() => setFeedSeed(Math.floor(Math.random() * 1000000))}
              title="Shuffle feed"
            >
              <RefreshCw size={15} />
            </button>
          )}
        </div>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {[1, 2, 3].map((n) => (
              <div key={n} className="foryou-card foryou-skeleton-card">
                <div className="foryou-skel-header">
                  <div className="foryou-skel-avatar glug-skeleton-shimmer" />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '160px' }}>
                    <div className="foryou-skel-line glug-skeleton-shimmer" style={{ width: '120px' }} />
                    <div className="foryou-skel-line glug-skeleton-shimmer" style={{ width: '70px', height: '10px' }} />
                  </div>
                </div>
                <div className="foryou-skel-line glug-skeleton-shimmer" style={{ width: '85%', height: '22px' }} />
                <div className="foryou-skel-line glug-skeleton-shimmer" style={{ width: '95%' }} />
                <div className="foryou-skel-line glug-skeleton-shimmer" style={{ width: '70%' }} />
                <div className="foryou-skel-media glug-skeleton-shimmer" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="foryou-card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Compass size={44} style={{ color: 'var(--text-dim)', marginBottom: '0.85rem' }} />
            <h3 style={{ margin: '0 0 0.5rem', color: 'var(--text)' }}>No posts in your feed</h3>
            <p style={{ color: 'var(--text-muted)', margin: '0 0 1.25rem' }}>
              Check back soon or explore the community discussion boards.
            </p>
            <Link to="/forum" className="not-found-btn not-found-btn-primary" style={{ display: 'inline-flex' }}>
              Browse Discussions
            </Link>
          </div>
        ) : (
          posts.map((post) => {
            const pid = post._id || post.id
            const firstImg = extractFirstImage(post.body)
            const snippet = cleanSnippet(post.body)
            const author = post.author?.username || 'member'
            const authorAvatar = post.author?.avatar
            const timeAgo = formatRelativeTime(post.createdAt)
            const isBookmarked = !!bookmarkedMap[pid]
            const commentCount = post.commentCount ?? (post.comments ? post.comments.length : 0)

            return (
              <article key={pid} className="foryou-card">
                <div className="foryou-card-header">
                  <div className="foryou-author-meta">
                    <Link to={`/profile/${encodeURIComponent(author)}`} className="foryou-avatar-link">
                      <FeedAvatar src={authorAvatar} username={author} size={36} />
                    </Link>
                    <div className="foryou-author-info">
                      <Link to={`/forum?category=${encodeURIComponent(post.category || 'general')}`} className="foryou-category-pill">
                        {post.category || 'General'}
                      </Link>
                      <span className="foryou-meta-dot">·</span>
                      <Link to={`/profile/${encodeURIComponent(author)}`} className="foryou-author-name">
                        {author}
                      </Link>
                      <span className="foryou-meta-dot">·</span>
                      <span className="foryou-timestamp">{timeAgo}</span>
                    </div>
                  </div>

                  {post.isPinned && (
                    <span className="foryou-pinned-badge">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                </div>

                <Link to={`/forum/posts/${pid}`} className="foryou-title-link">
                  <h2 className="foryou-post-title">{post.title}</h2>
                </Link>

                {snippet && <p className="foryou-post-body">{snippet}</p>}

                {firstImg && (
                  <div
                    className="foryou-media-wrap"
                    onClick={() => navigate(`/forum/posts/${pid}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') navigate(`/forum/posts/${pid}`)
                    }}
                  >
                    <img
                      src={firstImg}
                      alt={post.title}
                      loading="lazy"
                      className="foryou-media-img"
                    />
                  </div>
                )}

                {post.tags && post.tags.length > 0 && (
                  <div className="foryou-tags-wrap">
                    {post.tags.slice(0, 4).map((t) => (
                      <span key={t} className="foryou-tag-item">
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                <div className="foryou-actions-bar">
                  <VoteButtons
                    postId={pid}
                    initialScore={post.voteScore || 0}
                    initialVote={post.userVote || 0}
                    orientation="horizontal"
                  />

                  <Link to={`/forum/posts/${pid}`} className="foryou-action-pill">
                    <MessageSquare size={15} />
                    <span>{commentCount}</span>
                  </Link>

                  <button
                    type="button"
                    className="foryou-action-pill"
                    onClick={(e) => handleShare(e, pid)}
                    title="Share discussion"
                  >
                    <Share2 size={15} />
                    <span>Share</span>
                  </button>

                  <button
                    type="button"
                    className={`foryou-action-pill ${isBookmarked ? 'is-active' : ''}`}
                    onClick={(e) => handleToggleBookmark(e, pid)}
                    title={isBookmarked ? 'Remove bookmark' : 'Save discussion'}
                  >
                    <Bookmark size={15} fill={isBookmarked ? 'currentColor' : 'none'} />
                    <span>{isBookmarked ? 'Saved' : 'Save'}</span>
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>

      <aside className="foryou-sidebar-col">
        <div className="foryou-sidebar-widget">
          <h4 className="widget-title-row">
            <Sparkles size={17} style={{ color: '#60a5fa' }} /> Community Feed
          </h4>
          <p className="widget-text">
            Welcome to the GLUG community stream! Discover trending open source discussions, terminal tutorials, and project showcases.
          </p>
        </div>

        <div className="foryou-sidebar-widget">
          <h4 className="widget-title-row">
            <Flame size={17} style={{ color: '#f97316' }} /> Popular Topics
          </h4>
          <div className="widget-tags-list">
            {['linux', 'devops', 'docker', 'neovim', 'bash', 'wasm', 'git', 'kernel', 'python'].map((tag) => (
              <button
                type="button"
                key={tag}
                className="widget-tag-btn"
                onClick={() => navigate(`/forum?tag=${encodeURIComponent(tag)}`)}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {toastText && <div className="foryou-toast">{toastText}</div>}
    </div>
  )
}
