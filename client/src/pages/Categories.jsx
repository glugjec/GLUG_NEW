import { Link, useNavigate } from 'react-router-dom'
import {
  Terminal,
  Code2,
  Settings,
  GitFork,
  Box,
  GraduationCap,
  Users,
  HelpCircle,
  Calendar,
  Lightbulb,
  Sparkles,
  ChevronRight,
  MessageSquare,
  FileText,
  Layers,
  ArrowRight
} from 'lucide-react'
import './Categories.css'

const CATEGORIES_DATA = [
  {
    id: 'linux',
    name: 'Linux',
    desc: 'Discussions about Linux distributions, usage, customization, and more.',
    discussions: '1.2K',
    members: '5.6K',
    color: '#eab308',
    borderColor: 'rgba(234, 179, 8, 0.4)',
    bgGlow: 'rgba(234, 179, 8, 0.1)',
    iconType: 'tux',
  },
  {
    id: 'command-line',
    name: 'Command Line',
    desc: 'Tips, tricks, and help with the terminal and shell scripting.',
    discussions: '952',
    members: '4.1K',
    color: '#10b981',
    borderColor: 'rgba(16, 185, 129, 0.4)',
    bgGlow: 'rgba(16, 185, 129, 0.1)',
    iconType: 'terminal',
  },
  {
    id: 'programming',
    name: 'Programming',
    desc: 'Discuss programming languages, projects, and development.',
    discussions: '780',
    members: '3.8K',
    color: '#a855f7',
    borderColor: 'rgba(168, 85, 247, 0.4)',
    bgGlow: 'rgba(168, 85, 247, 0.1)',
    iconType: 'code',
  },
  {
    id: 'installation',
    name: 'Installation',
    desc: 'Get help with installing Linux, dual booting, and setup.',
    discussions: '860',
    members: '4.2K',
    color: '#3b82f6',
    borderColor: 'rgba(59, 130, 246, 0.4)',
    bgGlow: 'rgba(59, 130, 246, 0.1)',
    iconType: 'settings',
  },
  {
    id: 'open-source',
    name: 'Open Source',
    desc: 'Talk about open source projects, contributions, and communities.',
    discussions: '640',
    members: '3.1K',
    color: '#f43f5e',
    borderColor: 'rgba(244, 63, 94, 0.4)',
    bgGlow: 'rgba(244, 63, 94, 0.1)',
    iconType: 'git-fork',
  },
  {
    id: 'tools-apps',
    name: 'Tools & Apps',
    desc: 'Discuss useful tools, applications, and productivity setups.',
    discussions: '520',
    members: '2.9K',
    color: '#06b6d4',
    borderColor: 'rgba(6, 182, 212, 0.4)',
    bgGlow: 'rgba(6, 182, 212, 0.1)',
    iconType: 'box',
  },
  {
    id: 'learning-resources',
    name: 'Learning Resources',
    desc: 'Share and discover tutorials, courses, books, and guides.',
    discussions: '430',
    members: '2.6K',
    color: '#f97316',
    borderColor: 'rgba(249, 115, 22, 0.4)',
    bgGlow: 'rgba(249, 115, 22, 0.1)',
    iconType: 'grad',
  },
  {
    id: 'general',
    name: 'General Discussion',
    desc: 'Off-topic discussions, introductions, and casual chats.',
    discussions: '470',
    members: '3.0K',
    color: '#8b5cf6',
    borderColor: 'rgba(139, 92, 246, 0.4)',
    bgGlow: 'rgba(139, 92, 246, 0.1)',
    iconType: 'users',
  },
  {
    id: 'help',
    name: 'Help & Support',
    desc: 'Stuck? Get help from the community here.',
    discussions: '690',
    members: '4.5K',
    color: '#22c55e',
    borderColor: 'rgba(34, 197, 94, 0.4)',
    bgGlow: 'rgba(34, 197, 94, 0.1)',
    iconType: 'help',
  },
  {
    id: 'events',
    name: 'Events',
    desc: 'Updates, announcements, and discussions about GLUG events.',
    discussions: '340',
    members: '2.2K',
    color: '#ef4444',
    borderColor: 'rgba(239, 68, 68, 0.4)',
    bgGlow: 'rgba(239, 68, 68, 0.1)',
    iconType: 'calendar',
  },
  {
    id: 'projects',
    name: 'Project Showcase',
    desc: "Share your projects, ideas, and what you're building.",
    discussions: '280',
    members: '1.9K',
    color: '#38bdf8',
    borderColor: 'rgba(56, 189, 248, 0.4)',
    bgGlow: 'rgba(56, 189, 248, 0.1)',
    iconType: 'lightbulb',
  },
  {
    id: 'careers',
    name: 'Career & Opportunities',
    desc: 'Internships, jobs, GSoC, and other opportunities.',
    discussions: '310',
    members: '2.0K',
    color: '#ec4899',
    borderColor: 'rgba(236, 72, 153, 0.4)',
    bgGlow: 'rgba(236, 72, 153, 0.1)',
    iconType: 'star',
  },
]

