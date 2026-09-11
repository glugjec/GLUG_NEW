import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { adminApi, resourcesApi } from "../api.js";
import ConfirmDeleteModal from "../components/common/ConfirmDeleteModal.jsx";
import "./AdminDashboard.css";

export default function AdminDashboard() {
  const { user, authLoading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "users";

  // Platform metrics
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalResources: 0,
  });

  // Users tab state
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Resources tab state
  const [resources, setResources] = useState([]);
  const [resourceModalOpen, setResourceModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState(null);
  const [resourceForm, setResourceForm] = useState({
    title: "",
    description: "",
    category: "getting-started",
    items: "",
  });

  // Moderation tab state
  const [posts, setPosts] = useState([]);
  const [postSearch, setPostSearch] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isDeletingAdminPost, setIsDeletingAdminPost] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  function showToast(msg, type = "success") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Load stats
  useEffect(() => {
    if (user && user.role === "admin") {
      adminApi
        .getStats()
        .then((data) => setStats(data))
        .catch((err) => console.error("Failed to load stats:", err));
    }
  }, [user]);

  // Load users when tab is active or search/filter changes
  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "users") {
      setLoadingUsers(true);
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

  // Load resources
  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "resources") {
      resourcesApi
        .list()
        .then((data) => setResources(data || []))
        .catch((err) => showToast(err.message, "error"));
    }
  }, [user, activeTab]);

  // Load moderation posts
  useEffect(() => {
    if (user && user.role === "admin" && activeTab === "moderation") {
      setLoadingPosts(true);
      const params = {};
      if (postSearch.trim()) params.q = postSearch.trim();

      adminApi
        .getPosts(params)
        .then((data) => setPosts(data.posts || []))
        .catch((err) => showToast(err.message, "error"))
        .finally(() => setLoadingPosts(false));
    }
  }, [user, activeTab, postSearch]);

  if (authLoading) {
    return (
      <div className="admin-page">
        <p style={{ color: "#8b949e" }}>Loading administrator console...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="admin-page">
        <div className="admin-denied">
          <svg
            className="admin-denied-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <h2>Administrator Access Required</h2>
          <p>
            You must be signed in with an administrator account to view the GLUG
            administration console.
          </p>
          <Link to="/" className="admin-primary-btn" style={{ display: "inline-flex" }}>
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Role promotion / demotion handler
  async function handleRoleChange(targetUser) {
    const newRole = targetUser.role === "admin" ? "student" : "admin";
    const confirmMsg = `Are you sure you want to change @${targetUser.username}'s role to ${newRole.toUpperCase()}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.updateUserRole(targetUser.id, newRole);
      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u))
      );
      showToast(`Updated @${targetUser.username} to ${newRole}`);
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // Delete user handler
  async function handleDeleteUser(targetUser) {
    const confirmMsg = `Permanently delete @${targetUser.username} and all their posts and comments? This cannot be undone.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await adminApi.deleteUser(targetUser.id);
      setUsers((prev) => prev.filter((u) => u.id !== targetUser.id));
      showToast(`User @${targetUser.username} deleted`);
      setStats((prev) => ({ ...prev, totalUsers: Math.max(0, prev.totalUsers - 1) }));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // Save / create resource handler
  async function handleSaveResource(e) {
    e.preventDefault();
    const itemArray = resourceForm.items
      .split('\n')
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
        showToast("Resource updated successfully");
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

  // Delete resource handler
  async function handleDeleteResource(resourceId) {
    if (!window.confirm("Delete this learning resource topic?")) return;
    try {
      await resourcesApi.delete(resourceId);
      setResources((prev) => prev.filter((r) => r.id !== resourceId));
      showToast("Resource deleted");
      setStats((prev) => ({ ...prev, totalResources: Math.max(0, prev.totalResources - 1) }));
    } catch (err) {
      showToast(err.message, "error");
    }
  }

  // Moderation handlers
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
      showToast("Post and comments deleted");
      setStats((prev) => ({ ...prev, totalPosts: Math.max(0, prev.totalPosts - 1) }));
      setPostToDelete(null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setIsDeletingAdminPost(false);
    }
  }

  return (
    <section className="admin-page">
      {/* Toast Feedback */}
      {toast && (
        <div
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 999,
            background: toast.type === "error" ? "#da3633" : "#238636",
            color: "#ffffff",
            padding: "10px 18px",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          }}
        >
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="admin-header">
        <div className="admin-title-row">
          <svg className="admin-shield-icon" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8Z" />
          </svg>
          <h1 className="admin-title">GLUG Administration Console</h1>
        </div>
        <p className="admin-subtitle">
          Manage community members, publish dynamic learning resources, and moderate forum discussions.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card">
          <span className="admin-stat-label">Total Members</span>
          <span className="admin-stat-value">{stats.totalUsers}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Forum Posts</span>
          <span className="admin-stat-value">{stats.totalPosts}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Comments</span>
          <span className="admin-stat-value">{stats.totalComments}</span>
        </div>
        <div className="admin-stat-card">
          <span className="admin-stat-label">Learning Resources</span>
          <span className="admin-stat-value">{stats.totalResources}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === "users" ? "active" : ""}`}
          onClick={() => setSearchParams({ tab: "users" })}
        >
          👥 User Management
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "resources" ? "active" : ""}`}
          onClick={() => setSearchParams({ tab: "resources" })}
        >
          📚 Resource Manager
        </button>
        <button
          className={`admin-tab-btn ${activeTab === "moderation" ? "active" : ""}`}
          onClick={() => setSearchParams({ tab: "moderation" })}
        >
          🛡️ Forum Moderation
        </button>
      </div>

      {/* TAB 1: USERS */}
      {activeTab === "users" && (
        <div>
          <div className="admin-toolbar">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search by username or email..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
            />
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

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Joined</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingUsers ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#8b949e" }}>
                      Loading members...
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#8b949e" }}>
                      No users match your criteria.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              borderRadius: "50%",
                              background: "#30363d",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "12px",
                              fontWeight: "bold",
                            }}
                          >
                            {u.username.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <span style={{ fontWeight: 600, color: "#ffffff" }}>@{u.username}</span>
                            {u.isProtected && (
                              <span
                                style={{
                                  marginLeft: "6px",
                                  fontSize: "10px",
                                  color: "#f2c94c",
                                  border: "1px solid #f2c94c",
                                  padding: "1px 4px",
                                  borderRadius: "4px",
                                }}
                              >
                                Primary
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`admin-badge ${u.role}`}>{u.role}</span>
                      </td>
                      <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <span style={{ color: "#8b949e" }}>
                          {u.stats.posts} posts · {u.stats.comments} comments
                        </span>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          {!u.isProtected && u.id !== user.id && (
                            <>
                              <button
                                className="admin-action-btn"
                                onClick={() => handleRoleChange(u)}
                                title={u.role === "admin" ? "Demote to student" : "Promote to admin"}
                              >
                                {u.role === "admin" ? "Demote" : "Make Admin"}
                              </button>
                              <button
                                className="admin-action-btn danger"
                                onClick={() => handleDeleteUser(u)}
                                title="Permanently delete user"
                              >
                                Delete
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

      {/* TAB 2: RESOURCES */}
      {activeTab === "resources" && (
        <div>
          <div className="admin-toolbar">
            <div>
              <p style={{ margin: 0, color: "#8b949e", fontSize: "14px" }}>
                Curate curriculum topics that sync dynamically to the public <strong>/resources</strong> page.
              </p>
            </div>
            <button
              className="admin-primary-btn"
              onClick={() => {
                setEditingResource(null);
                setResourceForm({ title: "", description: "", category: "getting-started", items: "" });
                setResourceModalOpen(true);
              }}
            >
              + Add Resource Topic
            </button>
          </div>

          <div className="admin-resources-grid">
            {resources.length === 0 ? (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px", color: "#8b949e" }}>
                No custom resources found in database. The website is currently displaying the default 4 curriculum topics.
              </div>
            ) : (
              resources.map((r) => (
                <div className="admin-resource-card" key={r.id}>
                  <div className="admin-resource-header">
                    <div>
                      <span className="admin-badge student" style={{ marginBottom: "6px" }}>
                        {r.category}
                      </span>
                      <h3 className="admin-resource-title">{r.title}</h3>
                    </div>
                    <div className="admin-actions-cell">
                      <button
                        className="admin-action-btn"
                        onClick={() => {
                          setEditingResource(r);
                          setResourceForm({
                            title: r.title,
                            description: r.description,
                            category: r.category,
                            items: (r.items || []).join('\n'),
                          });
                          setResourceModalOpen(true);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="admin-action-btn danger"
                        onClick={() => handleDeleteResource(r.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <p className="admin-resource-desc">{r.description}</p>

                  {r.items && r.items.length > 0 && (
                    <div className="admin-resource-items">
                      {r.items.map((item, idx) => (
                        <span className="admin-chip" key={idx}>
                          {item}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: FORUM MODERATION */}
      {activeTab === "moderation" && (
        <div>
          <div className="admin-toolbar">
            <input
              type="text"
              className="admin-search-input"
              placeholder="Search discussions by title or content..."
              value={postSearch}
              onChange={(e) => setPostSearch(e.target.value)}
            />
          </div>

          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Discussion</th>
                  <th>Author</th>
                  <th>Category</th>
                  <th>Stats</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingPosts ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#8b949e" }}>
                      Loading discussions...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: "center", padding: "32px", color: "#8b949e" }}>
                      No discussions found.
                    </td>
                  </tr>
                ) : (
                  posts.map((p) => (
                    <tr key={p.id}>
                      <td style={{ maxWidth: "280px" }}>
                        <Link
                          to={`/forum/posts/${p.id}`}
                          style={{ color: "#ffffff", fontWeight: 600, textDecoration: "none" }}
                        >
                          {p.title}
                        </Link>
                      </td>
                      <td>@{p.author?.username || "unknown"}</td>
                      <td>
                        <span className="admin-chip">#{p.category}</span>
                      </td>
                      <td>
                        <span style={{ color: "#8b949e" }}>
                          ▲ {p.voteScore} · 💬 {p.commentCount}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "4px" }}>
                          {p.isPinned && <span className="admin-badge pinned">📌 Pinned</span>}
                          {p.isLocked && <span className="admin-badge locked">🔒 Locked</span>}
                          {!p.isPinned && !p.isLocked && <span style={{ color: "#6e7681" }}>Normal</span>}
                        </div>
                      </td>
                      <td>
                        <div className="admin-actions-cell">
                          <button
                            className="admin-action-btn"
                            onClick={() => handleTogglePin(p)}
                            title={p.isPinned ? "Unpin post" : "Pin post to top"}
                          >
                            {p.isPinned ? "Unpin" : "Pin"}
                          </button>
                          <button
                            className="admin-action-btn"
                            onClick={() => handleToggleLock(p)}
                            title={p.isLocked ? "Unlock replies" : "Lock replies"}
                          >
                            {p.isLocked ? "Unlock" : "Lock"}
                          </button>
                          <button
                            className="admin-action-btn danger"
                            onClick={() => setPostToDelete(p)}
                            title="Delete discussion"
                          >
                            Delete
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

      {/* Resource Modal Form */}
      {resourceModalOpen && (
        <div className="admin-modal-overlay" onClick={() => setResourceModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2 className="admin-modal-title">
              {editingResource ? "Edit Resource Topic" : "Add Resource Topic"}
            </h2>

            <form onSubmit={handleSaveResource} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div className="admin-form-group">
                <label>Topic Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  placeholder="e.g. Linux Kernel & System Calls"
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
                  placeholder="Summary of what students will learn..."
                  value={resourceForm.description}
                  onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Curriculum Sub-topics (one per line)</label>
                <textarea
                  className="admin-form-textarea"
                  placeholder="Process scheduling&#10;Memory management&#10;Virtual filesystem"
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

      <ConfirmDeleteModal
        isOpen={Boolean(postToDelete)}
        onClose={() => {
          if (!isDeletingAdminPost) setPostToDelete(null);
        }}
        onConfirm={confirmDeletePost}
        title="Delete Discussion"
        description="Are you sure you want to delete this discussion?"
        itemTitle={postToDelete?.title}
        warningNote="This action cannot be undone. All comments, replies, upvotes, and bookmarks associated with this discussion will be permanently removed."
        confirmText="Delete Discussion"
        isDeleting={isDeletingAdminPost}
      />
    </section>
  );
}
