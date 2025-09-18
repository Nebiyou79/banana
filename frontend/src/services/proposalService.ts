/* eslint-disable @typescript-eslint/no-explicit-any */
// services/proposalService.ts - Enhanced
import api from '@/lib/axios';

export interface Proposal {
  _id: string;
  tenderId: {
    _id: string;
    title: string;
    description: string;
    budget: number;
    deadline: string;
    status: string;
    company: {
      _id: string;
      name: string;
      logo?: string;
    };
  };
  freelancerId: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    rating?: number;
    experience?: string;
    skills?: string[];
  };
  bidAmount: number;
  proposalText: string;
  estimatedTimeline: string;
  attachments: string[];
  status: 'submitted' | 'under_review' | 'shortlisted' | 'accepted' | 'rejected' | 'withdrawn';
  companyNotes?: string;
  rating?: number;
  feedback?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProposalData {
  tenderId: string;
  bidAmount: number;
  proposalText: string;
  estimatedTimeline: string;
  attachments?: string[];
}

export interface UpdateProposalData {
  bidAmount?: number;
  proposalText?: string;
  estimatedTimeline?: string;
  attachments?: string[];
}

export interface UpdateProposalStatusData {
  status: string;
  companyNotes?: string;
}

export interface ProposalFilters {
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ProposalResponse {
  success: boolean;
  data: Proposal;
  message?: string;
}

export interface ProposalListResponse {
  success: boolean;
  data: Proposal[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const proposalService = {
  // Create proposal
  createProposal: async (data: CreateProposalData): Promise<Proposal> => {
    try {
      const response = await api.post<ProposalResponse>('/proposals', data);
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to create proposal');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to create proposal');
    }
  },

  // Get user proposals
  getUserProposals: async (filters?: ProposalFilters): Promise<Proposal[]> => {
    try {
      const response = await api.get<ProposalListResponse>('/proposals/me', {
        params: filters
      });
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch proposals');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch proposals');
    }
  },

  // Get tender proposals (for company)
  getTenderProposals: async (tenderId: string): Promise<Proposal[]> => {
    try {
      const response = await api.get<ProposalListResponse>(
        `/proposals/tender/${tenderId}`
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to fetch tender proposals');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to fetch tender proposals');
    }
  },

  // Update proposal (freelancer)
  updateProposal: async (id: string, data: UpdateProposalData): Promise<Proposal> => {
    try {
      const response = await api.put<ProposalResponse>(
        `/proposals/${id}`,
        data
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update proposal');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update proposal');
    }
  },

  // Update proposal status (company)
  updateProposalStatus: async (id: string, data: UpdateProposalStatusData): Promise<Proposal> => {
    try {
      const response = await api.put<ProposalResponse>(
        `/proposals/${id}/status`,
        data
      );
      if (response.data.success) {
        return response.data.data;
      }
      throw new Error(response.data.message || 'Failed to update proposal status');
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to update proposal status');
    }
  },

  // Delete proposal
  deleteProposal: async (id: string): Promise<void> => {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/proposals/${id}`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete proposal');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to delete proposal');
    }
  },

  // Withdraw proposal
  withdrawProposal: async (id: string): Promise<void> => {
    try {
      const response = await api.post<{ success: boolean; message: string }>(
        `/proposals/${id}/withdraw`
      );
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to withdraw proposal');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Failed to withdraw proposal');
    }
  }
};