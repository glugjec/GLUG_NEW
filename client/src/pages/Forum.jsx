import { useEffect, useState, useCallback, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { postsApi } from '../api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import { formatRelativeTime } from '../utils/timeAgo.js'
import MarkdownRenderer from '../components/common/MarkdownRenderer.jsx'
import RichTextEditor from '../components/common/RichTextEditor.jsx'
import {
  Plus,
  ArrowUp,
  MessageSquare,
  Eye,
  Terminal,
  Code2,
  Settings,
  Flame,
  HelpCircle,
  Pin,
  TrendingUp,
  Clock,
  Bookmark,
  User,
  Layers,
  ArrowRight,
  Send,
  X,
  Loader2,
  Sparkles,
  Tag,
  AlertCircle
} from 'lucide-react'
import './Forum.css'

const CATEGORIES_LIST = [
  { id: 'linux', name: 'Linux', count: 120, icon: 'tux', color: '#eab308' },
  { id: 'installation', name: 'Installation', count: 86, icon: 'settings', color: '#3b82f6' },
  { id: 'command-line', name: 'Command Line', count: 95, icon: 'terminal', color: '#10b981' },
  { id: 'programming', name: 'Programming', count: 78, icon: 'code', color: '#a855f7' },
  { id: 'open-source', name: 'Open Source', count: 64, icon: 'git-fork', color: '#f43f5e' },
  { id: 'tools-apps', name: 'Tools & Apps', count: 52, icon: 'box', color: '#06b6d4' },
  { id: 'events', name: 'Events', count: 34, icon: 'calendar', color: '#ef4444' },
  { id: 'general', name: 'General Discussion', count: 47, icon: 'users', color: '#8b5cf6' },
  { id: 'help', name: 'Help & Support', count: 90, icon: 'help', color: '#22c55e' },
]

const TRENDING_TOPICS = [
  { id: 'distro-2025', rank: 1, title: 'Best Linux distro for beginners?', replies: 32 },
  { id: 'useful-cmds', rank: 2, title: 'Useful terminal commands', replies: 24 },
  { id: 'gluginit-plan', rank: 3, title: 'Planning GLUGINIT', replies: 18 },
  { id: 'dual-boot', rank: 4, title: 'Dual boot Ubuntu with Windows 11', replies: 8 },
  { id: 'os-alts', rank: 5, title: 'Open source alternatives', replies: 9 },
]

const DEFAULT_POSTS = [
  {
    id: 'welcome-glug',
    isPinned: true,
    title: 'Welcome to GLUG! 👏',
    body: 'Introduce yourself, read community guidelines, and start your open source journey with us...',
    category: 'announcement',
    tags: ['Announcement'],
    voteScore: 56,
    commentCount: 24,
    views: '1.2K',
    author: { username: 'admin' },
    timeAgo: '2 days ago',
    iconType: 'pin',
    iconBg: '#1e3a8a',
    iconColor: '#60a5fa'
  },
  {
    id: 'distro-2025',
    isPinned: false,
    title: 'Best Linux distro for beginners in 2025?',
    body: "I'm new to Linux. Which distro would you recommend for a student user with minimal terminal experience?",
    category: 'linux',
    tags: ['Linux', 'Beginner'],
    voteScore: 32,
    commentCount: 12,
    views: '245',
    author: { username: 'ananya' },
    timeAgo: '5 min ago',
    iconType: 'tux',
    iconBg: '#422006',
    iconColor: '#facc15'
  },
  {
    id: 'dual-boot',
    isPinned: false,
    title: 'How to dual boot Ubuntu with Windows 11?',
    body: 'Stuck at GRUB screen. Need help with EFI partitioning and secure boot setup on my ThinkPad.',
    category: 'installation',
    tags: ['Installation', 'Support'],
    voteScore: 18,
    commentCount: 8,
    views: '160',
    author: { username: 'rishabh' },
    timeAgo: '1 hour ago',
    iconType: 'terminal',
    iconBg: '#022c22',
    iconColor: '#34d399'
  },
  {
    id: 'useful-cmds',
    isPinned: false,
    title: 'Useful terminal commands everyone should know',
    body: 'Let\'s compile a list of must-know terminal commands for daily development, file management, and networking.',
    category: 'command-line',
    tags: ['Tips & Tricks', 'Command Line'],
    voteScore: 45,
    commentCount: 24,
    views: '398',
    author: { username: 'devansh' },
    timeAgo: '3 hours ago',
    iconType: 'code',
    iconBg: '#3b0764',
    iconColor: '#c084fc'
  },
  {
    id: 'sys-prog',
    isPinned: false,
    title: 'Resources to learn system programming',
    body: 'Share your favorite books, courses, and resources for learning system programming with C and Linux internals.',
    category: 'programming',
    tags: ['Programming', 'Resources'],
    voteScore: 27,
    commentCount: 15,
    views: '312',
    author: { username: 'kaustubh' },
    timeAgo: 'by isha ago',
    iconType: 'settings',
    iconBg: '#1e3a8a',
    iconColor: '#60a5fa'
  },
  {
    id: 'dev-env',
    isPinned: false,
    title: 'Setting up a development environment on Linux',
    body: 'What tools and configurations do you use for a smooth development experience on Debian / Arch?',
    category: 'programming',
    tags: ['Development', 'Setup'],
    voteScore: 19,
    commentCount: 11,
    views: '210',
    author: { username: 'isha' },
    timeAgo: '6 hours ago',
    iconType: 'screen',
    iconBg: '#1e1b4b',
    iconColor: '#818cf8'
  },
  {
    id: 'os-alts',
    isPinned: false,
    title: 'Best open source alternatives for popular apps',
    body: 'Share your favorite open source replacements for daily software tools like Photoshop, Office, and Notion.',
    category: 'tools-apps',
    tags: ['Applications', 'Discussion'],
    voteScore: 14,
    commentCount: 9,
    views: '189',
    author: { username: 'tarun' },
    timeAgo: '8 hours ago',
    iconType: 'game',
    iconBg: '#064e3b',
    iconColor: '#10b981'
  },
  {
    id: 'gluginit-plan',
    isPinned: false,
    title: 'Planning GLUGINIT – Linux Installation Drive',
    body: 'Let\'s discuss preparations, volunteers, distro flash drives, and the schedule for the annual installation drive.',
    category: 'events',
    tags: ['Events', 'GLUG'],
    voteScore: 21,
    commentCount: 18,
    views: '521',
    author: { username: 'team-glug' },
    timeAgo: '1 day ago',
    iconType: 'users',
    iconBg: '#1d4ed8',
    iconColor: '#93c5fd'
  },
  {
    id: 'beginner-projects',
    isPinned: false,
    title: 'Cool projects to contribute to as a beginner',
    body: 'Looking for beginner-friendly open source projects with "good-first-issue" tags. Any suggestions?',
    category: 'projects',
    tags: ['Open Source', 'Projects'],
    voteScore: 17,
    commentCount: 13,
    views: '276',
    author: { username: 'meera' },
    timeAgo: '1 day ago',
    iconType: 'bulb',
    iconBg: '#78350f',
    iconColor: '#f59e0b'
  },
  {
    id: 'kernel-processes',
    isPinned: false,
    title: 'How does the Linux kernel handle processes?',
    body: 'I\'m trying to understand process scheduling in the Linux kernel. Can anyone share insights on CFS?',
    category: 'help',
    tags: ['Kernel', 'Discussion'],
    voteScore: 11,
    commentCount: 7,
    views: '143',
    author: { username: 'arjun' },
    timeAgo: '1 day ago',
    iconType: 'help',
    iconBg: '#1e3a8a',
    iconColor: '#60a5fa'
  }
]

function renderPostIcon(type) {
  if (type === 'pin') return <Pin size={17} />
  if (type === 'tux') {
    return (
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
      </svg>
    )
  }
  if (type === 'terminal') return <Terminal size={17} />
  if (type === 'code') return <Code2 size={17} />
  if (type === 'settings') return <Settings size={17} />
  if (type === 'screen') return <Layers size={17} />
  if (type === 'game') return <Flame size={17} />
  if (type === 'bulb') return <Flame size={17} />
  return <HelpCircle size={17} />
}

function UserAvatar({ src, username, size = 30 }) {
  const [error, setError] = useState(false)
  if (src && !error) {
    return (
      <img
        src={src}
        alt={username || 'User'}
        referrerPolicy="no-referrer"
        crossOrigin="anonymous"
        onError={() => setError(true)}
        className="author-avatar-img"
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    )
  }
  return (
    <div
      className="author-avatar-circle"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: avatarColor(username),
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `${Math.round(size * 0.4)}px`,
        fontWeight: 700,
        flexShrink: 0
      }}
    >
      {avatarInitials(username)}
    </div>
  )
}

