/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import UserTable from './UserTable';
import { useAdminData } from '../../hooks/useAdmin';

const UserManagement: React.FC = () => {
  const [filters, setFilters] = useState({
    role: '',
    status: '',
    search: '',
    verified: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { getUsers, data, loading, error } = useAdminData();

  useEffect(() => {
    loadUsers();
  }, [filters, currentPage, itemsPerPage]);

  const loadUsers = async () => {
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: itemsPerPage
      };
      await getUsers(params);
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleEditUser = (user: any) => {
    console.log('Edit user:', user);
    // Implement edit functionality
  };

  const handleDeleteUser = (userId: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      console.log('Delete user:', userId);
      // Implement delete functionality
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all users in the system</p>
        </div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors">
          + Add User
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Roles</option>
              <option value="candidate">Candidate</option>
              <option value="freelancer">Freelancer</option>
              <option value="company">Company</option>
              <option value="admin">Admin</option>
            </select>
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
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Verification
            </label>
            <select
              value={filters.verified}
              onChange={(e) => handleFilterChange('verified', e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All</option>
              <option value="true">Verified</option>
              <option value="false">Not Verified</option>
            </select>
          </div>
        </div>
        
        <div className="flex justify-between items-center">
          <button
            onClick={() => setFilters({ role: '', status: '', search: '', verified: '' })}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white"
          >
            Clear Filters
          </button>
          
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="border border-gray-300 dark:border-gray-600 rounded-lg px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="10">10 per page</option>
            <option value="25">25 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* User Table */}
      <UserTable
        users={data?.users || []}
        loading={loading}
        onEdit={handleEditUser}
        onDelete={handleDeleteUser}
      />

      {/* Pagination */}
      {data?.pagination && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <div>
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Showing <span className="font-medium">{(data.pagination.currentPage - 1) * data.pagination.limit + 1}</span> to{' '}
              <span className="font-medium">{Math.min(data.pagination.currentPage * data.pagination.limit, data.pagination.total)}</span> of{' '}
              <span className="font-medium">{data.pagination.total}</span> users
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(data.pagination.currentPage - 1)}
              disabled={!data.pagination.hasPrev}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentPage(data.pagination.currentPage + 1)}
              disabled={!data.pagination.hasNext}
              className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;