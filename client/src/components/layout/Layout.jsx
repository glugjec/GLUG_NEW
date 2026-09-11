import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import TopBar from './TopBar.jsx'
import Sidebar from './Sidebar.jsx'
import Footer from '../common/Footer.jsx'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    return window.innerWidth >= 900 && window.innerWidth < 1100
  })
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('glug-collapsed', collapsed)
    return () => document.body.classList.remove('glug-collapsed')
  }, [collapsed])

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 900) {
        setMobileOpen(false)
      } else {
        setCollapsed(false)
      }
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div className={`app-shell-v2${collapsed ? ' is-collapsed' : ''}${mobileOpen ? ' is-mobile-open' : ''}`}>
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen(!mobileOpen)}
      />
      <div className="app-main-viewport">
        <TopBar />
        <main className="main-content">
          <Outlet />
          <Footer />
        </main>
      </div>
      <div
        className={`sidebar-backdrop${mobileOpen ? ' show' : ''}`}
        onClick={() => setMobileOpen(false)}
      />
    </div>
  )
}