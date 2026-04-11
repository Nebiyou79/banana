import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_BASE } from '../constants/api';
import { getToken, clearAll } from '../lib/storage';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// ─── Request interceptor — attach token ───────────────────────────────────
api.interceptors.request.use(
  async (config) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Response interceptor — handle 401 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await clearAll();
      // Emit event so auth store can react
      authLogoutEvent.emit();
    }
    return Promise.reject(error);
  },
);

// ─── Simple event bus for logout ──────────────────────────────────────────
type Listener = () => void;
const authLogoutEvent = {
  listeners: [] as Listener[],
  emit() { this.listeners.forEach((l) => l()); },
  subscribe(fn: Listener) {
    this.listeners.push(fn);
    return () => { this.listeners = this.listeners.filter((l) => l !== fn); };
  },
};

export { authLogoutEvent };

// ─── Typed helpers ────────────────────────────────────────────────────────
export const apiGet = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.get<T>(url, config);

export const apiPost = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.post<T>(url, data, config);

export const apiPut = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.put<T>(url, data, config);

export const apiPatch = <T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.patch<T>(url, data, config);

export const apiDelete = <T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> =>
  api.delete<T>(url, config);

export default api;