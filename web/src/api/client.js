import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
  },
});

// Request interceptor: Attach JWT token if stored
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lumiina_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle global 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear local auth state
      const currentToken = localStorage.getItem('lumiina_token');
      if (currentToken && !error.config.url.includes('/auth/login')) {
        localStorage.removeItem('lumiina_token');
        localStorage.removeItem('lumiina_user');
      }
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
  verifyEmail: (token) => api.get('/auth/verify-email', { params: { token } }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/users/me'),
};

// Artworks endpoints
export const artworksAPI = {
  getAll: (params) => api.get('/artworks', { params }),
  getByID: (id) => api.get(`/artworks/${id}`),
  create: (formData) =>
    api.post('/artworks', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, data) => api.put(`/artworks/${id}`, data),
  delete: (id) => api.delete(`/artworks/${id}`),
};

// Comments endpoints
export const commentsAPI = {
  getByArtwork: (artworkId, params) =>
    api.get(`/artworks/${artworkId}/comments`, { params }),
  create: (artworkId, content) =>
    api.post(`/artworks/${artworkId}/comments`, { content }),
  delete: (commentId) => api.delete(`/comments/${commentId}`),
};

// User Profile & Discovery endpoints
export const usersAPI = {
  getProfile: (userId) => api.get(`/users/${userId}`),
  search: (query, params = {}) =>
    api.get('/users/search', { params: { q: query, ...params } }),
};

export default api;
