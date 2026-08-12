import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function Navbar() {
  const { user, logout } = useAuth()

  const linkClass = ({ isActive }) =>
    'nav-link' + (isActive ? ' nav-link-active' : '')

  return (
    <header className="navbar">
      <Link to="/" className="navbar-brand">GLUG</Link>
      <nav className="navbar-links">
        <NavLink to="/" className={linkClass} end>Home</NavLink>
        <NavLink to="/resources" className={linkClass}>Resources</NavLink>
        <NavLink to="/forum" className={linkClass}>Forum</NavLink>
      </nav>
      <div className="navbar-auth">
        {user ? (
          <>
            <span className="navbar-user">@ {user.username}</span>
            <button className="btn btn-ghost" onClick={logout}>Logout</button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-ghost">Login</Link>
            <Link to="/register" className="btn btn-primary">Sign up</Link>
          </>
        )}
      </div>
    </header>
  )
}