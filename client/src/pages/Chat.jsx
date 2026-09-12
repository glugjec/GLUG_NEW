import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Search,
  Check,
  CheckCheck,
  Shield,
  Crown,
  Award,
  Clock,
  ArrowLeft,
  ExternalLink,
  User,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { chatApi } from '../api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { avatarInitials, avatarColor } from '../components/common/avatar.js';
import './Chat.css';

function ChatAvatar({ src, username, size = 42 }) {
  const [error, setError] = useState(false);
  const name = username || 'User';

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
        alt={name}
        referrerPolicy="no-referrer"
        onError={() => setError(true)}
        className="chat-avatar-img"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="chat-avatar-fallback"
      style={{
        width: size,
        height: size,
        background: avatarColor(name),
        color: '#ffffff',
      }}
    >
      {avatarInitials(name)}
    </div>
  );
}

function formatChatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function Chat() {
  const { user, authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const withUserId = searchParams.get('with');

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [mobilePane, setMobilePane] = useState('list');

  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const activeConvRef = useRef(null);

  useEffect(() => {
    activeConvRef.current = activeConversation;
  }, [activeConversation]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login?redirect=/chat');
      return;
    }
    if (user) {
      loadConversations();
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (withUserId && user) {
      initializeDirectChat(withUserId);
    }
  }, [withUserId, user]);

  useEffect(() => {
    if (activeConversation?.id) {
      loadMessages(activeConversation.id);
      setMobilePane('chat');

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = setInterval(() => {
        if (activeConvRef.current?.id) {
          silentPollMessages(activeConvRef.current.id);
        }
      }, 3500);

      return () => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      };
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const res = await chatApi.getConversations();
      setConversations(res.conversations || []);
    } catch (err) {
      console.error('[Chat Load Conversations Error]', err);
    } finally {
      setLoadingConversations(false);
    }
  };

  const initializeDirectChat = async (targetId) => {
    try {
      setLoadingMessages(true);
      const res = await chatApi.getOrCreateWithUser(targetId);
      if (res.conversation) {
        setActiveConversation(res.conversation);
        setConversations((prev) => {
          const exists = prev.some((c) => c.id === res.conversation.id);
          if (exists) {
            return prev.map((c) => (c.id === res.conversation.id ? res.conversation : c));
          }
          return [res.conversation, ...prev];
        });
      }
    } catch (err) {
      console.error('[Initialize Direct Chat Error]', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadMessages = async (convId) => {
    try {
      setLoadingMessages(true);
      const res = await chatApi.getMessages(convId);
      setMessages(res.messages || []);
      setConversations((prev) =>
        prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
      );
    } catch (err) {
      console.error('[Load Messages Error]', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const silentPollMessages = async (convId) => {
    try {
      const res = await chatApi.getMessages(convId);
      const latestMessages = res.messages || [];
      setMessages((prev) => {
        if (latestMessages.length !== prev.length) {
          return latestMessages;
        }
        return prev;
      });

      const convRes = await chatApi.getConversations();
      if (convRes.conversations) {
        setConversations(convRes.conversations);
      }
    } catch {
    }
  };

  const handleSendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activeConversation?.id || sending) return;

    const outgoingText = messageText.trim();
    setMessageText('');

    const optimisticId = `temp-${Date.now()}`;
    const optimisticMsg = {
      id: optimisticId,
      conversationId: activeConversation.id,
      sender: user.id,
      recipient: activeConversation.otherUser?.id,
      text: outgoingText,
      read: false,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, optimisticMsg]);

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              lastMessage: {
                text: outgoingText,
                sender: user.id,
                createdAt: optimisticMsg.createdAt,
              },
            }
          : c
      )
    );

    try {
      setSending(true);
      const res = await chatApi.sendMessage(activeConversation.id, outgoingText);
      setMessages((prev) =>
        prev.map((m) => (m.id === optimisticId ? res.message : m))
      );
    } catch (err) {
      console.error('[Send Message Error]', err);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setMessageText(outgoingText);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        c.otherUser?.username?.toLowerCase().includes(q) ||
        c.otherUser?.communityRole?.positionTitle?.toLowerCase().includes(q) ||
        c.lastMessage?.text?.toLowerCase().includes(q)
    );
  }, [conversations, searchQuery]);

  if (authLoading) {
    return (
      <div className="chat-loading-screen">
        <RefreshCw className="chat-spin" size={32} />
        <p>Loading your messages...</p>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <aside className={`chat-sidebar ${mobilePane === 'chat' ? 'hide-mobile' : ''}`}>
        <div className="chat-sidebar-header">
          <div className="chat-sidebar-title-row">
            <div className="chat-sidebar-title">
              <MessageSquare size={19} className="text-blue" />
              <h2>Direct Messages</h2>
            </div>
            {conversations.some((c) => c.unreadCount > 0) && (
              <span className="chat-unread-badge">
                {conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)}
              </span>
            )}
          </div>

          <div className="chat-search-wrap">
            <Search size={15} className="chat-search-icon" />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="chat-search-input"
            />
          </div>
        </div>

        <div className="chat-conversations-list">
          {loadingConversations ? (
            <div className="chat-list-loading">
              <RefreshCw className="chat-spin" size={20} />
              <span>Loading conversations...</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="chat-list-empty">
              <MessageSquare size={28} />
              <p>No conversations yet</p>
              <span>Connect with community members from the Members directory.</span>
              <Link to="/members" className="chat-browse-members-btn">
                Browse Members
              </Link>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const other = conv.otherUser;
              const isActive = activeConversation?.id === conv.id;
              const hasUnread = conv.unreadCount > 0;
              const category = other?.communityRole?.category;
              const positionTitle = other?.communityRole?.positionTitle;

              return (
                <button
                  key={conv.id}
                  type="button"
                  className={`chat-conv-item ${isActive ? 'active' : ''} ${hasUnread ? 'unread' : ''}`}
                  onClick={() => {
                    setActiveConversation(conv);
                    setSearchParams({ with: other?.id });
                  }}
                >
                  <div className="chat-conv-avatar-wrap">
                    <ChatAvatar src={other?.avatar} username={other?.username} size={44} />
                    {category && <span className="chat-conv-team-dot" title="Community Team" />}
                  </div>

                  <div className="chat-conv-body">
                    <div className="chat-conv-top-row">
                      <span className="chat-conv-name">{other?.username || 'Member'}</span>
                      <span className="chat-conv-time">
                        {formatChatTime(conv.lastMessage?.createdAt || conv.updatedAt)}
                      </span>
                    </div>

                    <div className="chat-conv-mid-row">
                      {category && (
                        <span className="chat-conv-role-chip">
                          {positionTitle || category}
                        </span>
                      )}
                    </div>

                    <div className="chat-conv-bottom-row">
                      <p className="chat-conv-preview">
                        {conv.lastMessage?.text || 'Started a conversation'}
                      </p>
                      {hasUnread && (
                        <span className="chat-conv-badge">{conv.unreadCount}</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <main className={`chat-main-pane ${mobilePane === 'list' ? 'hide-mobile' : ''}`}>
        {activeConversation ? (
          <div className="chat-thread-wrap">
            <header className="chat-header">
              <button
                type="button"
                className="chat-back-mobile-btn"
                onClick={() => setMobilePane('list')}
                title="Back to conversations"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="chat-header-user-info">
                <ChatAvatar
                  src={activeConversation.otherUser?.avatar}
                  username={activeConversation.otherUser?.username}
                  size={42}
                />
                <div className="chat-header-meta">
                  <div className="chat-header-name-row">
                    <span className="chat-header-name">
                      {activeConversation.otherUser?.username || 'Member'}
                    </span>
                    {activeConversation.otherUser?.communityRole?.category && (
                      <span className="chat-header-team-badge">
                        <Crown size={12} />
                        <span>
                          {activeConversation.otherUser.communityRole.positionTitle ||
                            activeConversation.otherUser.communityRole.category}
                        </span>
                      </span>
                    )}
                  </div>
                  <span className="chat-header-status">
                    GLUG Community Member
                  </span>
                </div>
              </div>

              <div className="chat-header-actions">
                <Link
                  to={`/profile/${activeConversation.otherUser?.username}`}
                  className="chat-header-icon-btn"
                  title="View Profile"
                >
                  <ExternalLink size={16} />
                </Link>
              </div>
            </header>

            <div className="chat-messages-area">
              {loadingMessages ? (
                <div className="chat-messages-loading">
                  <RefreshCw className="chat-spin" size={24} />
                  <span>Loading message history...</span>
                </div>
              ) : messages.length === 0 ? (
                <div className="chat-messages-empty">
                  <Sparkles size={32} className="text-blue" />
                  <h3>Say hello to {activeConversation.otherUser?.username}!</h3>
                  <p>
                    Send a message to start chatting, ask questions about open source, or collaborate on projects.
                  </p>
                </div>
              ) : (
                messages.map((m) => {
                  const isMine = m.sender === user?.id || m.sender?.id === user?.id;

                  return (
                    <div
                      key={m.id}
                      className={`chat-bubble-row ${isMine ? 'mine' : 'theirs'}`}
                    >
                      {!isMine && (
                        <ChatAvatar
                          src={activeConversation.otherUser?.avatar}
                          username={activeConversation.otherUser?.username}
                          size={30}
                        />
                      )}

                      <div className={`chat-bubble ${isMine ? 'mine' : 'theirs'}`}>
                        <div className="chat-bubble-text">{m.text}</div>
                        <div className="chat-bubble-meta">
                          <span className="chat-bubble-time">
                            {new Date(m.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {isMine && (
                            <span className="chat-bubble-status">
                              {m.read ? (
                                <CheckCheck size={13} className="text-blue" />
                              ) : (
                                <Check size={13} />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={handleSendMessage}>
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message @${activeConversation.otherUser?.username || 'member'}... (Enter to send)`}
                rows={1}
                className="chat-textarea"
                maxLength={2000}
              />
              <button
                type="submit"
                disabled={!messageText.trim() || sending}
                className="chat-send-btn"
                title="Send message"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        ) : (
          <div className="chat-no-selection">
            <div className="chat-no-selection-inner">
              <div className="chat-no-selection-icon">
                <MessageSquare size={36} />
              </div>
              <h2>Your GLUG Inbox</h2>
              <p>
                Select a conversation from the sidebar or click "Chat" on any team member's card to start a 1-on-1 discussion.
              </p>
              <Link to="/members" className="chat-browse-btn">
                Browse Community Team
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
