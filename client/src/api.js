// ── Local mock store ────────────────────────────────────────────────────────
// Replaces the real server API with localStorage-backed data so the client
// works fully standalone. The interface (api.get / api.post) is unchanged.

const USERS_KEY  = 'mock_users'
const POSTS_KEY  = 'mock_posts'

// ── helpers ──────────────────────────────────────────────────────────────────
const load  = (key, def) => { try { return JSON.parse(localStorage.getItem(key)) || def } catch { return def } }
const save  = (key, val) => localStorage.setItem(key, JSON.stringify(val))
const uid   = () => Math.random().toString(36).slice(2, 10)
const now   = () => new Date().toISOString()
const delay = (ms = 150) => new Promise(r => setTimeout(r, ms))
const err   = (msg) => { throw new Error(msg) }

// ── seed demo data on first run ───────────────────────────────────────────────
function seed() {
  if (localStorage.getItem('mock_seeded')) return
  const demoUser = { id: uid(), username: 'glug_admin', email: 'admin@glug.dev', password: 'glug1234' }
  save(USERS_KEY, [demoUser])

  const posts = [
    {
      id: uid(),
      title: 'Welcome to the GLUG Community Forum!',
      body: 'This is a space to ask questions, share Linux tips, and connect with fellow students. Feel free to introduce yourself below!',
      category: 'general',
      username: 'glug_admin',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
      comments: [
        { id: uid(), body: 'Excited to be here! Just installed Arch Linux for the first time.', username: 'arch_newbie', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString() },
        { id: uid(), body: 'Great to have this platform. See you all at the next meeting!', username: 'tux_fan', created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      ],
    },
    {
      id: uid(),
      title: 'How do I set up SSH key authentication on Ubuntu?',
      body: 'I keep getting asked for a password every time I SSH into my VPS. How do I set up key-based auth so I don\'t need the password?',
      category: 'help',
      username: 'ssh_learner',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
      comments: [
        { id: uid(), body: 'Run `ssh-keygen` then `ssh-copy-id user@host`. Done!', username: 'glug_admin', created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString() },
      ],
    },
    {
      id: uid(),
      title: 'GLUG Linux Workshop – September Edition',
      body: 'We are hosting a hands-on Linux workshop next month! Topics: terminal basics, package managers, and scripting. All skill levels welcome. Drop a comment if you\'re interested.',
      category: 'events',
      username: 'glug_admin',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      comments: [],
    },
    {
      id: uid(),
      title: 'Bash vs Zsh – which shell do you use and why?',
      body: 'I recently switched to Zsh with Oh My Zsh and the autocompletion is fantastic. What\'s everyone else using?',
      category: 'linux',
      username: 'shellshock99',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      comments: [
        { id: uid(), body: 'Fish all the way! The syntax highlighting out of the box is unbeatable.', username: 'fishy_dev', created_at: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
      ],
    },
  ]
  save(POSTS_KEY, posts)
  localStorage.setItem('mock_seeded', '1')
}

seed()

// ── route handlers ────────────────────────────────────────────────────────────
function handle(method, path, body) {
  const users = load(USERS_KEY, [])
  const posts = load(POSTS_KEY, [])

  // POST /auth/register
  if (method === 'POST' && path === '/auth/register') {
    const { username, email, password } = body
    if (!username || !email || !password) err('All fields are required.')
    if (users.find(u => u.email === email)) err('An account with that email already exists.')
    if (users.find(u => u.username === username)) err('That username is already taken.')
    if (password.length < 6) err('Password must be at least 6 characters.')
    const user = { id: uid(), username, email, password }
    save(USERS_KEY, [...users, user])
    const { password: _p, ...safeUser } = user
    return { user: safeUser, token: 'local-mock-token' }
  }

  // POST /auth/login
  if (method === 'POST' && path === '/auth/login') {
    const { email, password } = body
    const user = users.find(u => u.email === email && u.password === password)
    if (!user) err('Invalid email or password.')
    const { password: _p, ...safeUser } = user
    return { user: safeUser, token: 'local-mock-token' }
  }

  // GET /posts or /posts?category=X
  if (method === 'GET' && path.startsWith('/posts') && !path.match(/\/posts\/\w+$/)) {
    const cat = new URLSearchParams(path.split('?')[1] || '').get('category')
    const filtered = cat ? posts.filter(p => p.category === cat) : posts
    const sorted = [...filtered].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    return sorted.map(({ comments, ...p }) => ({ ...p, comment_count: comments.length }))
  }

  // GET /posts/:id
  const detailMatch = path.match(/^\/posts\/(\w+)$/)
  if (method === 'GET' && detailMatch) {
    const post = posts.find(p => p.id === detailMatch[1])
    if (!post) err('Post not found.')
    const { comments, ...postData } = post
    return { post: { ...postData, comment_count: comments.length }, comments }
  }

  // POST /posts
  if (method === 'POST' && path === '/posts') {
    const { title, body: postBody, category } = body
    if (!title || !postBody || !category) err('Title, body and category are required.')
    const token = body._token
    const userStr = localStorage.getItem('glug_user')
    const currentUser = userStr ? JSON.parse(userStr) : null
    if (!currentUser) err('You must be logged in to post.')
    const newPost = { id: uid(), title, body: postBody, category, username: currentUser.username, created_at: now(), comments: [] }
    save(POSTS_KEY, [...posts, newPost])
    return newPost
  }

  // POST /posts/:id/comments
  const commentMatch = path.match(/^\/posts\/(\w+)\/comments$/)
  if (method === 'POST' && commentMatch) {
    const postIndex = posts.findIndex(p => p.id === commentMatch[1])
    if (postIndex === -1) err('Post not found.')
    const userStr = localStorage.getItem('glug_user')
    const currentUser = userStr ? JSON.parse(userStr) : null
    if (!currentUser) err('You must be logged in to comment.')
    const comment = { id: uid(), body: body.body, username: currentUser.username, created_at: now() }
    posts[postIndex].comments.push(comment)
    save(POSTS_KEY, posts)
    return comment
  }

  err(`Unhandled route: ${method} ${path}`)
}

// ── public api object (same interface as before) ──────────────────────────────
export const api = {
  get:  async (path)        => { await delay(); return handle('GET',  path, {}) },
  post: async (path, body)  => { await delay(); return handle('POST', path, body || {}) },
}