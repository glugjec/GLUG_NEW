import Card from '../components/common/Card.jsx'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'

export default function Profile() {
  const { user } = useAuth()

  if (!user) {
    return (
      <section className="page">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">
          You are not logged in.{' '}
          <Link to="/login" className="link">Log in</Link> to view your profile.
        </p>
      </section>
    )
  }

  return (
    <section className="page">
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Your account details.</p>

      <div className="profile-card">
        <div className="profile-avatar" style={{ background: avatarColor(user.username) }}>
          {avatarInitials(user.username)}
        </div>
        <div className="profile-names">
          <span className="profile-username">{user.username}</span>
          <span className="profile-email">{user.email}</span>
        </div>
      </div>

      <div className="cards">
        <Card>
          <h2 className="card-title">About</h2>
          <p className="card-text">
            This is your public GLUG profile. Member since the day you joined the
            community — your posts and activity will show up here soon.
          </p>
        </Card>
      </div>
    </section>
  )
}