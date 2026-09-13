const MEMORY_CACHE = new Map()
const DEFAULT_TTL = 60 * 1000
const STORAGE_PREFIX = 'glug_disc_'

function safeStorageGet(key) {
  try {
    const raw = sessionStorage.getItem(STORAGE_PREFIX + key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function safeStorageSet(key, payload) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(payload))
  } catch {
    try {
      sessionStorage.clear()
    } catch {
      return
    }
  }
}

function safeStorageRemove(key) {
  try {
    sessionStorage.removeItem(STORAGE_PREFIX + key)
  } catch {
    return
  }
}

export const discussionsCache = {
  get(key) {
    const now = Date.now()
    const inMem = MEMORY_CACHE.get(key)
    if (inMem) {
      const isStale = now - inMem.timestamp > inMem.ttl
      return { data: inMem.data, isStale, timestamp: inMem.timestamp }
    }

    const inStorage = safeStorageGet(key)
    if (inStorage && inStorage.data) {
      MEMORY_CACHE.set(key, inStorage)
      const isStale = now - inStorage.timestamp > (inStorage.ttl || DEFAULT_TTL)
      return { data: inStorage.data, isStale, timestamp: inStorage.timestamp }
    }

    return null
  },

  set(key, data, ttl = DEFAULT_TTL) {
    const payload = {
      data,
      timestamp: Date.now(),
      ttl,
    }
    MEMORY_CACHE.set(key, payload)
    safeStorageSet(key, payload)
  },

  invalidate(keyPrefix = '') {
    if (!keyPrefix) {
      MEMORY_CACHE.clear()
      try {
        const toRemove = []
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i)
          if (k && k.startsWith(STORAGE_PREFIX)) {
            toRemove.push(k)
          }
        }
        toRemove.forEach((k) => sessionStorage.removeItem(k))
      } catch {
        return
      }
      return
    }

    for (const k of MEMORY_CACHE.keys()) {
      if (k.startsWith(keyPrefix)) {
        MEMORY_CACHE.delete(k)
      }
    }
    safeStorageRemove(keyPrefix)
  },

  updatePostInCaches(postId, updateFn) {
    if (!postId) return
    const idStr = String(postId)

    for (const [key, entry] of MEMORY_CACHE.entries()) {
      if (!entry || !entry.data) continue
      let changed = false

      if (Array.isArray(entry.data)) {
        const updatedList = entry.data.map((item) => {
          const itemId = String(item.id || item._id || '')
          if (itemId === idStr) {
            changed = true
            return updateFn(item)
          }
          return item
        })
        if (changed) {
          entry.data = updatedList
          safeStorageSet(key, entry)
        }
      } else if (entry.data?.posts && Array.isArray(entry.data.posts)) {
        const updatedPosts = entry.data.posts.map((item) => {
          const itemId = String(item.id || item._id || '')
          if (itemId === idStr) {
            changed = true
            return updateFn(item)
          }
          return item
        })
        if (changed) {
          entry.data = { ...entry.data, posts: updatedPosts }
          safeStorageSet(key, entry)
        }
      } else if (String(entry.data?.id || entry.data?._id || '') === idStr) {
        entry.data = updateFn(entry.data)
        safeStorageSet(key, entry)
      }
    }
  },
}
