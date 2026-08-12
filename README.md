# GLUG_NEW

Community forum for students (like Reddit/Twitter but focused on Linux + community).

## Structure

- `client/` — React (Vite) frontend
- `server/` — Express.js + PostgreSQL backend

## Pages

- **Home** — overview of the website
- **Resources** — Linux study material for students
- **Forum** — community discussions (posts + comments)
- **Login/Register** — account system (JWT auth)

## Setup

### Backend

```bash
cd server
npm install
cp .env.example .env   # edit DATABASE_URL, JWT_SECRET
createdb glug          # or equivalent
npm run db:init        # creates tables
npm run dev            # http://localhost:5000
```

### Frontend

```bash
cd client
npm install
npm run dev            # http://localhost:5173
```