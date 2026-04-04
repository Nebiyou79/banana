// components/admin/TenderManagement.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useAdminData } from '../../hooks/useAdmin';
import { useToast } from '@/hooks/use-toast';
import TenderTable from './TenderTable';

interface Tender {
  _id: string;
  title: string;
  company: {
    name: string;
    verified: boolean;
    industry?: string;
  };
  status: string;
  category: string;
  budget: {
    min: number;
    max: number;
    currency: string;
  };
  proposals: any[];
  createdAt: string;
  deadline: string;
  description?: string;
  skillsRequired?: string[];
  moderated?: boolean;
  moderationReason?: string;
}

interface EditTenderFormData {
  title: string;
  status: string;
  description: string;
  category: string;
}

interface PaginationData {
  currentPage: number;
  limit: number;
  total: number;
  hasPrev?: boolean;
  hasNext?: boolean;
  totalPages?: number;
}

const TenderManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    category: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [editingTender, setEditingTender] = useState<Tender | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Tender | null>(null);
  const [editFormData, setEditFormData] = useState<EditTenderFormData>({
    title: '',
    status: 'draft',
    description: '',
    category: ''
  });

  const { 
    getTenders, 
    updateTenderStatus, 
    moderateTender, 
    data, 
    loading, 
    error 
  } = useAdminData();
  const { toast } = useToast();

  // Debug the data structure
  useEffect(() => {
    console.log('Tender Management Data:', data);
    console.log('Loading:', loading);
    console.log('Error:', error);
  }, [data, loading, error]);

  useEffect(() => {
    loadTenders();
  }, [filters, currentPage, itemsPerPage]);

  const loadTenders = async () => {
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      };
      console.log('Loading tenders with params:', params);
      await getTenders(params);
    } catch (err) {
      console.error('Failed to load tenders:', err);
      toast({
        title: 'Error',
        description: 'Failed to load tenders',
        variant: 'destructive',
      });
    }
  };

  // Helper function to extract tenders from different possible response structures
  const getTendersFromResponse = (responseData: any): Tender[] => {
    if (!responseData) return [];
    
    // Try different possible response structures
    if (Array.isArray(responseData)) {
      return responseData;
    }
    if (responseData.data && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    if (responseData.tenders && Array.isArray(responseData.tenders)) {
      return responseData.tenders;
    }
    if (responseData.success && Array.isArray(responseData.data)) {
      return responseData.data;
    }
    
    console.warn('Unknown response structure:', responseData);
    return [];
  };

  // Helper function to extract pagination from different possible response structures
  const getPaginationFromResponse = (responseData: any): PaginationData | null => {
    if (!responseData) return null;
    
    if (responseData.pagination) {
      return responseData.pagination;
    }
    if (responseData.data?.pagination) {
      return responseData.data.pagination;
    }
    
    // If no pagination info, create basic info from the data we have
    const tenders = getTendersFromResponse(responseData);
    if (tenders.length > 0) {
      return {
        currentPage,
        limit: itemsPerPage,
        total: tenders.length,
        hasPrev: currentPage > 1,
        hasNext: tenders.length === itemsPerPage
      };
    }
    
    return null;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleEditTender = (tender: Tender) => {
    setEditingTender(tender);
    setEditFormData({
      title: tender.title,
      status: tender.status,
      description: tender.description || '',
      category: tender.category
    });
  };

  const handleSaveEdit = async () => {
    if (!editingTender) return;

    try {
      await updateTenderStatus(editingTender._id, editFormData);
      setEditingTender(null);
      await loadTenders();
      toast({
        title: 'Success',
        description: 'Tender updated successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to update tender',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteTender = async (tenderId: string) => {
    try {
      await updateTenderStatus(tenderId, { status: 'cancelled' });
      setDeleteConfirm(null);
      await loadTenders();
      toast({
        title: 'Success',
        description: 'Tender cancelled successfully',
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || 'Failed to cancel tender',
        variant: 'destructive',
      });
    }
  };

  const handleModerateTender = async (tenderId: string, action: 'flag' | 'approve') => {
    try {
      await moderateTender(tenderId, { 
        action, 
        reason: action === 'flag' ? 'Inappropriate content' : undefined 
      });
      await loadTenders();
      toast({
        title: 'Success',
        description: `Tender ${action === 'flag' ? 'flagged' : 'approved'} successfully`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: err.message || `Failed to ${action} tender`,
        variant: 'destructive',
      });
    }
  };

  // Safe pagination calculations
  const getPaginationInfo = () => {
    const pagination = getPaginationFromResponse(data);
    
    if (!pagination) return null;
    
    try {
      const currentPage = Number(pagination.currentPage) || 1;
      const limit = Number(pagination.limit) || itemsPerPage;
      const total = Number(pagination.total) || 0;
      
      const safeCurrentPage = Math.max(1, currentPage);
      const safeLimit = Math.max(1, limit);
      const safeTotal = Math.max(0, total);
      
      const startItem = ((safeCurrentPage - 1) * safeLimit) + 1;
      const endItem = Math.min(safeCurrentPage * safeLimit, safeTotal);
      
      const totalPages = Math.ceil(safeTotal / safeLimit);
      const hasNext = pagination.hasNext !== undefined ? pagination.hasNext : safeCurrentPage < totalPages;
      const hasPrev = pagination.hasPrev !== undefined ? pagination.hasPrev : safeCurrentPage > 1;
      
      return {
        currentPage: safeCurrentPage,
        limit: safeLimit,
        total: safeTotal,
        startItem: Math.max(1, startItem),
        endItem: Math.max(1, endItem),
        hasNext,
        hasPrev,
        totalPages
      };
    } catch (error) {
      console.error('Error processing pagination data:', error);
      return null;
    }
  };

  const tenders = getTendersFromResponse(data);
  const paginationInfo = getPaginationInfo();
  const shouldShowPagination = paginationInfo && paginationInfo.total > 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Tender Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all tender postings in the system</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search Tenders
            </label>
            <input
              type="text"
              placeholder="Search tenders..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Categories</option>
              <option value="web-development">Web Development</option>
              <option value="mobile-development">Mobile Development</option>
              <option value="design">Design</option>
              <option value="writing">Writing</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Items per page
            </label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tenders Table */}
      <TenderTable
        tenders={tenders}
        loading={loading}
        onEdit={handleEditTender}
        onDelete={handleDeleteTender}
        onModerate={handleModerateTender}
      />

      {/* Pagination */}
      {shouldShowPagination && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{paginationInfo.startItem}</span> to{' '}
              <span className="font-medium">{paginationInfo.endItem}</span> of{' '}
              <span className="font-medium">{paginationInfo.total}</span> tenders
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(paginationInfo.currentPage - 1)}
              disabled={!paginationInfo.hasPrev}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(paginationInfo.currentPage + 1)}
              disabled={!paginationInfo.hasNext}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Edit Tender Modal */}
      {editingTender && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-2xl mx-4">
            <h2 className="text-xl font-bold mb-4">Edit Tender</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tender Title *</label>
                <input
                  type="text"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status *</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  required
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  value={editFormData.category}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="web-development">Web Development</option>
                  <option value="mobile-development">Mobile Development</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="marketing">Marketing</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={editFormData.description}
                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={4}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setEditingTender(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md mx-4">
            <h2 className="text-xl font-bold mb-2">Confirm Cancel</h2>
            <p className="mb-4">Are you sure you want to cancel the tender `{deleteConfirm.title}`? This will mark it as cancelled.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteTender(deleteConfirm._id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel Tender
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenderManagement;