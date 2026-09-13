import { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  MessageSquare,
  ExternalLink,
  Globe,
  Shield,
  Award,
  Sparkles,
  RefreshCw,
  AlertCircle,
  Crown,
  Compass,
  GraduationCap,
} from 'lucide-react';
import { membersApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { avatarInitials, avatarColor } from '../components/common/avatar.js';
import './Members.css';

function GithubIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
    </svg>
  );
}

function LinkedinIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

function TwitterIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

const TIER_CONFIG = {
  'Mentor': { weight: 1, label: 'Mentor', color: 'purple', icon: Sparkles },
  'Alumni': { weight: 2, label: 'Alumni', color: 'orange', icon: GraduationCap },
  'Head': { weight: 3, label: 'Club Head', color: 'gold', icon: Crown },
  'Club Head': { weight: 3, label: 'Club Head', color: 'gold', icon: Crown },
  'Advisor': { weight: 4, label: 'Advisor', color: 'blue', icon: Compass },
  'Co-Head': { weight: 5, label: 'Co-Head', color: 'purple', icon: Shield },
  'Team Lead': { weight: 6, label: 'Team Lead', color: 'cyan', icon: Award },
  'Lead': { weight: 6, label: 'Team Lead', color: 'cyan', icon: Award },
  'Coordinator': { weight: 7, label: 'Coordinator', color: 'emerald', icon: Users },
};

const HIERARCHY_SECTIONS = [
  {
    key: 'Mentor',
    title: 'Mentors',
    description: 'Guiding the community with technical wisdom and long-term vision',
    icon: Sparkles,
    color: 'purple',
  },
  {
    key: 'Alumni',
    title: 'Alumni',
    description: 'Former core members and leaders continuing to guide and support GLUG',
    icon: GraduationCap,
    color: 'orange',
  },
  {
    key: 'Head',
    title: 'Club Heads',
    description: 'Leading club vision, executive operations, and community initiatives',
    icon: Crown,
    color: 'gold',
  },
  {
    key: 'Advisor',
    title: 'Advisors',
    description: 'Providing strategic counsel, technical direction, and mentorship',
    icon: Compass,
    color: 'blue',
  },
  {
    key: 'Co-Head',
    title: 'Co-Heads',
    description: 'Managing club initiatives, operations, and cross-team execution',
    icon: Shield,
    color: 'purple',
  },
  {
    key: 'Team Lead',
    title: 'Team Leads',
    description: 'Spearheading domains, technical projects, and creative tracks',
    icon: Award,
    color: 'cyan',
  },
  {
    key: 'Coordinator',
    title: 'Coordinators',
    description: 'Driving active programs, student outreach, and daily activities',
    icon: Users,
    color: 'emerald',
  },
];

function MemberAvatar({ src, username, name }) {
  const [error, setError] = useState(false);
  const displayName = name || username || 'Member';

  useEffect(() => {
    setError(false);
  }, [src]);

  const isValid = Boolean(
    src && typeof src === 'string' && (src.startsWith('http') || src.startsWith('/') || src.startsWith('data:'))
  );

  if (isValid && !error) {
    return (
      <img
        src={src}
        alt={displayName}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="member-card-avatar"
      />
    );
  }

  return (
    <div
      className="member-card-avatar fallback"
      style={{
        background: avatarColor(displayName),
        color: '#ffffff',
      }}
    >
      {avatarInitials(displayName)}
    </div>
  );
}

