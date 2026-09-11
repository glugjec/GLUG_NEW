export function calculateNextVoteScore(currentScore, currentVote, nextVote) {
  const score = Math.max(0, currentScore || 0)
  if (currentVote === nextVote) return score
  if (currentVote === 0) {
    if (nextVote === 1) return score + 1
    if (nextVote === -1) return Math.max(0, score - 1)
    return score
  }
  if (currentVote === 1) {
    if (nextVote === 0) return Math.max(0, score - 1)
    if (nextVote === -1) return Math.max(0, score - 2)
    return score
  }
  if (currentVote === -1) {
    if (nextVote === 1) return score === 0 ? 1 : score + 2
    if (nextVote === 0) return score === 0 ? 0 : score + 1
    return score
  }
  return score
}
