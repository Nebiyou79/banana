/* eslint-disable @typescript-eslint/no-explicit-any */
// services/tenderService.tsx
import api from '@/lib/axios';

export interface Company {
  _id: string;
  name: string;
  logo?: string;
  industry?: string;
  description?: string;
  website?: string;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  role?: string;
}

export interface Tender {
  _id: string;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  category: string;
  status: 'open' | 'closed' | 'awarded';
  location?: string;
  attachments?: string[];
  company: Company;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
}

export interface TenderFilters {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  status?: string;
  minBudget?: number;
  maxBudget?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface TenderResponse {
  success: boolean;
  data: Tender;
  message?: string;
}

export interface TenderListResponse {
  message: string;
  success: boolean;
  data: Tender[];
  pagination: PaginationInfo;
}

export const tenderService = {
  // ✅ Create tender (company only)
  createTender: async (data: Partial<Tender>): Promise<Tender> => {
    try {
      const response = await api.post<TenderResponse>('/tender', data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create tender');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create tender');
    }
  },

  // ✅ Get all tenders with filters
  getTenders: async (filters: TenderFilters = {}): Promise<{ data: Tender[]; pagination: PaginationInfo }> => {
    try {
      const response = await api.get<TenderListResponse>('/tender', { params: filters });
      if (response.data.success) {
        return {
          data: response.data.data,
          pagination: response.data.pagination
        };
      }
      throw new Error(response.data.message || 'Failed to fetch tenders');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tenders');
    }
  },

  // ✅ Get single tender
  getTender: async (id: string): Promise<Tender> => {
    try {
      const response = await api.get<TenderResponse>(`/tender/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch tender');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tender');
    }
  },

  // ✅ Update tender
  updateTender: async (id: string, data: Partial<Tender>): Promise<Tender> => {
    try {
      const response = await api.put<TenderResponse>(`/tender/${id}`, data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update tender');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update tender');
    }
  },

  // ✅ Delete tender
  deleteTender: async (id: string): Promise<void> => {
    try {
      const response = await api.delete(`/tender/${id}`);
      if (response.data.success) {
        return;
      }
      throw new Error(response.data.message || 'Failed to delete tender');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete tender');
    }
  },

  // ✅ Get company tenders
  getCompanyTenders: async (companyId: string, status?: string): Promise<Tender[]> => {
    try {
      const response = await api.get<TenderListResponse>(`/tender/company/${companyId}`, {
        params: { status }
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch company tenders');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch company tenders');
    }
  },
};