// hooks/useAdmin.ts
/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { adminService } from '../services/adminService';
import { handleError, handleSuccess } from '@/lib/error-handler'; // ADD THIS IMPORT

export const useAdminData = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApiError = useCallback((err: any, operation: string) => {
    let errorMessage = 'An unexpected error occurred';
    
    if (err.code === 'ECONNREFUSED' || err.message === 'Network Error') {
      errorMessage = 'Cannot connect to server. Please make sure the backend is running on port 4000.';
    } else if (err.response?.data?.message) {
      errorMessage = err.response.data.message;
    } else if (err.message) {
      errorMessage = err.message;
    }
    
    setError(errorMessage);
    
    handleError(errorMessage);
    
    throw err;
  }, []);

  const fetchData = useCallback(async (apiCall: Function, ...args: any[]) => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(...args);
      setData(response.data);
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Operation');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // User operations
  const createUser = useCallback(async (userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.createUser(userData);
      
      handleSuccess('User has been created successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Create User');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const updateUser = useCallback(async (id: string, userData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.updateUser(id, userData);
      
      handleSuccess('User has been updated successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Update User');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const deleteUser = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.deleteUser(id);
      
      handleSuccess('User has been deleted successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Delete User');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Job operations
  const updateJob = useCallback(async (id: string, jobData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.updateJob(id, jobData);
      
      handleSuccess('Job has been updated successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Update Job');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const deleteJob = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.deleteJob(id);
      
      handleSuccess('Job has been deleted successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Delete Job');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Tender operations
  const getTenderStats = useCallback(() => 
    fetchData(adminService.getTenderStats), [fetchData]);

  const getTenderAnalytics = useCallback(() => 
    fetchData(adminService.getTenderAnalytics), [fetchData]);

  const getTenders = useCallback((params?: any) => 
    fetchData(adminService.getTenders, params), [fetchData]);

  const getSuspiciousTenders = useCallback((params?: any) => 
    fetchData(adminService.getSuspiciousTenders, params), [fetchData]);

  const getTenderDetails = useCallback((id: string) => 
    fetchData(adminService.getTenderDetails, id), [fetchData]);

  const updateTenderStatus = useCallback(async (id: string, statusData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.updateTenderStatus(id, statusData);
      
      handleSuccess('Tender status has been updated successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Update Tender');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const moderateTender = useCallback(async (id: string, moderationData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.moderateTender(id, moderationData);
      
      const actionMessage = moderationData.action === 'flag' ? 'flagged' : 'approved';
      handleSuccess(`Tender has been ${actionMessage} successfully`);
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Moderate Tender');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  const bulkTenderActions = useCallback(async (bulkData: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminService.bulkTenderActions(bulkData);
      
      handleSuccess('Bulk tender action completed successfully');
      
      return response.data;
    } catch (err: any) {
      return handleApiError(err, 'Bulk Tender Actions');
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  // Proposal operations
  const getProposals = useCallback((params?: any) => 
    fetchData(adminService.getProposals, params), [fetchData]);

  // Specific methods
  const getDashboardStats = useCallback(() => 
    fetchData(adminService.getDashboardStats), [fetchData]);

  const getPlatformAnalytics = useCallback(() => 
    fetchData(adminService.getPlatformAnalytics), [fetchData]);

  const getUsers = useCallback((params?: any) => 
    fetchData(adminService.getUsers, params), [fetchData]);

  const getUserById = useCallback((id: string) => 
    fetchData(adminService.getUserById, id), [fetchData]);

  const bulkUserActions = useCallback((data: any) => 
    fetchData(adminService.bulkUserActions, data), [fetchData]);

  const getJobs = useCallback((params?: any) => 
    fetchData(adminService.getJobs, params), [fetchData]);

  const getSettings = useCallback(() => 
    fetchData(adminService.getSettings), [fetchData]);

  const updateSettings = useCallback((data: any) => 
    fetchData(adminService.updateSettings, data), [fetchData]);

  const generateReport = useCallback((data: any) => 
    fetchData(adminService.generateReport, data), [fetchData]);

  const getReports = useCallback((params?: any) => 
    fetchData(adminService.getReports, params), [fetchData]);

  const clearError = useCallback(() => setError(null), []);
  const clearData = useCallback(() => setData(null), []);

  return {
    // State
    data,
    loading,
    error,
    
    // User operations
    createUser,
    updateUser,
    deleteUser,
    
    // Job operations
    updateJob,
    deleteJob,
    
    // Tender operations
    getTenderStats,
    getTenderAnalytics,
    getTenders,
    getSuspiciousTenders,
    getTenderDetails,
    updateTenderStatus,
    moderateTender,
    bulkTenderActions,
    
    // Proposal operations
    getProposals,
    
    // Data fetching methods
    getDashboardStats,
    getPlatformAnalytics,
    getUsers,
    getUserById,
    bulkUserActions,
    getJobs,
    getSettings,
    updateSettings,
    generateReport,
    getReports,
    
    // Utility methods
    clearError,
    clearData,
    fetchData,
  };
};