const POPULAR_CATEGORIES = [
  { name: 'Linux', count: '1.2K', color: '#eab308', icon: 'tux', id: 'linux' },
  { name: 'Installation', count: '860', color: '#3b82f6', icon: 'settings', id: 'installation' },
  { name: 'Command Line', count: '952', color: '#10b981', icon: 'terminal', id: 'command-line' },
  { name: 'Programming', count: '780', color: '#a855f7', icon: 'code', id: 'programming' },
  { name: 'Help & Support', count: '690', color: '#22c55e', icon: 'help', id: 'help' },
]

function renderCategoryIcon(type, color) {
  if (type === 'tux') {
    return (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 2C9.24 2 7 4.24 7 7v4c0 .35.04.7.1 1.03C5.3 12.67 4 14.67 4 17c0 2.2 1.8 4 4 4h8c2.2 0 4-1.8 4-4 0-2.33-1.3-4.33-3.1-4.97.06-.33.1-.68.1-1.03V7c0-2.76-2.24-5-5-5zm-2 6c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm4 0c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm-2 2.5c1.1 0 2 .45 2 1h-4c0-.55.9-1 2-1z" />
      </svg>
    )
  }
  if (type === 'terminal') return <Terminal size={20} />
  if (type === 'code') return <Code2 size={20} />
  if (type === 'settings') return <Settings size={20} />
  if (type === 'git-fork') return <GitFork size={20} />
  if (type === 'box') return <Box size={20} />
  if (type === 'grad') return <GraduationCap size={20} />
  if (type === 'users') return <Users size={20} />
  if (type === 'help') return <HelpCircle size={20} />
  if (type === 'calendar') return <Calendar size={20} />
  if (type === 'lightbulb') return <Lightbulb size={20} />
  if (type === 'star') return <Sparkles size={20} />
  return <Layers size={20} />
}

