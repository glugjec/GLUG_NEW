import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('glug_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

client.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected network error occurred';
    return Promise.reject(new Error(message));
  }
);

export const api = {
  get: (url, config = {}) => client.get(url, config),
  post: (url, data, config = {}) => client.post(url, data, config),
  put: (url, data, config = {}) => client.put(url, data, config),
  delete: (url, config = {}) => client.delete(url, config),
};

export const authApi = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  sendOtp: (data) => client.post('/auth/send-otp', data),
  verifyOtp: (data) => client.post('/auth/verify-otp', data),
  checkUsername: (username) => client.get('/auth/check-username', { params: { username } }),
  googleLogin: (credential) => client.post('/auth/google', { credential }),
  completeGoogleAuth: (data) => client.post('/auth/google/complete', data),
  forgotPassword: (data) => client.post('/auth/forgot-password', data),
  resetPassword: (data) => client.post('/auth/reset-password', data),
  getMe: () => client.get('/auth/me'),
  updateProfile: (data) => client.put('/auth/me', data),
};

export const postsApi = {
  list: (params = {}) => client.get('/posts', { params }),
  feed: (params = {}) => client.get('/posts/feed', { params }),
  get: (id) => client.get(`/posts/${id}`),
  create: (data) => client.post('/posts', data),
  update: (id, data) => client.put(`/posts/${id}`, data),
  delete: (id) => client.delete(`/posts/${id}`),
  vote: (id, value) => client.post(`/posts/${id}/vote`, { value }),
  bookmark: (id) => client.post(`/posts/${id}/bookmark`),
  pin: (id) => client.put(`/posts/${id}/pin`),
  lock: (id) => client.put(`/posts/${id}/lock`),
  addComment: (id, data) => client.post(`/posts/${id}/comments`, data),
  deleteComment: (postId, commentId) => client.delete(`/posts/${postId}/comments/${commentId}`),
  voteComment: (postId, commentId, value) => client.post(`/posts/${postId}/comments/${commentId}/vote`, { value }),
};

export const usersApi = {
  getProfile: (id) => client.get(`/users/${id}`),
  getPosts: (id) => client.get(`/users/${id}/posts`),
  getTerminalState: () => client.get('/users/me/terminal'),
  saveTerminalState: (state) => client.put('/users/me/terminal', state),
};

export const resourcesApi = {
  list: () => client.get('/resources'),
  create: (data) => client.post('/resources', data),
  update: (id, data) => client.put(`/resources/${id}`, data),
  delete: (id) => client.delete(`/resources/${id}`),
};

export const membersApi = {
  getTeam: () => client.get('/users/team'),
};

export const chatApi = {
  getUnreadCount: () => client.get('/chat/unread-count'),
  getConversations: () => client.get('/chat/conversations'),
  getOrCreateWithUser: (userId) => client.get(`/chat/conversations/with/${userId}`),
  getMessages: (conversationId) => client.get(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (conversationId, text) => client.post(`/chat/conversations/${conversationId}/messages`, { text }),
  markRead: (conversationId) => client.put(`/chat/conversations/${conversationId}/read`),
};

export const adminApi = {
  getStats: () => client.get('/admin/stats'),
  getUsers: (params = {}) => client.get('/admin/users', { params }),
  updateUserRole: (id, role) => client.put(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => client.delete(`/admin/users/${id}`),
  getTeamMembers: () => client.get('/admin/team'),
  updateTeamPosition: (userId, data) => client.put(`/admin/team/${userId}`, data),
  removeTeamMember: (userId) => client.delete(`/admin/team/${userId}`),
  getPosts: (params = {}) => client.get('/admin/posts', { params }),
  togglePinPost: (id) => client.put(`/admin/posts/${id}/pin`),
  toggleLockPost: (id) => client.put(`/admin/posts/${id}/lock`),
  deletePost: (id) => client.delete(`/admin/posts/${id}`),
  deleteComment: (id) => client.delete(`/admin/comments/${id}`),
};

export const uploadApi = {
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return client.post('/upload/avatar', formData);
  },
  uploadImage: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return client.post('/upload', formData);
  },
};

export default api;


