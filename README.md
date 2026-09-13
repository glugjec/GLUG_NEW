# GLUG — Student Technical Community & Open-Source Platform

An all-in-one technical platform and open-source collaboration hub built for the **GNU/Linux User Group (GLUG)**. Engineered with modern web standards to empower students and developers through real-world Linux practice, multi-language code compilation, community discussions, direct messaging, and curated learning roadmaps.

---

## Table of Contents

- [Platform Overview](#platform-overview)
- [Key Features](#key-features)
  - [1. In-Browser Linux Terminal & Virtual Filesystem](#1-in-browser-linux-terminal--virtual-filesystem)
  - [2. Multi-Language Web Compiler & IDE](#2-multi-language-web-compiler--ide)
  - [3. Technical Discussion Forum](#3-technical-discussion-forum)
  - [4. Protected Voting & Anti-Abuse Scoring](#4-protected-voting--anti-abuse-scoring)
  - [5. Direct Messaging & Team Communication](#5-direct-messaging--team-communication)
  - [6. Open-Source Resource Hub & Roadmaps](#6-open-source-resource-hub--roadmaps)
  - [7. Member Directory & Student Profiles](#7-member-directory--student-profiles)
  - [8. Admin Moderation & Analytics Dashboard](#8-admin-moderation--analytics-dashboard)
  - [9. Responsive & Mobile-First Design](#9-responsive--mobile-first-design)
- [Tech Stack](#tech-stack)
- [Directory Structure](#directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [1. Backend Setup](#1-backend-setup)
  - [2. Frontend Setup](#2-frontend-setup)
  - [3. Environment Variables Reference](#3-environment-variables-reference)
  - [4. Database Seeding](#4-database-seeding)
  - [5. Production Build](#5-production-build)
- [Complete API Reference](#complete-api-reference)
  - [Authentication (`/api/auth`)](#authentication-apiauth)
  - [Posts & Discussions (`/api/posts`)](#posts--discussions-apiposts)
  - [Comments & Replies (`/api/posts/:id/comments`)](#comments--replies-apipostsidcomments)
  - [Direct Messaging (`/api/chat`)](#direct-messaging-apichat)
  - [User Profiles & Terminal State (`/api/users`)](#user-profiles--terminal-state-apiusers)
  - [Admin Moderation (`/api/admin`)](#admin-moderation-apiadmin)
  - [Cloud Code Compilation (`/api/compile`)](#cloud-code-compilation-apicompile)
  - [Media Uploads (`/api/upload`)](#media-uploads-apiupload)
- [In-Browser Linux Terminal Command Reference](#in-browser-linux-terminal-command-reference)
- [Compiler Language & Runtime Matrix](#compiler-language--runtime-matrix)
- [Security & Data Integrity](#security--data-integrity)
- [Contributing](#contributing)
- [License](#license)

---

## Platform Overview

GLUG is designed to bridge the gap between theoretical classroom learning and practical development skills:
- **Zero Configuration**: Practice Unix/Linux commands and write code directly in the browser with no installation required.
- **Collaborative**: Ask technical questions, reply in nested threads, and share knowledge with peers.
- **Accessible Anywhere**: Designed mobile-first, ensuring desktop-grade features work smoothly on mobile devices and tablets.
- **Production Ready**: Robust authentication, rate limiting, sanitization, role-based access control, and fallback mechanisms for development.

---

## Key Features

### 1. In-Browser Linux Terminal & Virtual Filesystem
- **Full Virtual Filesystem (VFS)**: Complete directory structure (`/home/user`, `/etc`, `/var`, `/bin`, `/tmp`) supporting file creation, modification, deletion, and path traversal (`~`, `.`, `..`, absolute and relative paths).
- **35+ Unix Commands**: Core utilities including `ls`, `cd`, `pwd`, `cat`, `mkdir`, `rmdir`, `rm`, `touch`, `cp`, `mv`, `tree`, `find`, `grep`, `head`, `tail`, `wc`, `echo`, `chmod`, `curl`, `whoami`, `hostname`, `uname`, `date`, `history`, `clear`, `ps`, `kill`, `env`, `export`, `alias`, `unalias`, `man`, `neofetch`, `cowsay`, and `fortune`.
- **I/O Redirection & Pipes**: Supports standard piping (`|`), output redirection (`>`), and append redirection (`>>`).
- **Interactive Full-Screen `nano` Editor**: Realistic in-terminal text editor with keyboard navigation, status line, shortcuts (`Ctrl+O` save, `Ctrl+X` exit), and file persistence.
- **Embedded Python REPL Shell**: Run interactive Python scripts and expressions inside the terminal session.
- **Persistent Sessions**: For authenticated students, terminal filesystem state and command history sync seamlessly with MongoDB (`/api/users/me/terminal`).
- **Mobile Touch Toolbar**: Quick touch buttons for `Tab`, `Ctrl+C`, `Esc`, `Clear`, arrows, and common commands.

### 2. Multi-Language Web Compiler & IDE
- **Dual Execution Engine**:
  - **In-Browser Pyodide (WASM)**: Instant, zero-latency execution of Python code in a sandboxed WebAssembly runtime with full interactive `input()` support via synchronous prompt capturing.
  - **Cloud Judge0 CE Integration**: High-performance remote sandbox execution for C (GCC), C++ (G++), Java (OpenJDK), C# (Mono), Go, Rust, JavaScript (Node.js), and TypeScript.
- **Monaco Editor Integration**: Visual Studio Code editing engine with syntax highlighting, automatic indentation, bracket matching, line numbering, code formatting, and code download/upload.
- **Multi-File Workspace**: Tabbed file manager supporting file creation, switching, and closing inside the active session.
- **View Modes**: One-click toggling between **Split**, **Code Only**, and **Console Only** view modes.
- **Interactive Terminal & Stdin Stream**: Standard output (`stdout`), standard error (`stderr`), live execution status, interactive stdin input bar, execution timing, and clear logs functionality.
- **Customizable Environment**: Font size stepper, full-screen mode, keyboard execution shortcut (`Ctrl + Enter`), and dark-first palette.

### 3. Technical Discussion Forum
- **Categorized Discussion Boards**: Linux & Distros, Programming & Algorithms, Web Development, DevOps & Cloud, Security & CTF, College Projects, Hardware & IoT, Club Events, and General Q&A.
- **Tag Filtering & Search**: Instant real-time search across titles, content, tags, and authors with debounced querying.
- **Rich Text & Markdown Support**: Unified TipTap WYSIWYG editor and GitHub Flavored Markdown renderer with code syntax highlighting, blockquotes, tables, and image embedding.
- **Nested Threaded Comments**: Indented conversation trees with author badges, direct reply targets (`@username`), collapsible reply streams, and pagination.
- **Bookmarking & Saved Threads**: Save discussions for offline reference, accessible from student profiles and the quick-filter sidebar.

### 4. Protected Voting & Anti-Abuse Scoring
- **Zero-Floor Protection**: Discussion scores cannot be maliciously downvoted below zero.
- **One-Click Undo Toggling**: Clicking an active upvote or downvote gracefully cancels the vote and restores the score.
- **Optimistic UI with Request Debouncing**: Immediate interface feedback with background server synchronization.
- **Author Protection**: Users cannot vote on their own discussions or comments.

### 5. Direct Messaging & Team Communication
- **Student-to-Staff Messaging**: Contact community administrators, team leads, and moderators directly.
- **Conversation Management**: Chronological conversation list with last active message snippets and unread badge counters.
- **Live Message Streams**: Timestamped message histories with author verification and responsive chat windows.

### 6. Open-Source Resource Hub & Roadmaps
- **Structured Learning Paths**: Step-by-step guides for Linux System Administration, Git & GitHub Mastery, Modern Web Development, and Open-Source Contribution.
- **Distro Selection Matrix**: Beginner to advanced Linux distributions categorized by hardware requirements and use case (Ubuntu, Fedora, Arch, Debian, Mint).
- **Cheat Sheets**: Quick references for terminal shortcuts, Vim commands, Git workflows, and Docker fundamentals.

### 7. Member Directory & Student Profiles
- **Community Leaderboard**: Member rankings sorted by contributions, upvotes received, and community roles.
- **Customizable Profiles**: Profile avatars, bios, GitHub links, LinkedIn profiles, and technical skill tags.
- **Activity Timeline**: Tabs displaying authored discussions, posted replies, and bookmarked threads.

### 8. Admin Moderation & Analytics Dashboard
- **Club Metrics**: Real-time overview of total registered students, active discussions, total comments, and platform engagement.
- **Member Role Management**: Promote or demote users between `student` and `admin` roles.
- **Content Moderation**: Lock sensitive discussions to prevent spam replies, pin important announcements to the top of boards, and cascade-delete offensive content.

### 9. Responsive & Mobile-First Design
- **Adaptive Breakpoints**: Custom layouts tuned for small mobile phones (`<= 480px`), tablets & medium screens (`768px - 1024px`), and desktop monitors (`> 1024px`).
- **Mobile Slide-Out Drawer**: Global navigation drawer with backdrop blur, accessible hamburger trigger, and sticky bottom navigation.
- **Compiler Mobile Layout**: Touch-optimized view switcher, sticky compiler header, and touch-enabled scrolling (`touch-action: pan-y`).
- **Post Bottom Bar Optimization**: Single-line vote capsule, compact metrics, and share actions that never overlap or wrap awkwardly.

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| **React** | `19.2.8` | Core UI component framework |
| **Vite** | `8.2.1` | Build tool, HMR dev server, and bundler |
| **React Router** | `7.18.2` | Client-side routing and layout management |
| **Monaco Editor** | `0.56.0` | Code editor powering the online IDE |
| **TipTap Editor** | `3.31.3` | Rich text WYSIWYG editor for posts |
| **Lucide React** | `1.33.0` | Modern SVG icon system |
| **Marked** | `18.0.12` | Markdown parser for discussions |
| **DOMPurify** | `3.4.15` | XSS sanitization for user-generated content |
| **Axios** | `1.19.0` | Promise-based HTTP client with auth interceptors |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| **Node.js** | `>= 18.0.0` | ESM server runtime |
| **Express.js** | `4.19.2` | REST API routing and middleware framework |
| **MongoDB & Mongoose** | `8.24.4` | Database modeling, schemas, and queries |
| **mongodb-memory-server** | `10.4.3` | In-memory MongoDB for zero-config local dev |
| **JWT (jsonwebtoken)** | `9.0.2` | Stateless authentication tokens |
| **bcryptjs** | `2.4.3` | Password hashing with cryptographic salts |
| **Google Auth Library** | `9.15.1` | Google OAuth 2.0 token verification |
| **Helmet** | `8.3.0` | HTTP security headers |
| **Express Rate Limit** | `7.5.1` | Brute force & DDoS protection |
| **Express Validator** | `7.3.2` | Request validation and sanitization |
| **Multer & Cloudinary** | `2.3.0 / 2.11.0` | Media upload processing and cloud storage |

---

## Directory Structure

```
GLUG_NEW/
├── client/
│   ├── public/                    # Static assets, brand logos, default avatars
│   ├── src/
│   │   ├── api.js                 # Centralized Axios client & API helpers
│   │   ├── App.jsx                # Application root with route registry
│   │   ├── index.css              # Global styles, CSS design tokens, responsive rules
│   │   ├── main.jsx               # Entry point
│   │   ├── components/
│   │   │   ├── auth/              # Login, Register, ForgotPassword modals/cards
│   │   │   ├── common/            # Navbar, TopBar, Footer, Modals, MarkdownRenderer
│   │   │   ├── forum/             # PostCard, CommentItem, TagSelector, VotePill
│   │   │   ├── layout/            # App shell, Sidebar, TopBar navigation
│   │   │   └── linux/             # Virtual Linux Terminal emulator & nano editor
│   │   ├── context/
│   │   │   └── AuthContext.jsx    # Authentication state, user session, login/logout
│   │   ├── pages/
│   │   │   ├── Home.jsx           # Activity feed, trending topics, quick create
│   │   │   ├── Forum.jsx          # Filterable discussions, search, categories
│   │   │   ├── PostDetail.jsx     # Discussion view, threaded comments, voting
│   │   │   ├── TerminalPage.jsx   # Dedicated full-page terminal workstation
│   │   │   ├── compiler/          # Multi-language IDE & Monaco compiler
│   │   │   ├── Chat.jsx           # Direct messaging and chat conversations
│   │   │   ├── Resources.jsx      # Curated learning roadmaps & cheatsheets
│   │   │   ├── Categories.jsx     # Topic directory with post counts
│   │   │   ├── Members.jsx        # Community members leaderboard
│   │   │   ├── Profile.jsx        # Student profile, activity history, bookmarks
│   │   │   ├── Settings.jsx       # Account, security, preferences
│   │   │   └── AdminDashboard.jsx # Analytics, moderation, role manager
│   │   └── utils/                 # Date formatters, sanitizers, vote calculations
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── src/
│   │   ├── index.js               # Express app entrypoint & middleware setup
│   │   ├── config/
│   │   │   ├── db.js              # MongoDB connection & in-memory dev fallback
│   │   │   └── cloudinary.js      # Cloudinary storage configuration
│   │   ├── middleware/
│   │   │   ├── auth.js            # requireAuth & optionalAuth JWT validators
│   │   │   ├── admin.js           # requireAdmin role guard
│   │   │   └── upload.js          # Multer memory storage handler
│   │   ├── models/
│   │   │   ├── User.js            # Member profiles, roles, terminal state
│   │   │   ├── Post.js            # Discussions, tags, pinned status, scores
│   │   │   ├── Comment.js         # Nested threaded replies
│   │   │   ├── Vote.js            # Vote registry for idempotency
│   │   │   ├── Bookmark.js        # Saved discussion references
│   │   │   ├── Conversation.js    # Direct messaging chat channels
│   │   │   ├── Message.js         # Direct chat messages
│   │   │   ├── Resource.js        # Curated technical roadmap items
│   │   │   └── EmailOtp.js        # Password recovery verification codes
│   │   ├── routes/
│   │   │   ├── auth.routes.js     # Register, login, Google OAuth, password reset
│   │   │   ├── posts.routes.js    # Posts CRUD, voting, comments, pinning
│   │   │   ├── chat.routes.js     # Conversations, messages, unread count
│   │   │   ├── user.routes.js     # User profiles, team list, terminal persistence
│   │   │   ├── admin.routes.js    # Metrics, user management, moderation
│   │   │   ├── compile.routes.js  # Judge0 remote compilation proxy
│   │   │   ├── resource.routes.js # Roadmaps and resources API
│   │   │   └── upload.routes.js   # Image upload endpoint
│   │   └── scripts/
│   │       ├── seed.js            # Full database seed script with demo data
│   │       └── initDb.js          # Database index initializer
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher
- **MongoDB** (Optional for local development): A local instance or MongoDB Atlas cluster. If no URI is provided, the server automatically boots an in-memory database using `mongodb-memory-server`.

---

### 1. Backend Setup

```bash
cd server
npm install

# Copy environment variables
cp .env.example .env

# Seed initial categories, demo discussions, resources, and admin account
npm run seed

# Launch the backend server in development mode (watches changes with nodemon)
npm run dev
```

The server will start at `http://localhost:5000`.

---

### 2. Frontend Setup

In a new terminal window:

```bash
cd client
npm install

# Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Environment Variables Reference

#### Server (`server/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `PORT` | `5000` | Port for the Express backend |
| `MONGODB_URI` | `mongodb://localhost:27017/glug` | Connection URI. Leave empty to use auto-started in-memory MongoDB |
| `JWT_SECRET` | `change-me-in-production` | Secret key used to sign and verify JSON Web Tokens |
| `GOOGLE_CLIENT_ID` | `(optional)` | Google OAuth 2.0 Web Client ID |
| `CLOUDINARY_CLOUD_NAME` | `(optional)` | Cloudinary cloud identifier for image uploads |
| `CLOUDINARY_API_KEY` | `(optional)` | Cloudinary API Key |
| `CLOUDINARY_API_SECRET` | `(optional)` | Cloudinary API Secret |

#### Client (`client/.env`)
| Variable | Default Value | Description |
|---|---|---|
| `VITE_GOOGLE_CLIENT_ID` | `(optional)` | Google OAuth Client ID for the Google sign-in button |
| `VITE_JUDGE0_API_KEY` | `(optional)` | Judge0 CE API key (defaults to free tier `https://ce.judge0.com`) |

---

### 4. Database Seeding

The seed script creates initial users, categories, tags, discussions, comments, and learning resources:

```bash
cd server
npm run seed
```


---

### 5. Production Build

To test or generate optimized production assets:

```bash
cd client
npm run build
```

To preview the production bundle locally:

```bash
npm run preview
```

---

## Complete API Reference

All requests accept and return `application/json`. Authenticated routes require an `Authorization: Bearer <token>` header.

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new account (`username, email, password`) | No |
| `POST` | `/api/auth/login` | Login with username/email & password | No |
| `POST` | `/api/auth/google` | Sign in / register with Google credential token | No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user session | Yes |
| `PUT` | `/api/auth/me` | Update bio, avatar, skills, or password | Yes |
| `POST` | `/api/auth/forgot-password` | Send password reset OTP to email | No |
| `POST` | `/api/auth/reset-password` | Reset password using verified OTP | No |

### Posts & Discussions (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts` | List posts (`?category=...&tag=...&tab=latest\|trending\|top&search=...`) | No (Optional) |
| `GET` | `/api/posts/:id` | Fetch discussion by ID with author info & vote status | No (Optional) |
| `POST` | `/api/posts` | Create new discussion (`title, body, category, tags`) | Yes |
| `PUT` | `/api/posts/:id` | Edit discussion title, content, or tags | Author / Admin |
| `DELETE` | `/api/posts/:id` | Delete discussion and cascade delete comments & votes | Author / Admin |
| `POST` | `/api/posts/:id/vote` | Cast or undo upvote/downvote (`{ value: 1 \| -1 }`) | Yes |
| `POST` | `/api/posts/:id/bookmark`| Toggle bookmark on a post | Yes |
| `PUT` | `/api/posts/:id/pin` | Pin or unpin discussion to category top | Admin |
| `PUT` | `/api/posts/:id/lock` | Lock or unlock replies on discussion | Admin |

### Comments & Replies (`/api/posts/:id/comments`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts/:id/comments` | Fetch threaded comment tree for a post | No (Optional) |
| `POST` | `/api/posts/:id/comments` | Post root comment or reply (`{ body, parentComment }`) | Yes |
| `DELETE` | `/api/posts/:id/comments/:commentId` | Delete comment and all its nested children | Author / Admin |
| `POST` | `/api/posts/:id/comments/:commentId/vote` | Vote on a comment (`{ value: 1 \| -1 }`) | Yes |

### Direct Messaging (`/api/chat`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/chat/unread-count` | Get total unread direct messages count | Yes |
| `GET` | `/api/chat/conversations` | List user's active conversations | Yes |
| `GET` | `/api/chat/conversations/with/:userId` | Get or create conversation with specific user | Yes |
| `GET` | `/api/chat/conversations/:id/messages` | Fetch message history in conversation | Yes |
| `POST` | `/api/chat/conversations/:id/messages` | Send a message (`{ content }`) | Yes |

### User Profiles & Terminal State (`/api/users`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/users/team` | Fetch GLUG community team and staff members | No |
| `GET` | `/api/users/:id/profile` | Fetch public student profile and statistics | No |
| `GET` | `/api/users/:id/posts` | Fetch discussions authored by a user | No |
| `GET` | `/api/users/me/terminal` | Retrieve authenticated student's saved VFS state | Yes |
| `PUT` | `/api/users/me/terminal` | Save persistent virtual filesystem & history (`fs, cwd, history`) | Yes |

### Admin Moderation (`/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | Platform overview (total users, posts, comments, votes) | Admin |
| `GET` | `/api/admin/users` | List registered members with roles and statuses | Admin |
| `PUT` | `/api/admin/users/:id/role` | Update user role (`student` or `admin`) | Admin |
| `DELETE` | `/api/admin/users/:id` | Ban/delete user account and clean up content | Admin |

### Cloud Code Compilation (`/api/compile`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/compile` | Compile and execute source code via Judge0 CE cloud | No |

Payload format:
```json
{
  "language": "cpp",
  "code": "#include <iostream>\nint main() { std::cout << \"Hello GLUG!\"; return 0; }",
  "stdin": ""
}
```

### Media Uploads (`/api/upload`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/upload` | Upload image file (`multipart/form-data`) | Yes |

---

## In-Browser Linux Terminal Command Reference

| Command | Syntax | Description |
|---|---|---|
| `ls` | `ls [-l] [-a] [path]` | List directory contents with file metadata and permissions |
| `cd` | `cd [dir]` | Change current working directory (`~`, `..`, relative, absolute) |
| `pwd` | `pwd` | Print current working directory path |
| `cat` | `cat <file>` | Display content of one or more text files |
| `nano` | `nano <file>` | Open interactive full-screen text editor |
| `python` | `python [file]`, `python3` | Launch interactive Python REPL or run script file |
| `mkdir` | `mkdir [-p] <dir>` | Create a new directory (supports nested `-p`) |
| `rmdir` | `rmdir <dir>` | Remove an empty directory |
| `rm` | `rm [-r] [-f] <file/dir>` | Remove files or directories recursively (`-r`) |
| `touch` | `touch <file>` | Create an empty file or update timestamp |
| `cp` | `cp [-r] <src> <dest>` | Copy files or directories |
| `mv` | `mv <src> <dest>` | Move or rename files and directories |
| `tree` | `tree [path]` | Display recursive visual directory tree |
| `find` | `find [path] -name <pattern>` | Search for files by name inside directory tree |
| `grep` | `grep [-i] [-n] <text> [file]` | Search text inside files with line numbers |
| `head` | `head [-n count] <file>` | Output the first lines of a file |
| `tail` | `tail [-n count] <file>` | Output the last lines of a file |
| `wc` | `wc [-l] [-w] [-c] <file>` | Count lines, words, and characters in a file |
| `echo` | `echo [text] [> file]` | Print text or redirect output to file |
| `chmod` | `chmod <mode> <file>` | Modify file permission flags |
| `curl` | `curl <url>` | Simulate HTTP request and display response |
| `whoami` | `whoami` | Display active username |
| `hostname` | `hostname` | Display system host name |
| `uname` | `uname [-a]` | Display operating system and kernel information |
| `date` | `date` | Display current system date and time |
| `history` | `history` | List command history for current session |
| `clear` | `clear` | Clear terminal screen display |
| `ps` | `ps` | List simulated running processes |
| `kill` | `kill <pid>` | Terminate process by PID |
| `env` | `env` | Display environment variables |
| `export` | `export KEY=VALUE` | Set environment variable |
| `alias` | `alias name='command'` | Create custom command shortcut |
| `unalias` | `unalias name` | Remove command shortcut |
| `resetfs` | `resetfs` | Reset virtual filesystem to factory default |
| `neofetch` | `neofetch` | Print GLUG Linux ASCII banner and system metrics |
| `cowsay` | `cowsay <message>` | Display ASCII cow speech bubble |
| `fortune` | `fortune` | Print inspirational open-source quote |
| `help` | `help [command]` | Display comprehensive shell reference guide |

---

## Compiler Language & Runtime Matrix

| Language | Identifier | Runtime Engine | Interactive Stdin | File Extension |
|---|---|---|---|---|
| **Python** | `python` | Pyodide (In-Browser WASM) / Judge0 | Yes (`input()`) | `.py` |
| **C** | `c` | GCC 11.1.0 via Judge0 Cloud | Yes | `.c` |
| **C++** | `cpp` | G++ 11.1.0 via Judge0 Cloud | Yes | `.cpp` |
| **Java** | `java` | OpenJDK 17 via Judge0 Cloud | Yes | `.java` |
| **C#** | `csharp` | Mono 6.12 via Judge0 Cloud | Yes | `.cs` |
| **JavaScript**| `javascript`| Node.js 18 via Judge0 Cloud | Yes | `.js` |
| **TypeScript**| `typescript`| TypeScript via Judge0 Cloud | Yes | `.ts` |
| **Go** | `go` | Go 1.18 via Judge0 Cloud | Yes | `.go` |
| **Rust** | `rust` | Rustc 1.60 via Judge0 Cloud | Yes | `.rs` |

---

## Security & Data Integrity

- **Stateless JWT Tokens**: Tokens signed with SHA-256 HMAC, verified on protected endpoints, stored securely with HTTP client interceptors.
- **Cryptographic Password Hashing**: Passwords salted and hashed with `bcryptjs` (salt rounds: 10).
- **Strict Content Sanitization**: All user-authored posts, comments, and bios are processed through `DOMPurify` before DOM rendering to eliminate XSS vectors.
- **Vote Idempotency & Protection**: Unique indexes on `Vote` collection (`userId + postId`, `userId + commentId`) prevent duplicate votes. Vote scores are guarded at a minimum of 0 to stop negative abuse.
- **Rate Limiting**: `express-rate-limit` enforces rate windows across authentication routes to block brute-force password guessing.
- **HTTP Header Hardening**: `helmet` sets secure Content Security Policies, clickjacking prevention (`X-Frame-Options`), and MIME sniffing protection.
- **In-Memory Fallback Isolation**: When local MongoDB is not running, the system initializes an isolated `mongodb-memory-server` without leaking configuration or failing server startup.

---

## Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/NewFeature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'feat: Add NewFeature'
   ```
4. Push to the branch:
   ```bash
   git push origin feature/NewFeature
   ```
5. Open a Pull Request on GitHub

---

## License

Distributed under the **MIT License**. See `LICENSE` for more information.