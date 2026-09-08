import { useState } from 'react'
import { ArrowBigUp, ArrowBigDown } from 'lucide-react'
import { postsApi } from '../../api.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { useNavigate } from 'react-router-dom'

export default function VoteButtons({ postId, initialScore = 0, initialVote = 0, orientation = 'vertical' }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [score, setScore] = useState(initialScore)
  const [userVote, setUserVote] = useState(initialVote)
  const [loading, setLoading] = useState(false)

  const handleVote = async (e, value) => {
    e.preventDefault()
    e.stopPropagation()

    if (!user) {
      navigate('/login')
      return
    }

    if (loading) return

    // Calculate optimistic new state
    const previousScore = score
    const previousVote = userVote

    let newVote = value
    let delta = 0

    if (userVote === value) {
      // Toggle off
      newVote = 0
      delta = -value
    } else if (userVote !== 0) {
      // Swapping vote from +1 to -1 or vice versa
      delta = value - userVote
    } else {
      // New vote
      delta = value
    }

    setScore(previousScore + delta)
    setUserVote(newVote)
    setLoading(true)

    try {
      const res = await postsApi.vote(postId, newVote)
      setScore(res.voteScore)
      setUserVote(res.userVote)
    } catch (err) {
      // Revert on error
      console.error('Vote failed:', err.message)
      setScore(previousScore)
      setUserVote(previousVote)
    } finally {
      setLoading(false)
    }
  }

  const isUpvoted = userVote === 1
  const isDownvoted = userVote === -1

  return (
    <div
      className={`vote-container ${orientation === 'horizontal' ? 'vote-horizontal' : 'vote-vertical'}`}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        type="button"
        className={`vote-btn vote-up ${isUpvoted ? 'active' : ''}`}
        aria-label="Upvote"
        title={user ? 'Upvote' : 'Log in to vote'}
        onClick={(e) => handleVote(e, 1)}
      >
        <ArrowBigUp size={20} className={isUpvoted ? 'fill-current' : ''} />
      </button>

      <span className={`vote-score ${isUpvoted ? 'score-up' : ''} ${isDownvoted ? 'score-down' : ''}`}>
        {score}
      </span>

      <button
        type="button"
        className={`vote-btn vote-down ${isDownvoted ? 'active' : ''}`}
        aria-label="Downvote"
        title={user ? 'Downvote' : 'Log in to vote'}
        onClick={(e) => handleVote(e, -1)}
      >
        <ArrowBigDown size={20} className={isDownvoted ? 'fill-current' : ''} />
      </button>
    </div>
  )
}

