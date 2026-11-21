import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('parcelo_access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    if (
      (status === 401 || status === 403) &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('parcelo_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('parcelo_access_token');
        localStorage.removeItem('parcelo_user');
        delete api.defaults.headers.common['Authorization'];
        if (originalRequest.headers?.['Authorization']) {
          delete originalRequest.headers['Authorization'];
          return api(originalRequest);
        }
        window.dispatchEvent(new CustomEvent('parcelo_auth_required'));
        return Promise.reject(error);
      }

      try {
        const res = await axios.post('/api/auth/token/refresh/', { refresh: refreshToken });
        const { access, refresh } = res.data;
        localStorage.setItem('parcelo_access_token', access);
        if (refresh) localStorage.setItem('parcelo_refresh_token', refresh);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        processQueue(null, access);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('parcelo_access_token');
        localStorage.removeItem('parcelo_refresh_token');
        localStorage.removeItem('parcelo_user');
        delete api.defaults.headers.common['Authorization'];
        if (originalRequest.headers?.['Authorization']) {
          delete originalRequest.headers['Authorization'];
          return api(originalRequest);
        }
        window.dispatchEvent(new CustomEvent('parcelo_auth_required'));
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
