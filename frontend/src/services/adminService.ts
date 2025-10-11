/* eslint-disable @typescript-eslint/no-explicit-any */
// services/adminService.ts - ENHANCED VERSION
import axios from 'axios';
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const adminApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config; 
});

adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      handleError('Authentication required. Please login again.');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  _id?: string;
  name: string;
  email: string;
  role: 'candidate' | 'freelancer' | 'company' | 'admin';
  password?: string;
  verificationStatus?: 'none' | 'partial' | 'full';
  status?: 'active' | 'inactive' | 'pending' | 'suspended';
  profileCompleted?: boolean;
  bio?: string;
  location?: string;
  phone?: string;
  website?: string;
  skills?: string[];
  company?: string;
  createdAt?: string;
}

export interface Tender {
  _id: string;
  title: string;
  description: string;
  category: string;
  skillsRequired: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  deadline: string;
  duration: number;
  status: 'draft' | 'published' | 'completed' | 'cancelled';
  company: {
    _id: string;
    name: string;
    industry: string;
    verified: boolean;
    website?: string;
  };
  createdBy: {
    _id: string;
    name: string;
    email: string;
  };
  proposals: any[];
  metadata: {
    views: number;
    proposalCount: number;
    savedBy: string[];
  };
  moderated?: boolean;
  moderationReason?: string;
  adminNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TenderStats {
  overview: {
    totalTenders: number;
    publishedTenders: number;
    draftTenders: number;
    completedTenders: number;
    cancelledTenders: number;
    tendersLast30Days: number;
    totalProposals: number;
    avgProposalsPerTender: number;
    highValueTenders: number;
    completionRate: number;
  };
  categories: Array<{ _id: string; count: number }>;
  trends: Array<{ _id: { status: string; date: string }; count: number }>;
  recentActivity: Tender[];
}

export interface TenderAnalytics {
  dailyTrends: Array<{ _id: string; count: number; avgBudget: number }>;
  categoryPerformance: Array<{
    _id: string;
    total: number;
    avgProposals: number;
    avgBudget: number;
    completionRate: number;
  }>;
  topCompanies: Array<{
    _id: string;
    tenderCount: number;
    totalBudget: number;
    avgProposals: number;
  }>;
  proposalAnalytics: {
    avgProposalsPerTender: number;
    maxProposals: number;
    proposalToBudgetCorrelation: number;
  };
  topPerformers: Tender[];
}

export interface Pagination {
  totalPages: number;
  currentPage: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Enhanced admin service with error handling
const handleAdminApiError = (error: any, operation: string) => {
  console.error(`Admin API Error for ${operation}:`, error);
  
  if (error.response?.data?.message) {
    handleError(error.response.data.message);
  } else if (error.message) {
    handleError(error.message);
  } else {
    handleError(`Failed to ${operation}`);
  }
  
  return Promise.reject(error);
};

export const adminService = {
  // Dashboard
  getDashboardStats: () => adminApi.get('/admin/stats').catch(error => handleAdminApiError(error, 'fetch dashboard stats')),
  getPlatformAnalytics: () => adminApi.get('/admin/analytics').catch(error => handleAdminApiError(error, 'fetch platform analytics')),
  
  // Users
  getUsers: (params?: any) => adminApi.get('/admin/users', { params }).catch(error => handleAdminApiError(error, 'fetch users')),
  getUserById: (id: string) => adminApi.get(`/admin/users/${id}`).catch(error => handleAdminApiError(error, 'fetch user')),
  createUser: (data: User) => adminApi.post('/admin/users', data).then(response => {
    handleSuccess('User created successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'create user')),
  updateUser: (id: string, data: any) => adminApi.put(`/admin/users/${id}`, data).then(response => {
    handleSuccess('User updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update user')),
  updateUserStatus: (id: string, data: any) => adminApi.put(`/admin/users/${id}/status`, data).then(response => {
    handleSuccess('User status updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update user status')),
  deleteUser: (id: string) => adminApi.delete(`/admin/users/${id}`).then(response => {
    handleSuccess('User deleted successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'delete user')),
  bulkUserActions: (data: any) => adminApi.post('/admin/users/bulk-actions', data).then(response => {
    handleSuccess('Bulk action completed successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'perform bulk user actions')),
  
  // Jobs
  getJobs: (params?: any) => adminApi.get('/admin/jobs', { params }).catch(error => handleAdminApiError(error, 'fetch jobs')),
  updateJob: (id: string, data: any) => adminApi.put(`/admin/jobs/${id}`, data).then(response => {
    handleSuccess('Job updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update job')),
  deleteJob: (id: string) => adminApi.delete(`/admin/jobs/${id}`).then(response => {
    handleSuccess('Job deleted successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'delete job')),
  
  // Tender Management
  getTenderStats: () => adminApi.get('/admin/tenders/stats').catch(error => handleAdminApiError(error, 'fetch tender stats')),
  getTenderAnalytics: () => adminApi.get('/admin/tenders/analytics').catch(error => handleAdminApiError(error, 'fetch tender analytics')),
  getTenders: (params?: any) => adminApi.get('/admin/tenders', { params }).catch(error => handleAdminApiError(error, 'fetch tenders')),
  getSuspiciousTenders: (params?: any) => adminApi.get('/admin/tenders/suspicious', { params }).catch(error => handleAdminApiError(error, 'fetch suspicious tenders')),
  getTenderDetails: (id: string) => adminApi.get(`/admin/tenders/${id}`).catch(error => handleAdminApiError(error, 'fetch tender details')),
  updateTenderStatus: (id: string, data: any) => adminApi.put(`/admin/tenders/${id}/status`, data).then(response => {
    handleSuccess('Tender status updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update tender status')),
  moderateTender: (id: string, data: any) => adminApi.put(`/admin/tenders/${id}/moderate`, data).then(response => {
    handleSuccess('Tender moderated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'moderate tender')),
  bulkTenderActions: (data: any) => adminApi.post('/admin/tenders/bulk-actions', data).then(response => {
    handleSuccess('Bulk tender actions completed successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'perform bulk tender actions')),
  
  // Proposals
  getProposals: (params?: any) => adminApi.get('/admin/proposals', { params }).catch(error => handleAdminApiError(error, 'fetch proposals')),
  
  // Templates
  getTemplates: (params?: any) => adminApi.get('/admin/templates', { params }).catch(error => handleAdminApiError(error, 'fetch templates')),
  createTemplate: (data: any) => adminApi.post('/admin/templates', data).then(response => {
    handleSuccess('Template created successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'create template')),
  updateTemplate: (id: string, data: any) => adminApi.put(`/admin/templates/${id}`, data).then(response => {
    handleSuccess('Template updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update template')),
  deleteTemplate: (id: string) => adminApi.delete(`/admin/templates/${id}`).then(response => {
    handleSuccess('Template deleted successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'delete template')),
  
  // Settings
  getSettings: () => adminApi.get('/admin/settings').catch(error => handleAdminApiError(error, 'fetch settings')),
  updateSettings: (data: any) => adminApi.put('/admin/settings', data).then(response => {
    handleSuccess('Settings updated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'update settings')),
  
  // Reports
  generateReport: (data: any) => adminApi.post('/admin/reports/generate', data).then(response => {
    handleSuccess('Report generated successfully');
    return response;
  }).catch(error => handleAdminApiError(error, 'generate report')),
  getReports: (params?: any) => adminApi.get('/admin/reports', { params }).catch(error => handleAdminApiError(error, 'fetch reports')),
};

export default adminService;