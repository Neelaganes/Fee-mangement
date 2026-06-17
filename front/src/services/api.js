import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const stored = localStorage.getItem('auth-user');
  if (stored) {
    const user = JSON.parse(stored);
    if (user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

// Auth
export const login = (username, password) =>
  API.post('/login', { username, password });

// Students
export const getStudents = (className) =>
  API.get('/students', { params: className ? { className } : {} });

export const createStudent = (data) =>
  API.post('/students', data);

export const updateStudent = (id, data) =>
  API.put(`/students/${id}`, data);

export const deleteStudent = (id) =>
  API.delete(`/students/${id}`);

// Payments
export const getPayments = (studentId) =>
  API.get(`/payments/${studentId}`);

export const recordPayment = (studentId, amount) =>
  API.post('/payments', { studentId, amount });

export default API;
