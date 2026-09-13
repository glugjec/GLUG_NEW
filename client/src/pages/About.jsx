import { Link } from 'react-router-dom'
import {
  ExternalLink,
  Globe,
  Terminal,
  Code2,
  Users,
  BookOpen,
  Heart,
  Shield,
  Sparkles,
  ArrowRight,
  Compass,
  Cpu,
  Layers,
  MessageSquare,
  Flame,
  CheckCircle2
} from 'lucide-react'
import './About.css'

const CORE_PILLARS = [
  {
    icon: Compass,
    title: 'Software Freedom & FOSS',
    description:
      'We champion open-source culture, empowering students to study, inspect, modify, and distribute software freely while building modern technological sovereignty.',
    accent: '#38bdf8'
  },
  {
    icon: Terminal,
    title: 'Hands-on Engineering',
    description:
      'Theory comes alive through real command lines. Our browser-based Linux terminal and cloud sandbox allow friction-free practice with zero local setup.',
    accent: '#3b82f6'
  },
  {
    icon: Users,
    title: 'Student Mentorship',
    description:
      'Seniors and alumni actively guide junior batches in Linux administration, git workflows, systems programming, and modern software development.',
    accent: '#10b981'
  },
  {
    icon: Cpu,
    title: 'Collaborative Projects',
    description:
      'From campus utilities to open-source contributions, we collaborate on projects that solve real problems and build real-world portfolio experience.',
    accent: '#a855f7'
  }
]

const FEATURES_LIST = [
  {
    icon: Terminal,
    title: 'In-Browser Linux Terminal',
    description: '35+ POSIX utilities, full virtual filesystem, piping, and interactive nano editor right in your browser.'
  },
  {
    icon: Code2,
    title: 'Cloud Compiler & Sandbox',
    description: 'Run C, C++, Python, Java, Go, Rust, and JavaScript with interactive input support and instant output.'
  },
  {
    icon: MessageSquare,
    title: 'Technical Discussion Forum',
    description: 'Threaded discussions, markdown formatting, syntax highlighting, and fair scoring for student Q&A.'
  },
  {
    icon: BookOpen,
    title: 'Curated Roadmaps & Guides',
    description: 'Step-by-step guides for Linux installation, Git mastery, system configuration, and distro selection.'
  }
]

const STATS = [
  { value: '35+', label: 'Terminal Commands' },
  { value: '8+', label: 'Compiled Languages' },
  { value: '12+', label: 'Linux Distros Covered' },
  { value: '100%', label: 'Open Source Spirit' }
]

export default function About() {
  return (
    <div className="about-page">
      <div className="about-hero">
        <div className="about-badge">
          <Sparkles size={14} className="about-badge-icon" />
          <span>GNU/Linux User Group · Jorhat Engineering College</span>
        </div>

        <h1 className="about-hero-title">
          Fostering Open Source & <span className="about-gradient-text">Technical Excellence</span>
        </h1>

        <p className="about-hero-subtitle">
          GLUG JEC is a student-driven initiative at Jorhat Engineering College dedicated to promoting
          Linux adoption, software freedom, systems engineering, and collaborative technical growth.
        </p>

        <div className="about-hero-actions">
          <a
            href="https://glugjec.com"
            target="_blank"
            rel="noopener noreferrer"
            className="about-btn-primary"
          >
            <Globe size={18} />
            <span>Visit Main Website</span>
            <ExternalLink size={15} className="about-ext-icon" />
          </a>

          <Link to="/forum" className="about-btn-secondary">
            <MessageSquare size={17} />
            <span>Community Forum</span>
          </Link>

          <Link to="/members" className="about-btn-secondary">
            <Users size={17} />
            <span>Meet Members</span>
          </Link>
        </div>
      </div>

      <div className="about-main-site-banner">
        <div className="about-banner-backdrop" />
        <div className="about-banner-content">
          <div className="about-banner-left">
            <div className="about-banner-tag">
              <Flame size={14} /> Official Portal
            </div>
            <h2 className="about-banner-title">Explore the Official GLUG JEC Website</h2>
            <p className="about-banner-desc">
              Discover official club announcements, annual activity records, workshop schedules, and upcoming hackathon registration on our central club portal.
            </p>
          </div>

          <div className="about-banner-right">
            <a
              href="https://glugjec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-banner-btn"
            >
              <span>Visit Main Website</span>
              <ExternalLink size={16} />
            </a>
          </div>
        </div>
      </div>

      <div className="about-stats-grid">
        {STATS.map((stat, idx) => (
          <div key={idx} className="about-stat-card">
            <div className="about-stat-value">{stat.value}</div>
            <div className="about-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      <section className="about-section">
        <div className="about-section-header">
          <h2 className="about-section-title">Our Core Pillars</h2>
          <p className="about-section-desc">
            The foundation of everything we build, practice, and share within our technical community.
          </p>
        </div>

        <div className="about-pillars-grid">
          {CORE_PILLARS.map((pillar, idx) => {
            const Icon = pillar.icon
            return (
              <div key={idx} className="about-pillar-card">
                <div
                  className="about-pillar-icon-wrap"
                  style={{
                    color: pillar.accent,
                    background: `${pillar.accent}14`,
                    borderColor: `${pillar.accent}33`
                  }}
                >
                  <Icon size={24} />
                </div>
                <h3 className="about-pillar-title">{pillar.title}</h3>
                <p className="about-pillar-desc">{pillar.description}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section className="about-section">
        <div className="about-section-header">
          <h2 className="about-section-title">Built For Student Engineers</h2>
          <p className="about-section-desc">
            Equipped with modern developer tools integrated directly into the browser.
          </p>
        </div>

        <div className="about-features-grid">
          {FEATURES_LIST.map((feat, idx) => {
            const Icon = feat.icon
            return (
              <div key={idx} className="about-feature-card">
                <div className="about-feature-icon-wrap">
                  <Icon size={20} />
                </div>
                <div className="about-feature-body">
                  <h4 className="about-feature-title">{feat.title}</h4>
                  <p className="about-feature-desc">{feat.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      <section className="about-cta-section">
        <div className="about-cta-card">
          <h2 className="about-cta-title">Ready to Dive Into Linux & Open Source?</h2>
          <p className="about-cta-subtitle">
            Join discussions, test commands in our terminal, or browse curated roadmaps prepared by our community.
          </p>

          <div className="about-cta-actions">
            <Link to="/terminal" className="about-cta-btn-primary">
              <Terminal size={17} />
              <span>Launch Terminal</span>
            </Link>
            <Link to="/compiler" className="about-cta-btn-secondary">
              <Code2 size={17} />
              <span>Open Compiler</span>
            </Link>
            <a
              href="https://glugjec.com"
              target="_blank"
              rel="noopener noreferrer"
              className="about-cta-btn-outline"
            >
              <Globe size={17} />
              <span>Main Website</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}
