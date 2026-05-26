import axios from 'axios';

const request = axios.create({
  baseURL: process.env.VUE_APP_BACKEND_URL || 'http://localhost:8083',
  timeout: 10000
});

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => response.data,
  (error) => Promise.reject(error)
);

export default request;
