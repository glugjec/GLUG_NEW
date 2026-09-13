import { useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll({
  hasMore,
  isLoading,
  onLoadMore,
  rootMargin = '350px',
  threshold = 0.1,
}) {
  const sentinelRef = useRef(null)
  const onLoadMoreRef = useRef(onLoadMore)
  onLoadMoreRef.current = onLoadMore

  const handleIntersect = useCallback(
    (entries) => {
      const [entry] = entries
      if (entry && entry.isIntersecting && hasMore && !isLoading) {
        onLoadMoreRef.current()
      }
    },
    [hasMore, isLoading]
  )

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !hasMore) return

    const observer = new IntersectionObserver(handleIntersect, {
      root: null,
      rootMargin,
      threshold,
    })

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersect, hasMore, rootMargin, threshold])

  return sentinelRef
}
