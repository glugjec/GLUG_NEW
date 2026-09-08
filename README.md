# GLUG_NEW
# GLUG — Student Community & Open-Source Platform

Community forum for students (like Reddit/Twitter but focused on Linux + community).
An all-in-one open-source community platform for college students (especially 1st-year friendly), built for the **GNU/Linux User Group (GLUG)**.

## Structure
Featuring:
- **Interactive In-Browser Linux Terminal**: Virtual file system with 30+ bash commands and `nano` text editor.
- **Online IDE & Compiler**: Zero-setup multi-language sandbox supporting Python (Pyodide WASM), C, C++, Java, and C# (Judge0 CE).
- **Reddit-Style Discussion Forum**: Categorized boards, tag filters, upvoting/downvoting, threaded comment replies, search, and pagination.
- **Open-Source Resources**: Curated learning paths, command line cheatsheets, and distro recommendations for beginners.
- **Student Profiles & Reputation**: Upvotes received, contributions timeline, editable bio, and skill tags.

- `client/` — React (Vite) frontend
- `server/` — Express.js + PostgreSQL backend
---

## Pages
## Tech Stack

- **Home** — overview of the website
- **Resources** — Linux study material for students
- **Forum** — community discussions (posts + comments)
- **Login/Register** — account system (JWT auth)
- **Frontend**: React 19, Vite 8, React Router 7, Monaco Editor, Lucide Icons, Axios
- **Backend**: Node.js (ESM), Express.js 4, Mongoose 8 (MongoDB)
- **Security & Validation**: JWT authentication, bcryptjs, Helmet, Express Rate Limit, Express Validator
- **Execution Engines**: Pyodide (in-browser WASM) + Judge0 CE Cloud Sandbox

## Setup
---

### Backend
## Directory Structure

```
.
├── client/             # React 19 + Vite 8 frontend
│   ├── src/
│   │   ├── api.js      # Axios client with JWT interceptor
│   │   ├── context/    # AuthContext with auto session recovery
│   │   ├── components/ # Common, forum, layout, linux terminal, auth
│   │   └── pages/      # Home, Forum, PostDetail, Resources, Compiler, Profile, Settings, Login, Register
├── server/             # Express.js + Mongoose backend
│   ├── src/
│   │   ├── config/     # MongoDB connection (with automatic dev in-memory fallback)
│   │   ├── models/     # User, Post, Comment, Vote schemas
│   │   ├── middleware/ # JWT auth, optionalAuth, requireAdmin
│   │   ├── routes/     # Auth, Posts, Users, Compile routes
│   │   └── scripts/    # Database seed script
└── Compiler/           # Standalone compiler repository (integrated inside client)
```

---

## Getting Started

### 1. Backend Setup

```bash
cd server
npm install
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET
createdb glug          # or equivalent
npm run db:init        # creates tables
npm run dev            # http://localhost:5000

# Configure environment variables (optional: defaults to local MongoDB or in-memory fallback)
cp .env.example .env

# Seed initial community discussions and demo accounts (admin, students)
npm run seed

# Start server with watch mode
npm run dev
# Server listens on http://localhost:5000
```

### Frontend
> **Default demo accounts after seeding**:
> - Admin: `admin@glug.dev` / `glug1234`
> - Student: `alex@glug.dev` / `glug1234`
> - Student: `priya@glug.dev` / `glug1234`

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev            # http://localhost:5173
npm run dev
# Open in browser: http://localhost:5173
```

---

## API Reference

### Auth (`/api/auth`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register student account | No |
| `POST` | `/api/auth/login` | Login with email & password | No |
| `GET` | `/api/auth/me` | Fetch authenticated user data | Yes |
| `PUT` | `/api/auth/me` | Update bio, skills, password | Yes |

### Forum Posts (`/api/posts`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/posts` | List posts (`?category=...&tag=...&sort=hot|new|top&search=...&page=...`) | Optional |
| `GET` | `/api/posts/:id` | Get post with threaded comments & user vote | Optional |
| `POST` | `/api/posts` | Create new post | Yes |
| `PUT` | `/api/posts/:id` | Edit post | Author/Admin |
| `DELETE` | `/api/posts/:id` | Delete post & comments | Author/Admin |
| `POST` | `/api/posts/:id/vote` | Upvote/downvote (`{ value: 1 \| -1 \| 0 }`) | Yes |
| `PUT` | `/api/posts/:id/pin` | Pin/unpin post | Admin only |

### Comments (`/api/posts/:id/comments`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `POST` | `/api/posts/:id/comments` | Add comment or threaded reply (`{ body, parentComment }`) | Yes |
| `DELETE` | `/api/posts/:id/comments/:commentId` | Delete comment & child replies | Author/Admin |

### Users (`/api/users`)
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| `GET` | `/api/users/:id` | Public profile with statistics & reputation | No |
| `GET` | `/api/users/:id/posts` | List discussions created by user | No |