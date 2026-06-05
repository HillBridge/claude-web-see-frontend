import axios from 'axios';
import router from '../router';

const request = axios.create({
  baseURL: process.env.VUE_APP_BACKEND_URL,
  timeout: 10000
});

// 未登录 / Token 过期统一处理：清除认证信息并跳转登录页
// 加 currentRoute 判断，防止已经在登录页时重复跳转造成死循环
function handleUnauthorized() {
  localStorage.removeItem('auth-token');
  localStorage.removeItem('auth-user-id');
  if (router.currentRoute.name !== 'login') {
    router.replace({ name: 'login' });
  }
}

request.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

request.interceptors.response.use(
  (response) => {
    // 后端约定 HTTP 200 + 业务 code；code===401 表示未登录或 Token 已过期
    if (response.data && response.data.code === 401) {
      handleUnauthorized();
      return Promise.reject(response.data);
    }
    return response.data;
  },
  (error) => {
    // 兜底：若后端确实以 HTTP 401 返回，也走统一处理
    if (error.response && error.response.status === 401) {
      handleUnauthorized();
    }
    return Promise.reject(error);
  }
);

export default request;
