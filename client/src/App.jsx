import { Routes, Route, useLocation } from 'react-router-dom'
import Layout from './components/layout/Layout.jsx'
import Home from './pages/Home.jsx'
import Categories from './pages/Categories.jsx'
import TerminalPage from './pages/TerminalPage.jsx'
import Resources from './pages/Resources.jsx'
import Forum from './pages/Forum.jsx'
import Compiler from './pages/compiler/Compiler.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Profile from './pages/Profile.jsx'
import Settings from './pages/Settings.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'
import { Users, Calendar, Info } from 'lucide-react'

export default function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app-container">
      {isAuthPage ? (
        <main className="main-content-flush">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      ) : (
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/compiler" element={<Compiler />} />
            <Route path="/forum" element={<Forum />} />
            <Route path="/discussions" element={<Forum />} />
            <Route path="/forum/posts/:id" element={<PostDetail />} />
            <Route path="/discussions/:id" element={<PostDetail />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route
              path="/members"
              element={
                <PlaceholderPage
                  title="Community Members Directory"
                  subtitle="Explore and connect with Linux enthusiasts, developers, and open source contributors at GLUG."
                  icon={Users}
                />
              }
            />
            <Route
              path="/events"
              element={
                <PlaceholderPage
                  title="GLUG Events & Workshops"
                  subtitle="Discover upcoming installation drives, hackathons, guest lectures, and student meetups."
                  icon={Calendar}
                />
              }
            />
            <Route
              path="/about"
              element={
                <PlaceholderPage
                  title="About GLUG"
                  subtitle="The GNU/Linux User Group is a student-driven initiative fostering open source technology and collaborative learning."
                  icon={Info}
                />
              }
            />
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      )}
    </div>
  )
}