export default function Categories() {
  const navigate = useNavigate()

  const handleCategoryClick = (category) => {
    navigate(`/forum?category=${category.id}`)
  }

  return (
    <div className="cat-page-container">
      <div className="cat-main-content">
        <div className="cat-hero-banner">
          <div className="cat-hero-text">
            <h1 className="cat-hero-title">Categories</h1>
            <p className="cat-hero-desc">
              Explore topics, ask questions, share knowledge, and find your community.
            </p>
          </div>

          <div className="cat-hero-artwork">
            <div className="cat-signpost">
              <span className="signpost-plate signpost-blue">ASK</span>
              <span className="signpost-plate signpost-gold">LEARN</span>
              <span className="signpost-plate signpost-green">SHARE</span>
              <span className="signpost-plate signpost-purple">GROW</span>
              <div className="signpost-pole"></div>
            </div>

            <div className="cat-tux-explorer">
              <svg viewBox="0 0 100 110" className="cat-tux-svg">
                <ellipse cx="50" cy="65" rx="28" ry="34" fill="#0f172a" />
                <ellipse cx="50" cy="68" rx="19" ry="26" fill="#f8fafc" />
                <circle cx="50" cy="32" r="18" fill="#0f172a" />
                <ellipse cx="44" cy="29" rx="3.5" ry="5" fill="#f8fafc" />
                <circle cx="45" cy="29" r="2" fill="#090d16" />
                <ellipse cx="56" cy="29" rx="3.5" ry="5" fill="#f8fafc" />
                <circle cx="55" cy="29" r="2" fill="#090d16" />
                <polygon points="46,34 54,34 50,42" fill="#f59e0b" />
                <ellipse cx="25" cy="65" rx="6" ry="18" fill="#0f172a" transform="rotate(-15 25 65)" />
                <ellipse cx="75" cy="65" rx="6" ry="18" fill="#0f172a" transform="rotate(15 75 65)" />
                <ellipse cx="38" cy="100" rx="10" ry="5" fill="#f59e0b" />
                <ellipse cx="62" cy="100" rx="10" ry="5" fill="#f59e0b" />
                <rect x="22" y="48" width="10" height="24" rx="4" fill="#059669" />
              </svg>
            </div>

            <div className="cat-banner-quote">
              <span>Open Minds</span>
              <span>Build Brighter</span>
              <span>Futures</span>
            </div>
          </div>
        </div>

        <div className="cat-cards-grid">
          {CATEGORIES_DATA.map((item) => (
            <div
              key={item.id}
              className="cat-card"
              style={{
                '--cat-color': item.color,
                '--cat-border': item.borderColor,
                '--cat-glow': item.bgGlow,
              }}
              onClick={() => handleCategoryClick(item)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCategoryClick(item)
              }}
            >
              <div className="cat-card-top">
                <div className="cat-card-icon" style={{ background: item.bgGlow, color: item.color, borderColor: item.borderColor }}>
                  {renderCategoryIcon(item.iconType, item.color)}
                </div>
                <div className="cat-card-title-row">
                  <h3 className="cat-card-name">{item.name}</h3>
                </div>
                <ChevronRight size={18} className="cat-card-arrow" />
              </div>

              <p className="cat-card-desc">{item.desc}</p>


              <div className="cat-card-footer">
                <span className="cat-stat">
                  <MessageSquare size={13} />
                  {item.discussions} discussions
                </span>
                <span className="cat-stat">
                  <Users size={13} />
                  {item.members} members
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <aside className="cat-sidebar-widgets">
        <div className="cat-widget-card stats-widget">
          <h4 className="cat-widget-title">Community Stats</h4>
          <div className="cat-stats-grid">
            <div className="cat-stat-box">
              <Users size={18} className="cat-stat-icon icon-blue" />
              <span className="cat-stat-val">1.2K</span>
              <span className="cat-stat-lbl">Members</span>
            </div>
            <div className="cat-stat-box">
              <FileText size={18} className="cat-stat-icon icon-cyan" />
              <span className="cat-stat-val">450</span>
              <span className="cat-stat-lbl">Discussions</span>
            </div>
            <div className="cat-stat-box">
              <Layers size={18} className="cat-stat-icon icon-indigo" />
              <span className="cat-stat-val">12</span>
              <span className="cat-stat-lbl">Categories</span>
            </div>
            <div className="cat-stat-box">
              <Calendar size={18} className="cat-stat-icon icon-purple" />
              <span className="cat-stat-val">25</span>
              <span className="cat-stat-lbl">Events</span>
            </div>
          </div>
        </div>

        <div className="cat-widget-card quote-widget">
          <div className="quote-widget-content">
            <p className="quote-widget-text">“Knowledge grows when shared.”</p>
            <span className="quote-widget-author">— GLUG</span>
          </div>
          <div className="quote-widget-art">
            <svg viewBox="0 0 100 80" className="quote-plant-svg">
              <ellipse cx="68" cy="50" rx="16" ry="22" fill="#0f172a" />
              <ellipse cx="68" cy="52" rx="11" ry="16" fill="#f8fafc" />
              <circle cx="68" cy="26" r="11" fill="#0f172a" />
              <circle cx="65" cy="24" r="1.5" fill="#f8fafc" />
              <polygon points="62,28 66,28 64,33" fill="#f59e0b" />
              <path d="M30 65 Q 32 35 34 25" stroke="#22c55e" strokeWidth="3" fill="none" strokeLinecap="round" />
              <path d="M34 38 Q 44 32 46 22 Q 38 24 34 36" fill="#4ade80" />
              <path d="M32 46 Q 20 40 18 30 Q 26 32 32 44" fill="#4ade80" />
              <path d="M34 25 Q 36 15 40 12 Q 38 20 34 25" fill="#22c55e" />
              <ellipse cx="32" cy="65" rx="12" ry="4" fill="#3f3f46" />
            </svg>
          </div>
        </div>

        <div className="cat-widget-card popular-widget">
          <h4 className="cat-widget-title">Popular Categories</h4>
          <div className="popular-list">
            {POPULAR_CATEGORIES.map((cat) => (
              <Link
                key={cat.name}
                to={`/forum?category=${cat.id}`}
                className="popular-item"
              >
                <div className="popular-item-left">
                  <span className="popular-bullet" style={{ color: cat.color }}>
                    {renderCategoryIcon(cat.icon, cat.color)}
                  </span>
                  <span className="popular-name">{cat.name}</span>
                </div>
                <span className="popular-count">{cat.count}</span>
              </Link>
            ))}
          </div>
        </div>

        <div className="cat-widget-card join-widget">
          <h4 className="cat-widget-title">New to GLUG?</h4>
          <p className="join-widget-desc">
            Introduce yourself and be part of an amazing community!
          </p>
          <Link to="/forum" className="join-widget-btn">
            Join the Discussion <ArrowRight size={15} />
          </Link>
        </div>
      </aside>
    </div>
  )
}
