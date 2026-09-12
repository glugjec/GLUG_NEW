import { useEffect, useRef } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

export default function ScrollToTop() {
  const location = useLocation()
  const navType = useNavigationType()
  const scrollPositions = useRef(new Map())

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrollY =
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0
      const scrollX =
        window.scrollX ||
        document.documentElement.scrollLeft ||
        document.body.scrollLeft ||
        0
      const mainEl = document.querySelector('.main-content')
      const viewportEl = document.querySelector('.app-main-viewport')
      const containerY = (mainEl?.scrollTop || 0) || (viewportEl?.scrollTop || 0)

      scrollPositions.current.set(location.key, {
        x: scrollX,
        y: scrollY,
        containerY
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    const mainEl = document.querySelector('.main-content')
    const viewportEl = document.querySelector('.app-main-viewport')
    if (mainEl) mainEl.addEventListener('scroll', handleScroll, { passive: true })
    if (viewportEl) viewportEl.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (mainEl) mainEl.removeEventListener('scroll', handleScroll)
      if (viewportEl) viewportEl.removeEventListener('scroll', handleScroll)
    }
  }, [location.key])

  useEffect(() => {
    if (location.pathname.startsWith('/chat') || location.pathname.startsWith('/messages')) {
      return
    }

    if (navType === 'POP') {
      const saved = scrollPositions.current.get(location.key)
      if (saved) {
        const restore = () => {
          window.scrollTo({ top: saved.y, left: saved.x, behavior: 'instant' })
          if (document.documentElement) document.documentElement.scrollTop = saved.y
          if (document.body) document.body.scrollTop = saved.y
          const mainEl = document.querySelector('.main-content')
          if (mainEl) mainEl.scrollTop = saved.containerY
          const viewportEl = document.querySelector('.app-main-viewport')
          if (viewportEl) viewportEl.scrollTop = saved.containerY
        }
        restore()
        const frameId = requestAnimationFrame(restore)
        const timerId = setTimeout(restore, 60)
        return () => {
          cancelAnimationFrame(frameId)
          clearTimeout(timerId)
        }
      }
      return
    }

    if (location.hash) {
      const target = document.getElementById(location.hash.slice(1))
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }

    const resetTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      if (document.documentElement) {
        document.documentElement.scrollTop = 0
      }
      if (document.body) {
        document.body.scrollTop = 0
      }

      const scrollableElements = document.querySelectorAll(
        '.app-main-viewport, .main-content, .main-content-flush, #root'
      )
      scrollableElements.forEach((el) => {
        el.scrollTop = 0
      })
    }

    resetTop()
    const frameId = requestAnimationFrame(resetTop)
    return () => cancelAnimationFrame(frameId)
  }, [location.key, location.pathname, location.search, location.hash, navType])

  return null
}
