# GLUG — Student Technical Community & Open-Source Platform

An all-in-one open-source community platform for college students and developers, built for the **GNU/Linux User Group (GLUG)**. Designed to be beginner-friendly while offering powerful tools for technical collaboration, coding, and Linux mastery.

---

## Key Features

- **Interactive In-Browser Linux Terminal**: Virtual file system with 30+ core Unix/Linux commands (`ls`, `cd`, `grep`, `mkdir`, `cat`, `curl`, etc.), shell command history, tab auto-completion, keyboard shortcuts, and a built-in `nano` terminal editor.
- **Online IDE & Multi-Language Compiler**: Zero-setup Monaco-powered code editor with syntax highlighting, custom input (stdin), execution timing, supporting Python (in-browser Pyodide WASM sandbox) and C, C++, Java, C#, and JavaScript (Judge0 CE cloud execution).
- **Technical Discussion Forum**: Categorized boards (Linux, Programming, Web Dev, DevOps, Security, Events, Projects, Hardware, Help & Support), tag filtering, bookmarking, and search.
- **Protected Voting Rules & Scoring**: Upvote/downvote system with vote protection (scores cannot drop below 0, smooth downvote undo toggling, real-time score calculation, and request debouncing).
- **Threaded Comments & Rich Text Editing**: Nested conversation replies, sanitized preview rendering, image embedding (Cloudinary & Unsplash support), TipTap editor, and cascading delete warnings with custom confirmation modals.
- **Admin Moderation Dashboard**: Role-based access control (Student vs Admin), user management, role promotion, post pinning, and content moderation.
- **Curated Open-Source Resources**: Structured learning roadmaps, Linux distro recommendations, terminal command cheatsheets, and open-source tool alternatives.
- **Student Profiles & Reputation**: Upvotes received, contributions activity, customizable bios, and technical skill badges.

---

## Tech Stack

### Frontend
- **Framework**: React 19, Vite 8, React Router 7
- **Editor & IDE**: Monaco Editor (`@monaco-editor/react`), TipTap Rich Text Editor
- **Styling & UI**: Vanilla CSS Design System (dark-first aesthetic), Lucide Icons
- **Security & Utilities**: DOMPurify, Marked, Axios with interceptors

### Backend
- **Runtime & Framework**: Node.js (ESM), Express.js 4
- **Database & ODM**: MongoDB, Mongoose 8 (with automated `mongodb-memory-server` fallback for zero-config local development)
- **Authentication**: JWT (JSON Web Tokens), bcryptjs, Google OAuth 2.0 (`google-auth-library`)
- **Security**: Helmet, Express Rate Limit (DDoS & brute-force mitigation), Express Validator
- **Media & Cloud Storage**: Cloudinary SDK, Multer

---

## Directory Structure

```
GLUG_NEW/
├── client/                     # Frontend Application (React 19 + Vite 8)
│   ├── public/                 # Static assets, banners, brand logos
│   ├── src/
│   │   ├── api.js              # Centralized Axios client & API endpoints
│   │   ├── components/
│   │   │   ├── auth/           # Login, Register, ProtectedRoute
│   │   │   ├── common/         # Avatars, Cards, Modals, MarkdownRenderer, RichTextEditor
│   │   │   ├── forum/          # Post cards, Voting, Comments, Badges
│   │   │   ├── layout/         # Navigation, Sidebar, Topbar
│   │   │   └── terminal/       # In-browser Linux Terminal emulator & filesystem
│   │   ├── context/            # AuthContext with session persistence
│   │   ├── pages/              # Home, Forum, PostDetail, Resources, Compiler, Profile, AdminDashboard
│   │   └── utils/              # Time utilities, vote calculators, sanitizers
│   └── package.json
├── server/                     # Backend API Service (Express.js + Mongoose)
│   ├── src/
│   │   ├── config/             # MongoDB connection & in-memory dev fallback
│   │   ├── middleware/         # authMiddleware, optionalAuth, requireAdmin, upload
│   │   ├── models/             # User, Post, Comment, Vote, Bookmark
│   │   ├── routes/             # Auth, Posts, Users, Resources, Admin, Compile, Upload
│   │   └── scripts/            # Database seed script
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher
- **MongoDB**: Local MongoDB instance or MongoDB Atlas connection URI (optional: in-memory MongoDB will auto-start if no URI is provided in development)

---

### 1. Backend Setup

```bash
cd server
npm install

# Configure environment variables (optional: defaults work out-of-the-box in dev)
cp .env.example .env

# Seed the database with categories, rich discussions, and demo content
npm run seed

# Start the API server in development watch mode
npm run dev
```

The server will start on `http://localhost:5000` (or the port defined in `.env`).

---

### 2. Frontend Setup

```bash
cd client
npm install

# Start the Vite development server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

### 3. Production Build

```bash
cd client
npm run build
```

The production assets will be built to the `client/dist/` directory.

---

## API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register a new student account | Public |
| `POST` | `/api/auth/login` | Login with username/email & password | Public |
| `POST` | `/api/auth/google` | Authenticate using Google OAuth token | Public |
| `GET` | `/api/auth/me` | Retrieve authenticated user profile | Private |
| `PUT` | `/api/auth/me` | Update bio, avatar, skills, and password | Private |

### Forum & Discussions (`/api/posts`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/posts` | List posts (`?category=...&tag=...&tab=latest\|trending\|unanswered\|my-posts\|bookmarks`) | Public |
| `GET` | `/api/posts/:id` | Get post details with nested comments & user vote | Public |
| `POST` | `/api/posts` | Create a new discussion post | Private |
| `PUT` | `/api/posts/:id` | Update discussion post | Author / Admin |
| `DELETE` | `/api/posts/:id` | Cascading delete of post, comments, and votes | Author / Admin |
| `POST` | `/api/posts/:id/vote` | Cast or toggle vote (`{ value: 1 \| -1 \| 0 }`) | Private |
| `POST` | `/api/posts/:id/bookmark` | Bookmark or unbookmark discussion | Private |
| `PUT` | `/api/posts/:id/pin` | Pin or unpin post to top of category | Admin |

### Comments (`/api/posts/:id/comments`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/posts/:id/comments` | Post a comment or threaded reply (`{ body, parentComment }`) | Private |
| `DELETE` | `/api/posts/:id/comments/:commentId` | Cascading delete of comment and its reply tree | Author / Admin |

### Admin & Moderation (`/api/admin`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/admin/metrics` | Fetch club statistics, user count, and activity | Admin |
| `GET` | `/api/admin/users` | List registered members with roles | Admin |
| `PUT` | `/api/admin/users/:id/role` | Change member role (`student` / `admin`) | Admin |

### Execution & Compilation (`/api/compile`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/compile` | Compile and execute source code via Judge0 CE Cloud | Public |

### Media Upload (`/api/upload`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/upload` | Upload image for post/comment embed (Cloudinary) | Private |

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'feat: Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.