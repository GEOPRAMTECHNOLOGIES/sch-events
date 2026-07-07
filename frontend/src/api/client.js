import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("cp_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const adminApi = axios.create({ baseURL: API_URL });

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("cp_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("cp_admin_token");
    }
    return Promise.reject(err);
  }
);

export const ADMIN_ROUTE_SLUG = import.meta.env.VITE_ADMIN_ROUTE_SLUG || "control-9f2a71";
