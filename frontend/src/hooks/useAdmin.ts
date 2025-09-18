/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';

export const useAdminData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (apiCall: Function, ...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(...args);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const clearData = useCallback(() => setData(null), []);

  return {
    data,
    loading,
    error,
    fetchData,
    clearError,
    clearData,
    // Specific methods
    getDashboardStats: () => fetchData(adminService.getDashboardStats),
    getUsers: (params?: any) => fetchData(adminService.getUsers, params),
    updateUser: (id: string, data: any) => fetchData(adminService.updateUser, id, data),
    deleteUser: (id: string) => fetchData(adminService.deleteUser, id),
    bulkUserActions: (data: any) => fetchData(adminService.bulkUserActions, data),
    getJobs: (params?: any) => fetchData(adminService.getJobs, params),
    updateJob: (id: string, data: any) => fetchData(adminService.updateJob, id, data),
    deleteJob: (id: string) => fetchData(adminService.deleteJob, id),
    getTemplates: (params?: any) => fetchData(adminService.getTemplates, params),
    createTemplate: (data: any) => fetchData(adminService.createTemplate, data),
    updateTemplate: (id: string, data: any) => fetchData(adminService.updateTemplate, id, data),
    deleteTemplate: (id: string) => fetchData(adminService.deleteTemplate, id),
    getSettings: () => fetchData(adminService.getSettings),
    updateSettings: (data: any) => fetchData(adminService.updateSettings, data),
    generateReport: (data: any) => fetchData(adminService.generateReport, data),
    getReports: (params?: any) => fetchData(adminService.getReports, params),
  };
};