export default function Members() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await membersApi.getTeam();
      setMembers(res.team || []);
    } catch (err) {
      console.error('[Members Fetch Error]', err);
      setError(err.message || 'Failed to load community members');
    } finally {
      setLoading(false);
    }
  };

  const domains = useMemo(() => {
    const list = new Set(['all']);
    members.forEach((m) => {
      if (m.communityRole?.teamDomain) {
        list.add(m.communityRole.teamDomain.toLowerCase());
      }
    });
    return Array.from(list);
  }, [members]);

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return members.filter((m) => {
      const matchDomain =
        domainFilter === 'all' ||
        (m.communityRole?.teamDomain && m.communityRole.teamDomain.toLowerCase() === domainFilter);

      if (!matchDomain) return false;

      if (!q) return true;

      const nameMatch = m.username?.toLowerCase().includes(q);
      const titleMatch = m.communityRole?.positionTitle?.toLowerCase().includes(q);
      const categoryMatch = m.communityRole?.category?.toLowerCase().includes(q);
      const domainMatch = m.communityRole?.teamDomain?.toLowerCase().includes(q);
      const skillMatch = (m.skills || []).some((s) => s.toLowerCase().includes(q));

      return nameMatch || titleMatch || categoryMatch || domainMatch || skillMatch;
    });
  }, [members, searchQuery, domainFilter]);

  const groupedMembers = useMemo(() => {
    const map = {
      'Mentor': [],
      'Alumni': [],
      'Head': [],
      'Advisor': [],
      'Co-Head': [],
      'Team Lead': [],
      'Coordinator': [],
    };

    filteredMembers.forEach((m) => {
      let category = m.communityRole?.category;
      if (category === 'Lead') category = 'Team Lead';
      if (category === 'Club Head') category = 'Head';
      if (!category) {
        category = m.role === 'admin' ? 'Head' : 'Coordinator';
      }
      if (map[category]) {
        map[category].push(m);
      } else {
        map['Coordinator'].push(m);
      }
    });

    const sortFn = (a, b) => {
      const orderA = a.communityRole?.order ?? 99;
      const orderB = b.communityRole?.order ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return (a.username || '').localeCompare(b.username || '');
    };

    Object.keys(map).forEach((k) => {
      map[k].sort(sortFn);
    });

    return map;
  }, [filteredMembers]);

  const handleStartChat = (targetUserId) => {
    if (!user) {
      navigate('/login?redirect=/members');
      return;
    }
    navigate(`/chat?with=${targetUserId}`);
  };

  const renderCard = (m) => {
    let category = m.communityRole?.category;
    if (category === 'Lead') category = 'Team Lead';
    if (category === 'Club Head') category = 'Head';
    if (!category) {
      category = m.role === 'admin' ? 'Head' : 'Coordinator';
    }

    const tierMeta = TIER_CONFIG[category] || { label: category, color: 'emerald', icon: Users };
    const IconComponent = tierMeta.icon || Users;
    const positionTitle = m.communityRole?.positionTitle || tierMeta.label;
    const teamDomain = m.communityRole?.teamDomain || 'Core';

    return (
      <div key={m.id} className={`member-card tier-${tierMeta.color}`}>
        <div className="member-card-glow" />
        <div className="member-card-top">
          <div className="member-avatar-wrap">
            <MemberAvatar src={m.avatar} username={m.username} />
            <span className="member-status-dot" title="Active Community Member" />
          </div>

          <div className="member-tier-pill-wrap">
            <span className={`member-tier-badge ${tierMeta.color}`}>
              <IconComponent size={12} />
              <span>{category}</span>
            </span>
          </div>
        </div>

        <div className="member-info">
          <div className="member-title-row">
            <h3 className="member-name">
              <Link to={`/profile/${m.username}`}>{m.username}</Link>
            </h3>
            <span className="member-domain-chip">{teamDomain}</span>
          </div>

          <p className="member-position-title">{positionTitle}</p>

          {m.bio && <p className="member-bio">{m.bio}</p>}

          {m.skills && m.skills.length > 0 && (
            <div className="member-skills-row">
              {m.skills.slice(0, 3).map((skill, idx) => (
                <span key={idx} className="member-skill-tag">
                  {skill}
                </span>
              ))}
              {m.skills.length > 3 && (
                <span className="member-skill-more">+{m.skills.length - 3}</span>
              )}
            </div>
          )}
        </div>

        <div className="member-card-footer">
          <div className="member-socials">
            {m.socials?.github && (
              <a
                href={m.socials.github.startsWith('http') ? m.socials.github : `https://github.com/${m.socials.github}`}
                target="_blank"
                rel="noreferrer"
                className="member-social-btn"
                title="GitHub"
              >
                <GithubIcon size={14} />
              </a>
            )}
            {m.socials?.linkedin && (
              <a
                href={m.socials.linkedin.startsWith('http') ? m.socials.linkedin : `https://linkedin.com/in/${m.socials.linkedin}`}
                target="_blank"
                rel="noreferrer"
                className="member-social-btn"
                title="LinkedIn"
              >
                <LinkedinIcon size={14} />
              </a>
            )}
            {m.socials?.website && (
              <a
                href={m.socials.website.startsWith('http') ? m.socials.website : `https://${m.socials.website}`}
                target="_blank"
                rel="noreferrer"
                className="member-social-btn"
                title="Portfolio"
              >
                <Globe size={14} />
              </a>
            )}
            {m.socials?.twitter && (
              <a
                href={m.socials.twitter.startsWith('http') ? m.socials.twitter : `https://twitter.com/${m.socials.twitter}`}
                target="_blank"
                rel="noreferrer"
                className="member-social-btn"
                title="Twitter"
              >
                <TwitterIcon size={14} />
              </a>
            )}
          </div>

          <div className="member-card-actions">
            {user?.id !== m.id && (
              <button
                type="button"
                className="member-chat-btn"
                onClick={() => handleStartChat(m.id)}
                title={`Chat with ${m.username}`}
              >
                <MessageSquare size={14} />
                <span>Chat</span>
              </button>
            )}
            <Link
              to={`/profile/${m.username}`}
              className="member-profile-btn"
              title="View Profile"
            >
              <ExternalLink size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  };

  const totalMembersCount = filteredMembers.length;

  return (
    <div className="members-page">
      <section className="members-hero">
        <div className="members-hero-badge">
          <Sparkles size={14} />
          <span>GLUG Community Team</span>
        </div>
        <h1 className="members-hero-title">Meet the Builders & Leaders</h1>
        <p className="members-hero-subtitle">
          The team guiding the GNU/Linux User Group — driving workshops, hackathons, open source projects, and community mentorship.
        </p>

        <div className="members-controls">
          <div className="members-search-box">
            <Search className="members-search-icon" size={17} />
            <input
              type="text"
              placeholder="Search team members by name, title, or domain..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="members-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="members-search-clear"
                onClick={() => setSearchQuery('')}
              >
                Clear
              </button>
            )}
          </div>

          <div className="members-domain-tabs" role="tablist">
            {domains.map((dom) => (
              <button
                key={dom}
                type="button"
                className={`members-domain-tab ${domainFilter === dom ? 'active' : ''}`}
                onClick={() => setDomainFilter(dom)}
              >
                <Compass size={13} />
                <span>{dom === 'all' ? 'All Domains' : dom.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="members-content">
        {loading ? (
          <div className="members-loading-state">
            <RefreshCw className="members-spin" size={28} />
            <p>Loading community team members...</p>
          </div>
        ) : error ? (
          <div className="members-error-state">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button type="button" onClick={fetchTeam} className="members-retry-btn">
              Try Again
            </button>
          </div>
        ) : totalMembersCount === 0 ? (
          <div className="members-empty-state">
            <Users size={36} />
            <h3>No team members found</h3>
            <p>
              {searchQuery || domainFilter !== 'all'
                ? 'Try adjusting your search query or domain filter.'
                : 'Team members will appear here once assigned in the admin panel.'}
            </p>
          </div>
        ) : (
          <div className="members-sections-wrap">
            {HIERARCHY_SECTIONS.map((section) => {
              const list = groupedMembers[section.key] || [];
              if (list.length === 0) return null;
              const IconComp = section.icon;

              return (
                <section key={section.key} className="members-tier-group">
                  <div className="members-tier-header">
                    <div className={`tier-header-icon ${section.color}`}>
                      <IconComp size={18} />
                    </div>
                    <div className="tier-header-text">
                      <h2>{section.title}</h2>
                      <span>{section.description}</span>
                    </div>
                    <span className="tier-count-chip">{list.length}</span>
                  </div>
                  <div className="members-grid">
                    {list.map(renderCard)}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
