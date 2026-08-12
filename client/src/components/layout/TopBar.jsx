import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TopBar() {
  const { user, logout } = useAuth()

  return (
    <header className="topbar">
      <Link to="/" className="topbar-brand">
        <span className="topbar-logo">G</span>
        <span className="topbar-name">GLUG</span>
      </Link>
      <div className="topbar-auth">
        {user ? (
          <>
            <span className="topbar-user" title={user.email}>@{user.username}</span>
            <button className="btn btn-ghost btn-sm" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost btn-sm">Log In</Link>
            <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
          </>
        )}
      </div>
    </header>
  )
}