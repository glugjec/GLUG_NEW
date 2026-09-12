import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Shield,
  Users,
  BookOpen,
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Lock,
  Unlock,
  Pin,
  PinOff,
  Check,
  Copy,
  Plus,
  Edit3,
  Activity,
  Eye,
  X,
  AlertCircle,
  Calendar,
  Layers,
  Server,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
  UserCheck,
  ShieldCheck,
  ArrowUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { adminApi, resourcesApi } from "../api.js";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "overview";

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalResources: 0,
    adminCount: 0,
    todayPosts: 0,
  });
  const [refreshingStats, setRefreshingStats] = useState(false);

  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  const [roleChangeTarget, setRoleChangeTarget] = useState(null);
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const [resources, setResources] = useState([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceToDelete, setResourceToDelete] = useState(null);
  const [isDeletingResource, setIsDeletingResource] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "getting-started",
    items: "",
  });

  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("all");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingAdminPost, setIsDeletingAdminPost] = useState(false);
  const [previewingPost, setPreviewingPost] = useState(null);

  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadStats() {
    if (!user || user.role !== "admin") return;
    setRefreshingStats(true);
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      showToast(err.message || "Failed to load dashboard metrics", "error");
    } finally {
      setRefreshingStats(false);
    }
  }

  useEffect(() => {
    loadStats();
  }, [user]);

  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "users") {
      if (users.length === 0) setLoadingUsers(true);
      const params = {};
      if (userSearch.trim()) params.q = userSearch.trim();
      if (userRoleFilter !== "all") params.role = userRoleFilter;

      adminApi
        .getUsers(params)
        .then((data) => setUsers(data.users || []))
        .catch((err) => showToast(err.message, "error"))
        .finally(() => setLoadingUsers(false));
    }
  }, [user, activeTab, userSearch, userRoleFilter]);

  useEffect(() => {
    if (user && user.role === "admin") {
      resourcesApi
        .list()
        .then((data) => setResources(data || []))
        .catch((err) => showToast(err.message, "error"));
    }
  }, [user]);

  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "moderation") {
      if (posts.length === 0) setLoadingPosts(true);
      const params = {};
      if (postSearch.trim()) params.q = postSearch.trim();

      adminApi
        .getPosts(params)
        .then((data) => setPosts(data.posts || []))
        .catch((err) => showToast(err.message, "error"))
        .finally(() => setLoadingPosts(false));
    }
  }, [user, activeTab, postSearch]);

  function copyToClipboard(text, id) {
    if (!navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedEmail(id);
      setTimeout(() => setCopiedEmail(null), 2000);
      showToast("Email address copied to clipboard");
    });
  }

  async function confirmRoleChange() {
    if (!roleChangeTarget) return;
    const newRole = roleChangeTarget.role === "admin" ? "student" : "admin";
    setIsUpdatingRole(true);
    try {
      await adminApi.updateUserRole(roleChangeTarget.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === roleChangeTarget.id ? { ...u, role: newRole } : u))
      );
      showToast(`Updated @${roleChangeTarget.username} to ${newRole}`);
      setRoleChangeTarget(null);
      loadStats();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsUpdatingRole(false);
    }
  }

  async function confirmDeleteUser() {
    if (!userToDelete) return;
    setIsDeletingUser(true);
    try {
      await adminApi.deleteUser(userToDelete.id);
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id));
      showToast(`User @${userToDelete.username} deleted`);
      setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
      setUserToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingUser(false);
    }
  }

  async function handleSaveResource(e) {
    e.preventDefault();
    const itemArray = resourceForm.items
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      if (editingResource) {
        const updated = await resourcesApi.update(editingResource.id, {
          title: resourceForm.title,
          description: resourceForm.description,
          category: resourceForm.category,
          items: itemArray,
        });
        setResources((prev) =>
          prev.map((r) => (r.id === editingResource.id ? updated : r))
        );
        showToast("Resource topic updated");
      } else {
        const created = await resourcesApi.create({
          title: resourceForm.title,
          description: resourceForm.description,
          category: resourceForm.category,
          items: itemArray,
        });
        setResources((prev) => [created, ...prev]);
        showToast("Resource topic published");
        setStats((prev) => ({ ...prev, totalResources: prev.totalResources + 1 }));
      }
      setResourceModalOpen(false);
      setEditingResource(null);
      setResourceForm({ title: "", description: "", category: "getting-started", items: "" });
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmDeleteResource() {
    if (!resourceToDelete) return;
    setIsDeletingResource(true);
    try {
      await resourcesApi.delete(resourceToDelete.id);
      setResources((prev) => prev.filter((r) => r.id !== resourceToDelete.id));
      showToast("Resource topic deleted");
      setStats((prev) => ({ ...prev, totalResources: Math.max(0, prev.totalResources - 1) }));
      setResourceToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingResource(false);
    }
  }

  async function handleTogglePin(post) {
    try {
      const res = await adminApi.togglePinPost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isPinned: res.isPinned } : p))
      );
      showToast(res.isPinned ? "Discussion pinned to top" : "Discussion unpinned");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function handleToggleLock(post) {
    try {
      const res = await adminApi.toggleLockPost(post.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, isLocked: res.isLocked } : p))
      );
      showToast(res.isLocked ? "Discussion locked from replies" : "Discussion unlocked");
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  async function confirmDeletePost() {
    if (!postToDelete) return;
    setIsDeletingAdminPost(true);
    try {
      await adminApi.deletePost(postToDelete.id);
      setPosts((prev) => prev.filter((p) => p.id !== postToDelete.id));
      showToast("Post and associated comments removed");
      setStats((prev) => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
      setPostToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingAdminPost(false);
    }
  }

  if (authLoading) {
    return (
      <div className="admin-page">
        <div className="admin-loading-state">
          <RefreshCw className="admin-spinner" size={28} />
          <p>Verifying administrator credentials...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-page">
        <div className="admin-denied-card">
          <div className="admin-denied-icon-wrap">
            <AlertCircle size={44} />
          </div>
          <h2>Administrator Access Required</h2>
          <p>
            You must be signed in with an administrator account to view the GLUG
            administration console.
          </p>
          <Link to="/" className="admin-primary-btn">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const filteredPosts = posts.filter((p) => {
    if (postCategoryFilter === "all") return true;
    return (p.category || "").toLowerCase() === postCategoryFilter.toLowerCase();
  });

  const studentCount = Math.max(0, (stats.totalUsers || 0) - (stats.adminCount || 0));

  return (
    <section className="admin-page">
      {toast && (
        <div className={`admin-toast ${toast.type}`}>
          {toast.type === "error" ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.msg}</span>
        </div>
      )}

      <header className="admin-header">
        <div className="admin-header-main">
          <div className="admin-title-badge">
            <Shield className="admin-badge-icon" size={20} />
            <span>Admin Control Panel</span>
          </div>
          <h1 className="admin-title">GLUG Administration Console</h1>
          <p className="admin-subtitle">
            Manage student community members, curate learning curriculum, moderate discussions, and monitor platform activity.
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={loadStats}
            disabled={refreshingStats}
            title="Refresh dashboard metrics"
          >
            <RefreshCw size={15} className={refreshingStats ? "admin-spin" : ""} />
            <span>Refresh Stats</span>
          </button>
          <Link to="/forum" className="admin-secondary-btn" title="Open Forum">
            <ExternalLink size={15} />
            <span>Open Forum</span>
          </Link>
        </div>
      </header>

      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Members</span>
            <div className="admin-stat-icon-wrap user-theme">
              <Users size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalUsers}</span>
            <span className="admin-stat-subtext">Registered accounts</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Forum Discussions</span>
            <div className="admin-stat-icon-wrap post-theme">
              <MessageSquare size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalPosts}</span>
            <span className="admin-stat-subtext">
              {stats.todayPosts || 0} created today
            </span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Comments</span>
            <div className="admin-stat-icon-wrap comment-theme">
              <Layers size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalComments}</span>
            <span className="admin-stat-subtext">Community replies</span>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Curated Resources</span>
            <div className="admin-stat-icon-wrap resource-theme">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="admin-stat-body">
            <span className="admin-stat-value">{stats.totalResources}</span>
            <span className="admin-stat-subtext">Published learning topics</span>
          </div>
        </div>
      </div>

      <div className="admin-tabs-nav">
        <nav className="admin-tabs" aria-label="Admin Sections">
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "overview" })}
          >
            <TrendingUp size={16} />
            <span>Overview</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "users" })}
          >
            <Users size={16} />
            <span>Users</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "moderation" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "moderation" })}
          >
            <MessageSquare size={16} />
            <span>Moderation</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "resources" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "resources" })}
          >
            <BookOpen size={16} />
            <span>Resources</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === "system" ? "active" : ""}`}
            onClick={() => setSearchParams({ tab: "system" })}
          >
            <Server size={16} />
            <span>System & Security</span>
          </button>
        </nav>
      </div>

      {activeTab === "overview" && (
        <div className="admin-tab-content">
          <div className="admin-overview-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Activity size={18} />
                  <span>Platform Distribution</span>
                </h3>
              </div>
              <div className="admin-distribution-list">
                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <UserCheck size={16} className="text-blue" />
                    <span>Students</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar student-bar"
                      style={{
                        width: stats.totalUsers > 0 ? `${(studentCount / stats.totalUsers) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{studentCount}</span>
                </div>

                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <ShieldCheck size={16} className="text-gold" />
                    <span>Administrators</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar admin-bar"
                      style={{
                        width: stats.totalUsers > 0 ? `${((stats.adminCount || 0) / stats.totalUsers) * 100}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{stats.adminCount || 0}</span>
                </div>

                <div className="admin-distribution-row">
                  <div className="admin-distribution-info">
                    <Calendar size={16} className="text-emerald" />
                    <span>Today's Posts</span>
                  </div>
                  <div className="admin-distribution-bar-wrap">
                    <div
                      className="admin-distribution-bar today-bar"
                      style={{
                        width: stats.totalPosts > 0 ? `${Math.min(100, ((stats.todayPosts || 0) / stats.totalPosts) * 100)}%` : "0%",
                      }}
                    />
                  </div>
                  <span className="admin-distribution-val">{stats.todayPosts || 0}</span>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Shield size={18} />
                  <span>Quick Administrative Actions</span>
                </h3>
              </div>
              <div className="admin-quick-actions">
                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => setSearchParams({ tab: "users" })}
                >
                  <Users size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Manage Users</strong>
                    <span>Search members and update roles</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => setSearchParams({ tab: "moderation" })}
                >
                  <MessageSquare size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Moderate Forum</strong>
                    <span>Pin, lock, or delete discussions</span>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-quick-action-btn"
                  onClick={() => {
                    setSearchParams({ tab: "resources" });
                    setEditingResource(null);
                    setResourceForm({ title: "", description: "", category: "getting-started", items: "" });
                    setResourceModalOpen(true);
                  }}
                >
                  <Plus size={16} />
                  <div className="admin-quick-action-text">
                    <strong>Publish Resource Topic</strong>
                    <span>Add curriculum learning guide</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "users" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search className="admin-search-icon" size={16} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search username or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
              />
              {userSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setUserSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-group">
              <select
                className="admin-select"
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="student">Students</option>
                <option value="admin">Administrators</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Activity</th>
                  <th className="admin-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers && users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <RefreshCw className="admin-spin" size={20} />
                      <span>Loading community members...</span>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <AlertCircle size={22} />
                      <span>No members match your criteria</span>
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div className="admin-user-cell">
                          {u.avatar ? (
                            <img src={u.avatar} alt={u.username} className="admin-user-avatar" />
                          ) : (
                            <div className="admin-user-avatar fallback">
                              {u.username.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="admin-user-meta">
                            <span className="admin-user-name">@{u.username}</span>
                            {u.isProtected && (
                              <span className="admin-shield-badge">Primary Admin</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="admin-email-cell">
                          <span className="admin-email-text">{u.email}</span>
                          <button
                            type="button"
                            className="admin-icon-btn"
                            onClick={() => copyToClipboard(u.email, u.id)}
                            title="Copy email address"
                          >
                            {copiedEmail === u.id ? <Check size={13} className="text-emerald" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-badge ${u.role}`}>
                          {u.role === "admin" ? <ShieldCheck size={12} /> : <UserCheck size={12} />}
                          <span>{u.role}</span>
                        </span>
                      </td>
                      <td>
                        <span className="admin-date-text">
                          {new Date(u.createdAt).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td>
                        <div className="admin-activity-chips">
                          <span className="admin-count-chip" title="Discussions created">
                            {u.stats?.posts || 0} posts
                          </span>
                          <span className="admin-count-chip" title="Replies posted">
                            {u.stats?.comments || 0} comments
                          </span>
                        </div>
                      </td>
                      <td className="admin-td-actions">
                        <div className="admin-actions-row">
                          {!u.isProtected && u.id !== user.id && (
                            <>
                              <button
                                type="button"
                                className="admin-action-btn"
                                onClick={() => setRoleChangeTarget(u)}
                                title={u.role === "admin" ? "Demote to student" : "Promote to administrator"}
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                              <button
                                type="button"
                                className="admin-action-btn danger"
                                onClick={() => setUserToDelete(u)}
                                title="Permanently delete user account"
                              >
                                <Trash2 size={13} />
                                <span>Delete</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "moderation" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <div className="admin-search-wrap">
              <Search className="admin-search-icon" size={16} />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search discussions by title or content..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
              />
              {postSearch && (
                <button
                  type="button"
                  className="admin-search-clear"
                  onClick={() => setPostSearch("")}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="admin-filter-group">
              <select
                className="admin-select"
                value={postCategoryFilter}
                onChange={(e) => setPostCategoryFilter(e.target.value)}
              >
                <option value="all">All Categories</option>
                <option value="general">General</option>
                <option value="projects">Projects</option>
                <option value="help">Help & Questions</option>
                <option value="events">Events</option>
                <option value="announcements">Announcements</option>
              </select>
            </div>
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Discussion</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Feedback</th>
                  <th>Moderation Status</th>
                  <th className="admin-th-actions">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingPosts && posts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <RefreshCw className="admin-spin" size={20} />
                      <span>Loading discussion topics...</span>
                    </td>
                  </tr>
                ) : filteredPosts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="admin-table-empty">
                      <AlertCircle size={22} />
                      <span>No discussions found</span>
                    </td>
                  </tr>
                ) : (
                  filteredPosts.map((p) => (
                    <tr key={p.id}>
                      <td className="admin-post-cell">
                        <div className="admin-post-title-wrap">
                          <Link to={`/forum/posts/${p.id}`} className="admin-post-title" target="_blank" rel="noopener noreferrer">
                            {p.title}
                          </Link>
                          <span className="admin-date-subtext">
                            {new Date(p.createdAt).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="admin-author-text">
                          @{p.author?.username || "unknown"}
                        </span>
                      </td>
                      <td>
                        <span className="admin-category-pill">#{p.category || "general"}</span>
                      </td>
                      <td>
                        <div className="admin-stats-row">
                          <span className="admin-count-chip" title="Vote score">
                            <ArrowUp size={12} className="text-emerald" />
                            <span>{p.voteScore}</span>
                          </span>
                          <span className="admin-count-chip" title="Comments count">
                            <MessageSquare size={12} className="text-blue" />
                            <span>{p.commentCount}</span>
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="admin-status-badges">
                          {p.isPinned && (
                            <span className="admin-badge pinned">
                              <Pin size={11} />
                              <span>Pinned</span>
                            </span>
                          )}
                          {p.isLocked && (
                            <span className="admin-badge locked">
                              <Lock size={11} />
                              <span>Locked</span>
                            </span>
                          )}
                          {!p.isPinned && !p.isLocked && (
                            <span className="admin-badge neutral">Active</span>
                          )}
                        </div>
                      </td>
                      <td className="admin-td-actions">
                        <div className="admin-actions-row">
                          <button
                            type="button"
                            className="admin-icon-btn secondary"
                            onClick={() => setPreviewingPost(p)}
                            title="Preview discussion body"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className={`admin-icon-btn ${p.isPinned ? "active" : ""}`}
                            onClick={() => handleTogglePin(p)}
                            title={p.isPinned ? "Unpin discussion" : "Pin discussion to top"}
                          >
                            {p.isPinned ? <PinOff size={14} /> : <Pin size={14} />}
                          </button>
                          <button
                            type="button"
                            className={`admin-icon-btn ${p.isLocked ? "active" : ""}`}
                            onClick={() => handleToggleLock(p)}
                            title={p.isLocked ? "Unlock replies" : "Lock replies"}
                          >
                            {p.isLocked ? <Unlock size={14} /> : <Lock size={14} />}
                          </button>
                          <button
                            type="button"
                            className="admin-icon-btn danger"
                            onClick={() => setPostToDelete(p)}
                            title="Delete discussion and comments"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "resources" && (
        <div className="admin-tab-content">
          <div className="admin-toolbar">
            <p className="admin-toolbar-desc">
              Curate and publish curriculum guides that sync live to the public{" "}
              <Link to="/resources" className="admin-link">
                /resources
              </Link>{" "}
              learning page.
            </p>

            <button
              type="button"
              className="admin-primary-btn"
              onClick={() => {
                setEditingResource(null);
                setResourceForm({
                  title: "",
                  description: "",
                  category: "getting-started",
                  items: "",
                });
                setResourceModalOpen(true);
              }}
            >
              <Plus size={16} />
              <span>Add Resource Topic</span>
            </button>
          </div>

          <div className="admin-resources-grid">
            {resources.length === 0 ? (
              <div className="admin-empty-card">
                <BookOpen size={36} />
                <h3>No Custom Resources Found</h3>
                <p>
                  The platform is currently rendering the default curriculum tracks. Click above to add your first database resource.
                </p>
              </div>
            ) : (
              resources.map((r) => (
                <article className="admin-resource-card" key={r.id}>
                  <div className="admin-resource-top">
                    <span className="admin-category-pill">#{r.category}</span>
                    <div className="admin-card-actions">
                      <button
                        type="button"
                        className="admin-icon-btn"
                        onClick={() => {
                          setEditingResource(r);
                          setResourceForm({
                            title: r.title,
                            description: r.description,
                            category: r.category,
                            items: (r.items || []).join("\n"),
                          });
                          setResourceModalOpen(true);
                        }}
                        title="Edit resource"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        className="admin-icon-btn danger"
                        onClick={() => setResourceToDelete(r)}
                        title="Delete resource"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="admin-resource-heading">{r.title}</h3>
                  <p className="admin-resource-summary">{r.description}</p>

                  {r.items && r.items.length > 0 && (
                    <div className="admin-resource-chips">
                      {r.items.map((item, idx) => (
                        <span className="admin-item-tag" key={idx}>
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </article>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === "system" && (
        <div className="admin-tab-content">
          <div className="admin-system-grid">
            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <Server size={18} />
                  <span>Platform & Infrastructure Health</span>
                </h3>
              </div>
              <div className="admin-system-info-list">
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">API Gateway Status</span>
                  <span className="admin-sys-badge healthy">
                    <CheckCircle2 size={12} />
                    <span>Online</span>
                  </span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Primary Database</span>
                  <span className="admin-sys-badge healthy">
                    <CheckCircle2 size={12} />
                    <span>Connected (MongoDB)</span>
                  </span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Node Runtime</span>
                  <span className="admin-sys-val">ES Modules / Express 4</span>
                </div>
                <div className="admin-system-info-row">
                  <span className="admin-sys-label">Client Build</span>
                  <span className="admin-sys-val">React 19 / Vite</span>
                </div>
              </div>
            </div>

            <div className="admin-card">
              <div className="admin-card-header">
                <h3 className="admin-card-title">
                  <ShieldCheck size={18} />
                  <span>Protected Super Administrators</span>
                </h3>
              </div>
              <p className="admin-card-desc">
                The following administrator accounts are protected by the backend authorization layer against accidental deletion or role demotion:
              </p>
              <div className="admin-protected-list">
                <div className="admin-protected-item">
                  <span className="admin-email-tag">glug.jec@gmail.com</span>
                  <span className="admin-shield-badge">Protected</span>
                </div>
                <div className="admin-protected-item">
                  <span className="admin-email-tag">admin@glug.dev</span>
                  <span className="admin-shield-badge">Protected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {resourceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setResourceModalOpen(false)}>
          <div className="admin-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 className="admin-modal-title">
                {editingResource ? "Edit Resource Topic" : "Publish Resource Topic"}
              </h2>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setResourceModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="admin-modal-form">
              <div className="admin-form-group">
                <label>Topic Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  placeholder="e.g. Linux Kernel Architecture"
                  value={resourceForm.title}
                  onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Category</label>
                <select
                  className="admin-select"
                  value={resourceForm.category}
                  onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                >
                  <option value="getting-started">Getting Started</option>
                  <option value="command-line">Command Line</option>
                  <option value="sysadmin">System Administration</option>
                  <option value="advanced">Advanced Topics</option>
                  <option value="tools">Tools & Environment</option>
                  <option value="tutorials">Tutorials & Guides</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Description</label>
                <textarea
                  className="admin-form-textarea"
                  required
                  rows={3}
                  placeholder="Summary of what members will learn in this topic..."
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Curriculum Sub-topics (one item per line)</label>
                <textarea
                  className="admin-form-textarea"
                  rows={4}
                  placeholder="Virtual File System&#10;Process Scheduling&#10;Memory Pages"
                  value={resourceForm.items}
                  onChange={(e) => setResourceForm({ ...resourceForm, items: e.target.value })}
                />
              </div>

              <div className="admin-modal-actions">
                <button
                  type="button"
                  className="admin-cancel-btn"
                  onClick={() => setResourceModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="admin-primary-btn">
                  {editingResource ? "Save Changes" : "Publish Topic"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewingPost && (
        <div className="admin-modal-overlay" onClick={() => setPreviewingPost(null)}>
          <div className="admin-modal-box preview" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div className="admin-preview-title-wrap">
                <span className="admin-category-pill">#{previewingPost.category}</span>
                <h2 className="admin-modal-title">{previewingPost.title}</h2>
              </div>
              <button
                type="button"
                className="admin-modal-close"
                onClick={() => setPreviewingPost(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="admin-preview-meta">
              <span>Author: <strong>@{previewingPost.author?.username || "unknown"}</strong></span>
              <span>•</span>
              <span>Score: <strong>{previewingPost.voteScore}</strong></span>
              <span>•</span>
              <span>Comments: <strong>{previewingPost.commentCount}</strong></span>
              <span>•</span>
              <span>{new Date(previewingPost.createdAt).toLocaleString()}</span>
            </div>

            <div className="admin-preview-body">
              {previewingPost.body ? (
                <div dangerouslySetInnerHTML={{ __html: previewingPost.body }} />
              ) : (
                <p className="text-muted">No content in discussion body.</p>
              )}
            </div>

            <div className="admin-modal-actions">
              <Link
                to={`/forum/posts/${previewingPost.id}`}
                className="admin-secondary-btn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink size={14} />
                <span>Open in Forum</span>
              </Link>
              <button
                type="button"
                className="admin-cancel-btn"
                onClick={() => setPreviewingPost(null)}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {roleChangeTarget && (
        <div className="admin-modal-overlay" onClick={() => !isUpdatingRole && setRoleChangeTarget(null)}>
          <div className="admin-modal-box alert" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-icon-alert">
              <AlertCircle size={32} />
            </div>
            <h2 className="admin-modal-title">Confirm Role Change</h2>
            <p className="admin-modal-desc">
              Are you sure you want to change the role of <strong>@{roleChangeTarget.username}</strong> to{" "}
              <strong>{roleChangeTarget.role === "admin" ? "Student" : "Administrator"}</strong>?
            </p>
            <div className="admin-modal-actions">
              <button
                type="button"
                className="admin-cancel-btn"
                disabled={isUpdatingRole}
                onClick={() => setRoleChangeTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-primary-btn"
                disabled={isUpdatingRole}
                onClick={confirmRoleChange}
              >
                {isUpdatingRole ? "Updating..." : "Confirm Role Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        onClose={() => {
          if (!isDeletingUser) setUserToDelete(null);
        }}
        onConfirm={confirmDeleteUser}
        title="Delete Member Account"
        description="Are you sure you want to permanently delete this member?"
        itemTitle={userToDelete ? `@${userToDelete.username} (${userToDelete.email})` : ""}
        warningNote="All posts, replies, and votes authored by this user will be permanently deleted from the database."
        confirmText="Delete Account"
        isDeleting={isDeletingUser}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(resourceToDelete)}
        onClose={() => {
          if (!isDeletingResource) setResourceToDelete(null);
        }}
        onConfirm={confirmDeleteResource}
        title="Delete Resource Topic"
        description="Are you sure you want to delete this curriculum topic?"
        itemTitle={resourceToDelete?.title}
        warningNote="This topic will be removed from the public resources directory immediately."
        confirmText="Delete Topic"
        isDeleting={isDeletingResource}
      />

      <ConfirmDeleteModal
        isOpen={Boolean(postToDelete)}
        onClose={() => {
          if (!isDeletingAdminPost) setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="Delete Forum Discussion"
        description="Are you sure you want to delete this discussion?"
        itemTitle={postToDelete?.title}
        warningNote="All comments, replies, upvotes, and bookmarks associated with this discussion will be permanently removed."
        confirmText="Delete Discussion"
        isDeleting={isDeletingAdminPost}
      />
    </section>
  );
}
