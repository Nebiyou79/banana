/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export const adminService = {
  // Dashboard
  getDashboardStats: () => adminApi.get('/admin/stats'),
  
  // Users
  getUsers: (params?: any) => adminApi.get('/admin/users', { params }),
  getUserById: (id: string) => adminApi.get(`/admin/users/${id}`),
  updateUser: (id: string, data: any) => adminApi.put(`/admin/users/${id}`, data),
  deleteUser: (id: string) => adminApi.delete(`/admin/users/${id}`),
  bulkUserActions: (data: any) => adminApi.post('/admin/users/bulk-actions', data),
  
  // Jobs
  getJobs: (params?: any) => adminApi.get('/admin/jobs', { params }),
  updateJob: (id: string, data: any) => adminApi.put(`/admin/jobs/${id}`, data),
  deleteJob: (id: string) => adminApi.delete(`/admin/jobs/${id}`),
  
  // Templates
  getTemplates: (params?: any) => adminApi.get('/admin/templates', { params }),
  createTemplate: (data: any) => adminApi.post('/admin/templates', data),
  updateTemplate: (id: string, data: any) => adminApi.put(`/admin/templates/${id}`, data),
  deleteTemplate: (id: string) => adminApi.delete(`/admin/templates/${id}`),
  
  // Settings
  getSettings: () => adminApi.get('/admin/settings'),
  updateSettings: (data: any) => adminApi.put('/admin/settings', data),
  
  // Reports
  generateReport: (data: any) => adminApi.post('/admin/reports/generate', data),
  getReports: (params?: any) => adminApi.get('/admin/reports', { params }),
};

export default adminService;