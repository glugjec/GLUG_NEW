const AVATAR_COLORS = ['#5865f2', '#eb459e', '#57f287', '#fee75c', '#ed4245', '#00a8fc', '#f47fff']

export function avatarInitials(username) {
  return (username || '?').slice(0, 2).toUpperCase()
}

export function avatarColor(username) {
  let hash = 0
  for (const c of (username || '')) hash = (hash * 31 + c.charCodeAt(0)) & 0xffffffff
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}