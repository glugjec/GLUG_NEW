import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { avatarInitials, avatarColor } from '../components/common/avatar.js'
import Card from '../components/common/Card.jsx'

const STATS = [
  { label: 'Posts', value: '12' },
  { label: 'Comments', value: '47' },
  { label: 'Upvotes', value: '89' },
]

const SKILLS = ['Linux', 'Bash', 'Git', 'Python', 'Open Source']

const ACTIVITY = [
  { text: 'Started a discussion in General', time: '2 days ago' },
  { text: 'Replied to "Bash vs Zsh — which shell do you use?"', time: '5 days ago' },
  { text: 'Joined the GLUG community', time: '6 months ago' },
]

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
      <p className="page-subtitle">Your public GLUG profile.</p>

      <div className="profile-card">
        <div className="profile-avatar" style={{ background: avatarColor(user.username) }}>
          {avatarInitials(user.username)}
        </div>
        <div className="profile-names">
          <span className="profile-username">{user.username}</span>
          <span className="profile-email">{user.email}</span>
          <span className="profile-since">Member since you joined the community</span>
        </div>
        <button type="button" className="btn btn-ghost btn-sm profile-edit-btn">Edit Profile</button>
      </div>

      <div className="profile-stats">
        {STATS.map((stat) => (
          <div className="profile-stat" key={stat.label}>
            <span className="profile-stat-value">{stat.value}</span>
            <span className="profile-stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="cards">
        <Card>
          <h2>About</h2>
          <textarea
            className="profile-bio"
            rows="3"
            placeholder="Tell the community a little about yourself…"
          />
          <p>This bio will be visible on your public profile.</p>
        </Card>

        <Card>
          <h2>Skills &amp; Interests</h2>
          <div className="profile-chips">
            {SKILLS.map((skill) => (
              <span className="chip" key={skill}>{skill}</span>
            ))}
          </div>
        </Card>
      </div>

      <div className="cards">
        <Card>
          <h2>Recent Activity</h2>
          <ul className="profile-activity">
            {ACTIVITY.map((item, index) => (
              <li className="activity-item" key={index}>
                <span className="activity-dot" />
                <span className="activity-text">{item.text}</span>
                <span className="activity-time">{item.time}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </section>
  )
}