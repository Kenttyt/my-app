import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authService = {
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
  login: (email, password) =>
    api.post('/auth/login', { email, password }),
  getInterests: () =>
    api.get('/auth/interests'),
  getSports: () =>
    api.get('/auth/sports')
};

// User endpoints
export const userService = {
  getProfile: () =>
    api.get('/users/profile'),
  updateInterests: (interests) =>
    api.put('/users/interests', { interests }),
  updateSports: (sports) =>
    api.put('/users/sports', { sports }),
  searchByInterest: (interest) =>
    api.get('/users/search', { params: { interest } }),
  getOnlineUsers: () =>
    api.get('/users/online')
};

// Chat endpoints
export const chatService = {
  getRooms: (interest) =>
    api.get('/chat/rooms', { params: interest ? { interest } : {} }),
  getMessages: (roomId) =>
    api.get(`/chat/rooms/${roomId}/messages`),
  getRoomMembers: (roomId) =>
    api.get(`/chat/rooms/${roomId}/members`),
  createRoom: (name, interest) =>
    api.post('/chat/rooms', { name, interest }),
  deleteRoom: (roomId) =>
    api.delete(`/chat/rooms/${roomId}`)
};

export default api;
