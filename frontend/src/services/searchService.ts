// src/services/searchService.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import api from '@/lib/axios'; // FIXED IMPORT
import { handleError } from '@/lib/error-handler'; // ADD THIS IMPORT

export interface SearchParams {
  query?: string;
  location?: string;
  skills?: string;
  type?: string;
  category?: string;
  remote?: boolean;
  experienceLevel?: string;
  minSalary?: number;
  maxSalary?: number;
  page?: number;
  limit?: number;
}

export interface SearchResponse {
  success: boolean;
  data: any[];
  pagination: {
    current: number;
    totalPages: number;
    totalResults: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const searchJobs = async (params: SearchParams): Promise<SearchResponse> => {
  try {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/search/jobs?${queryParams}`);
    return response.data;
  } catch (error: any) {
    handleError(error, 'Failed to search jobs');
    return Promise.reject(error);
  }
};