import { Routes, Route, useLocation } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import Footer from './components/common/Footer.jsx'
import Home from './pages/Home.jsx'
import Resources from './pages/Resources.jsx'
import Forum from './pages/Forum.jsx'
import PostDetail from './pages/PostDetail.jsx'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'

export default function App() {
  const location = useLocation()
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <div className="app-container">
      {!isAuthPage && <Navbar />}
      <main className={isAuthPage ? 'main-content main-content-flush' : 'main-content'}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/forum" element={<Forum />} />
          <Route path="/forum/posts/:id" element={<PostDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
      {!isAuthPage && <Footer />}
    </div>
  )
}