function cleanPreviewText(text) {
  if (!text) return ''
  return text
    .replace(/<img[^>]*>/gi, ' 📷 [Image] ')
    .replace(/!\[.*?\]\(.*?\)/g, ' 📷 [Image] ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/[`#*~_>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function PostTags({ tags }) {
  const containerRef = useRef(null)
  const [maxVisible, setMaxVisible] = useState(tags?.length || 1)

  useEffect(() => {
    const el = containerRef.current
    if (!el || !tags || tags.length === 0) return

    const checkFit = () => {
      const parent = el.parentElement
      if (!parent) return
      const titleEl = parent.querySelector('.forum-post-title')
      const totalWidth = parent.clientWidth
      const titleWidth = titleEl ? Math.min(titleEl.scrollWidth, totalWidth * 0.6) : 0
      const available = Math.max(60, totalWidth - titleWidth - 16)

      let currentWidth = 0
      let count = 0
      for (let i = 0; i < tags.length; i++) {
        const tagText = tags[i] || ''
        const tagW = Math.min(115, Math.max(45, tagText.length * 7.2 + 22))
        const badgeW = i < tags.length - 1 ? 36 : 0
        if (currentWidth + tagW + badgeW <= available) {
          currentWidth += tagW
          count++
        } else {
          break
        }
      }
      setMaxVisible(Math.max(1, count))
    }

    checkFit()
    const ro = new ResizeObserver(checkFit)
    if (el.parentElement) ro.observe(el.parentElement)
    return () => ro.disconnect()
  }, [tags])

  if (!tags || tags.length === 0) return null

  const visible = tags.slice(0, maxVisible)
  const hiddenCount = tags.length - maxVisible

  return (
    <div ref={containerRef} className="forum-post-tags">
      {visible.map((t) => (
        <span key={t} className="forum-post-tag" title={t}>
          {t}
        </span>
      ))}
      {hiddenCount > 0 && (
        <span className="forum-post-tag tag-more-count" title={tags.slice(maxVisible).join(', ')}>
          +{hiddenCount}
        </span>
      )}
    </div>
  )
}

export default function Forum() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState('latest')
  const selectedCategory = searchParams.get('category') || ''
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('linux')
  const [newTags, setNewTags] = useState('')
  const [newBody, setNewBody] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [imageUploading, setImageUploading] = useState(false)

  const loadPosts = useCallback(
    async (catToFetch) => {
      setLoading(true)
      try {
        const params = { limit: 20 }
        if (catToFetch) params.category = catToFetch
        if (activeTab === 'latest') params.sort = 'new'
        if (activeTab === 'trending') params.sort = 'hot'
        if (activeTab === 'unanswered') params.tab = 'unanswered'
        if (activeTab === 'my-posts') {
          if (!user) {
            setPosts([])
            setLoading(false)
            return
          }
          params.tab = 'my-posts'
        }
        if (activeTab === 'bookmarks') {
          if (!user) {
            setPosts([])
            setLoading(false)
            return
          }
          params.tab = 'bookmarks'
        }

        const res = await postsApi.list(params)
        if (res?.posts && res.posts.length > 0) {
          const mapped = res.posts.map((p, idx) => ({
            id: p._id || p.id,
            isPinned: p.isPinned,
            title: p.title,
            body: p.body,
            category: p.category || 'general',
            tags: p.tags?.length ? p.tags : [p.category || 'General'],
            voteScore: Math.max(0, p.voteScore || 0),
            commentCount: p.commentCount ?? (p.comments ? p.comments.length : 0),
            views: p.views ?? 0,
            author: {
              username: p.author?.username || 'member',
              avatar: p.author?.avatar
            },
            userVote: p.userVote || 0,
            isBookmarked: !!p.isBookmarked,
            timeAgo: formatRelativeTime(p.createdAt),
            iconType: ['tux', 'terminal', 'code', 'settings', 'screen'][idx % 5],
            iconBg: ['#422006', '#022c22', '#3b0764', '#1e3a8a', '#1e1b4b'][idx % 5],
            iconColor: ['#facc15', '#34d399', '#c084fc', '#60a5fa', '#818cf8'][idx % 5]
          }))
          setPosts(mapped)
        } else if (!catToFetch && activeTab === 'latest' && (!res?.posts || res.posts.length === 0)) {
          setPosts(DEFAULT_POSTS)
        } else {
          setPosts([])
        }
      } catch {
        if (!catToFetch && activeTab === 'latest') {
          setPosts(DEFAULT_POSTS)
        } else {
          setPosts([])
        }
      } finally {
        setLoading(false)
      }
    },
    [activeTab, user]
  )

  const handleClearCategory = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const handleSelectCategory = useCallback(
    (catId) => {
      if (selectedCategory === catId) {
        setSearchParams({})
      } else {
        setSearchParams({ category: catId })
      }
    },
    [selectedCategory, setSearchParams]
  )

  const handleOpenNewPost = useCallback(
    (categoryOverride) => {
      if (!user) {
        navigate('/login')
        return
      }
      const catToUse = categoryOverride || selectedCategory || 'linux'
      const isValid = CATEGORIES_LIST.some((c) => c.id === catToUse)
      setNewCategory(isValid ? catToUse : 'linux')
      setShowModal(true)
    },
    [user, selectedCategory, navigate]
  )

  useEffect(() => {
    loadPosts(selectedCategory)
  }, [selectedCategory, activeTab, loadPosts])

  const handleVote = async (e, post) => {
    e.stopPropagation()
    if (!user) {
      navigate('/login')
      return
    }
    const currentVote = post.userVote || 0
    const nextVote = currentVote === 1 ? 0 : 1
    const diff = nextVote - currentVote

    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, voteScore: Math.max(0, (p.voteScore || 0) + diff), userVote: nextVote }
          : p
      )
    )

    try {
      const res = await postsApi.vote(post.id, nextVote)
      if (res && typeof res.voteScore === 'number') {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id
              ? { ...p, voteScore: Math.max(0, res.voteScore), userVote: res.userVote }
              : p
          )
        )
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, voteScore: Math.max(0, (p.voteScore || 0) - diff), userVote: currentVote }
            : p
        )
      )
    }
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (submitting || imageUploading) return
    const hasContent = newBody.replace(/<[^>]*>/g, '').trim().length > 0 || newBody.includes('<img')
    if (!newTitle.trim() || !hasContent) {
      setUploadError('Please provide a title and discussion content.')
      return
    }
    setSubmitting(true)
    try {
      const tagList = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
      const res = await postsApi.create({
        title: newTitle.trim(),
        body: newBody.trim(),
        category: newCategory,
        tags: tagList.length ? tagList : [newCategory]
      })
      setShowModal(false)
      setNewTitle('')
      setNewBody('')
      setNewTags('')
      setUploadError('')
      if (res?.post) {
        navigate(`/forum/posts/${res.post._id || res.post.id}`)
      } else {
        loadPosts(selectedCategory)
      }
    } catch (err) {
      setUploadError(err.message || 'Failed to create discussion')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="forum-page-container">
      <div className="forum-main-content">
        <div className="forum-hero-banner">
          <div className="forum-hero-text">
            <span className="forum-hero-tag">DISCUSSIONS</span>
            <h1 className="forum-hero-title">Community Discussions</h1>
            <p className="forum-hero-desc">
              Ask questions, share knowledge, help others, and be part of the GLUG community.
            </p>
            <button
              type="button"
              className="forum-hero-new-btn"
              onClick={() => handleOpenNewPost()}
            >
              <Plus size={18} /> New Post
            </button>
          </div>

          <div className="forum-hero-banner-bg">
            <img
              src="/discussionbanner.png"
              alt="GLUG Discussions Banner"
              className="forum-hero-banner-img"
            />
          </div>
        </div>

        <div className="forum-filter-tabs">
          <button
            type="button"
            className={`forum-tab-btn ${activeTab === 'latest' ? 'is-active' : ''}`}
            onClick={() => {
              setActiveTab('latest')
              setSearchParams({})
            }}
          >
            Latest
          </button>
          <button
            type="button"
            className={`forum-tab-btn ${activeTab === 'trending' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('trending')}
          >
            Trending
          </button>
          <button
            type="button"
            className={`forum-tab-btn ${activeTab === 'unanswered' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('unanswered')}
          >
            Unanswered
          </button>
          <button
            type="button"
            className={`forum-tab-btn ${activeTab === 'my-posts' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('my-posts')}
          >
            My Posts
          </button>
          <button
            type="button"
            className={`forum-tab-btn ${activeTab === 'bookmarks' ? 'is-active' : ''}`}
            onClick={() => setActiveTab('bookmarks')}
          >
            Bookmarks
          </button>
        </div>

        {selectedCategory && (
          <div className="active-cat-pill-bar">
            <span>Filtered by: <strong>{selectedCategory}</strong></span>
            <button
              type="button"
              className="clear-cat-btn"
              onClick={handleClearCategory}
            >
              <X size={14} /> Clear
            </button>
          </div>
        )}

        <div className="forum-posts-stream">
          {loading ? (
            <div className="forum-skeleton-list">
              {[1, 2, 3, 4, 5].map((n) => (
                <div key={n} className="forum-post-row forum-post-skeleton">
                  <div className="skeleton-vote-box" />
                  <div className="skeleton-icon-box" />
                  <div className="skeleton-content-box">
                    <div className="skeleton-line skeleton-title" />
                    <div className="skeleton-line skeleton-body" />
                  </div>
                </div>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div className="forum-empty-card">
              {activeTab === 'bookmarks' ? (
                !user ? (
                  <>
                    <Bookmark size={32} className="forum-empty-icon" />
                    <h3>Sign in to view bookmarks</h3>
                    <p>Save interesting discussions to easily find and review them later.</p>
                    <button
                      type="button"
                      className="forum-empty-new-btn"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    <Bookmark size={32} className="forum-empty-icon" />
                    <h3>No bookmarks yet</h3>
                    <p>Bookmark discussions across the forum to revisit them here anytime.</p>
                    <button
                      type="button"
                      className="forum-empty-new-btn"
                      onClick={() => setActiveTab('latest')}
                    >
                      Explore Discussions
                    </button>
                  </>
                )
              ) : activeTab === 'my-posts' ? (
                !user ? (
                  <>
                    <User size={32} className="forum-empty-icon" />
                    <h3>Sign in to view your posts</h3>
                    <p>Track discussions and questions you have shared with the community.</p>
                    <button
                      type="button"
                      className="forum-empty-new-btn"
                      onClick={() => navigate('/login')}
                    >
                      Sign In
                    </button>
                  </>
                ) : (
                  <>
                    <MessageSquare size={32} className="forum-empty-icon" />
                    <h3>No discussions yet</h3>
                    <p>You haven't started any discussions in this section yet.</p>
                    <button
                      type="button"
                      className="forum-empty-new-btn"
                      onClick={() => handleOpenNewPost(selectedCategory)}
                    >
                      <Plus size={16} /> New Post
                    </button>
                  </>
                )
              ) : activeTab === 'unanswered' ? (
                <>
                  <MessageSquare size={32} className="forum-empty-icon" />
                  <h3>No unanswered discussions</h3>
                  <p>All questions in this section have received at least one response.</p>
                  <button
                    type="button"
                    className="forum-empty-new-btn"
                    onClick={() => setActiveTab('latest')}
                  >
                    View All Discussions
                  </button>
                </>
              ) : (
                <>
                  <MessageSquare size={32} className="forum-empty-icon" />
                  <h3>No discussions found</h3>
                  <p>Be the first to start a conversation in this category!</p>
                  <button
                    type="button"
                    className="forum-empty-new-btn"
                    onClick={() => handleOpenNewPost(selectedCategory)}
                  >
                    <Plus size={16} /> New Post
                  </button>
                </>
              )}
            </div>
          ) : (
            posts.map((post) => (
              <div
                key={post.id}
                className={`forum-post-row ${post.isPinned ? 'is-pinned-row' : ''}`}
                onClick={() => navigate(`/forum/posts/${post.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/forum/posts/${post.id}`)
                }}
              >
                <button
                  type="button"
                  className={`forum-vote-box ${post.userVote === 1 ? 'voted-up' : ''}`}
                  onClick={(e) => handleVote(e, post)}
                  title={post.userVote === 1 ? 'Upvoted (click to remove)' : 'Upvote'}
                  aria-pressed={post.userVote === 1}
                >
                  <ArrowUp size={16} className="vote-arrow" strokeWidth={post.userVote === 1 ? 2.8 : 2} />
                  <span className="vote-score">{Math.max(0, post.voteScore || 0)}</span>
                </button>

                <div
                  className="forum-post-icon"
                  style={{ background: post.iconBg || '#1e293b', color: post.iconColor || '#94a3b8' }}
                >
                  {renderPostIcon(post.iconType)}
                </div>

                <div className="forum-post-center">
                  <div className="forum-post-header">
                    <h3 className="forum-post-title">{post.title}</h3>
                    <PostTags tags={post.tags} />
                  </div>
                  <p className="forum-post-body-preview">{cleanPreviewText(post.body)}</p>
                </div>

                <div className="forum-post-metrics">
                  <span className="metric-item">
                    <MessageSquare size={14} /> {post.commentCount || 0}
                  </span>
                  <span className="metric-item">
                    <Eye size={14} /> {post.views || 0}
                  </span>
                </div>

                <div
                  className="forum-post-author"
                  onClick={(e) => {
                    if (post.author?.username) {
                      e.stopPropagation()
                      navigate(`/profile/${encodeURIComponent(post.author.username)}`)
                    }
                  }}
                  title={post.author?.username ? `View ${post.author.username}'s profile` : ''}
                >
                  <UserAvatar
                    src={post.author?.avatar}
                    username={post.author?.username}
                    size={30}
                  />
                  <div className="author-meta">
                    <span className="author-name">by {post.author?.username}</span>
                    <span className="author-time">{post.timeAgo}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <aside className="forum-sidebar-widgets">
        <div className="forum-widget-card categories-widget">
          <div className="widget-header-row">
            <h4 className="widget-card-title">Categories</h4>
            <Link to="/categories" className="widget-view-all">
              View all <ArrowRight size={13} />
            </Link>
          </div>

          <div className="cat-sidebar-list">
            {CATEGORIES_LIST.map((c) => (
              <button
                type="button"
                key={c.id}
                className={`cat-sidebar-item ${selectedCategory === c.id ? 'is-selected' : ''}`}
                onClick={() => handleSelectCategory(c.id)}
              >
                <div className="cat-item-left">
                  <span className="cat-bullet" style={{ color: c.color }}>
                    {c.icon === 'tux' ? (
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
                      </svg>
                    ) : (
                      <Layers size={15} />
                    )}
                  </span>
                  <span className="cat-item-name">{c.name}</span>
                </div>
                <span className="cat-item-count">{c.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="forum-widget-card trending-widget">
          <div className="widget-header-row">
            <h4 className="widget-card-title">🔥 Trending This Week</h4>
            <span className="widget-view-all">View all <ArrowRight size={13} /></span>
          </div>

          <div className="trending-list">
            {TRENDING_TOPICS.map((t) => (
              <div
                key={t.id}
                className="trending-item"
                onClick={() => navigate(`/forum/posts/${t.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') navigate(`/forum/posts/${t.id}`)
                }}
              >
                <div className="trending-rank-badge">{t.rank}</div>
                <div className="trending-info">
                  <h5 className="trending-title">{t.title}</h5>
                  <span className="trending-replies">{t.replies} replies</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="forum-widget-card quote-sunset-card">
          <div className="quote-text-group">
            <p className="quote-main">Students Build a More Open Tomorrow.</p>
            <span className="quote-by">— GLUG</span>
          </div>
          <div className="quote-sunset-art">
            <svg viewBox="0 0 160 70" preserveAspectRatio="none" className="sunset-svg">
              <circle cx="80" cy="65" r="35" fill="#f59e0b" opacity="0.3" />
              <polygon points="0,70 40,40 85,60 120,30 160,70" fill="#312e81" opacity="0.7" />
              <polygon points="0,70 50,55 90,45 135,55 160,70" fill="#1e1b4b" />
            </svg>
          </div>
        </div>
      </aside>

      {showModal && (
        <div
          className="forum-modal-backdrop"
          onClick={() => {
            setShowModal(false)
            setUploadError('')
          }}
        >
          <div className="forum-modal modern-discussion-modal" onClick={(e) => e.stopPropagation()}>
            <div className="forum-modal-header">
              <div className="modal-header-text">
                <div className="modal-header-badge">
                  <Sparkles size={14} />
                  <span>Start Discussion</span>
                </div>
                <h3 className="forum-modal-title">Create New Discussion</h3>
                <p className="modal-header-sub">Share code, ask troubleshooting questions, or write guides</p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => {
                  setShowModal(false)
                  setUploadError('')
                }}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreatePost} className="forum-modal-form">
              <div className="form-group">
                <div className="form-label-row">
                  <label className="form-label">Discussion Title</label>
                  <span className={`title-char-counter ${newTitle.length > 110 ? 'is-warning' : ''}`}>
                    {newTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. How to properly configure GRUB for Arch Linux & Windows 11"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  maxLength={120}
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-select"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                  >
                    {CATEGORIES_LIST.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Tags (comma-separated)</label>
                  <div className="tags-input-wrap">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Linux, DualBoot, GRUB, C++"
                      value={newTags}
                      onChange={(e) => setNewTags(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {newTags.trim() && (
                <div className="tag-chips-preview">
                  {newTags
                    .split(',')
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((t, idx) => (
                      <span key={idx} className="preview-tag-chip">
                        <Tag size={11} />
                        {t}
                      </span>
                    ))}
                </div>
              )}

              <div className="form-group editor-form-group">
                <label className="form-label">Discussion Content</label>
                <RichTextEditor
                  content={newBody}
                  onChange={setNewBody}
                  placeholder="Write your discussion content..."
                  minHeight="210px"
                  onError={(err) => setUploadError(err)}
                  onUploadingChange={setImageUploading}
                />

                {uploadError && (
                  <div className="editor-error-banner">
                    <AlertCircle size={14} />
                    <span>{uploadError}</span>
                  </div>
                )}
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => {
                    setShowModal(false)
                    setUploadError('')
                    setImageUploading(false)
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="modal-btn-submit"
                  disabled={
                    submitting ||
                    imageUploading ||
                    !newTitle.trim() ||
                    (!newBody.replace(/<[^>]*>/g, '').trim() && !newBody.includes('<img'))
                  }
                >
                  {submitting ? (
                    <>
                      <Loader2 size={15} className="spin-icon" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      <Send size={15} />
                      <span>Publish Discussion</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
