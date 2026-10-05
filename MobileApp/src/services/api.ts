import axios from 'axios';
import {store} from '../store/store';
import {logout} from '../store/slices/authSlice';

const API = axios.create({
  baseURL: 'http://127.0.0.1:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Automatically attach Bearer token from Redux store
API.interceptors.request.use(
  config => {
    const token = store.getState().auth.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response Interceptor: Handle expired/invalid JWT tokens (401 Unauthorized)
API.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response && error.response.status === 401) {
      // Clear Redux auth state on expired/invalid session
      store.dispatch(logout());
    }
    return Promise.reject(error);
  },
);

export default API;