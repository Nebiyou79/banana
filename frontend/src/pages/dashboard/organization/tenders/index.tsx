/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import OrganizationTenderCard from '@/components/tenders/OrganizationTenderCard';
import { TenderService, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import {
  PlusIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingLibraryIcon
} from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const OrganizationTendersPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [successMessage, setSuccessMessage] = useState('');

  // Check for success message from query params
  useEffect(() => {
    if (router.query.updated === 'true') {
      setSuccessMessage('Tender updated successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    if (router.query.created === 'true') {
      setSuccessMessage('Tender created successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
    if (router.query.deleted === 'true') {
      setSuccessMessage('Tender deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [router.query]);

  // Redirect if not an organization
  useEffect(() => {
    if (user && user.role !== 'organization') {
      router.push('/tenders');
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.role === 'organization') {
      loadMyTenders();
    }
  }, [user]);

  const loadMyTenders = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await TenderService.getMyOrganizationTenders();
      
      // Ensure all tenders have IDs for React keys
      const tendersWithSafeIds = (response.data.tenders || []).map((tender, index) => ({
        ...tender,
        _id: tender._id || `temp-${index}-${Date.now()}`
      }));
      
      setTenders(tendersWithSafeIds);
    } catch (err: any) {
      console.error('Error loading tenders:', err);
      setError(err.response?.data?.message || 'Failed to load your tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTender = () => {
    router.push('/dashboard/organization/tenders/create');
  };

  const handleEditTender = (tenderId: string) => {
    if (!tenderId || tenderId.startsWith('temp-')) {
      setError('Cannot edit tender at this time. Please try again later.');
      return;
    }
    router.push(`/dashboard/organization/tenders/${tenderId}/edit`);
  };

  const handleViewTender = (tenderId: string) => {
    if (!tenderId || tenderId.startsWith('temp-')) {
      setError('Cannot view tender details at this time. Please try again later.');
      return;
    }
    router.push(`/dashboard/organization/tenders/${tenderId}`);
  };

  const handleDeleteTender = async (tenderId: string) => {
    if (!tenderId || tenderId.startsWith('temp-')) {
      setError('Cannot delete tender at this time. Please try again later.');
      return;
    }

    if (!confirm('Are you sure you want to delete this tender? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(tenderId);
    try {
      await TenderService.deleteTender(tenderId);
      setTenders(prev => prev.filter(tender => tender._id !== tenderId));
      setSuccessMessage('Tender deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete tender';
      setError(errorMessage);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'open':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'draft':
        return <DocumentTextIcon className="h-4 w-4" />;
      case 'completed':
        return <ChartBarIcon className="h-4 w-4" />;
      case 'cancelled':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      case 'open':
        return <ClockIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  const getStats = () => {
    const total = tenders.length;
    const published = tenders.filter(t => t.status === 'published').length;
    const draft = tenders.filter(t => t.status === 'draft').length;
    const completed = tenders.filter(t => t.status === 'completed').length;
    const cancelled = tenders.filter(t => t.status === 'cancelled').length;
    const open = tenders.filter(t => t.status === 'open').length;

    return { total, published, draft, completed, cancelled, open };
  };

  // Filter tenders based on search and status
  const filteredTenders = tenders.filter(tender => {
    const matchesSearch = tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tender.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tender.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = getStats();

  if (!user || user.role !== 'organization') {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only organizations can access this page.</p>
            <button
              onClick={() => router.push('/tenders')}
              className={`px-6 py-2 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors`}
            >
              Browse Tenders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <Head>
        <title>My Organization Tenders | Freelance Platform</title>
        <meta name="description" content="Manage your organization's tenders and projects" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">Organization Tenders</h1>
                <p className="text-purple-200">Manage your organization`s projects and tenders</p>
              </div>
              
              <button
                onClick={handleCreateTender}
                className={`flex items-center gap-2 px-6 py-3 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium mt-4 lg:mt-0`}
              >
                <PlusIcon className="h-5 w-5" />
                Create New Tender
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-400 mr-2" />
                <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                <button
                  onClick={() => setSuccessMessage('')}
                  className="ml-auto text-green-600 hover:text-green-800 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800 text-sm font-medium">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-600 hover:text-red-800 transition-colors"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Stats Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Tenders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Published</p>
                  <p className="text-2xl font-bold text-green-600">{stats.published}</p>
                </div>
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Drafts</p>
                  <p className="text-2xl font-bold text-gray-600">{stats.draft}</p>
                </div>
                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                  <DocumentTextIcon className="h-6 w-6 text-gray-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open</p>
                  <p className="text-2xl font-bold text-emerald-600">{stats.open}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <ClockIcon className="h-6 w-6 text-emerald-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ChartBarIcon className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Cancelled</p>
                  <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
                </div>
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tenders by title or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors min-w-[150px] bg-white"
                  >
                    <option value="all">All Status</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="open">Open</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <FunnelIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
                <button 
                  onClick={() => {
                    setSearchTerm('');
                    setStatusFilter('all');
                  }}
                  className="flex items-center gap-2 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Tenders Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="flex gap-1 mb-4">
                    <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Tenders</h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">{error}</p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={loadMyTenders}
                  className={`px-6 py-2 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
                >
                  Try Again
                </button>
                <button
                  onClick={handleCreateTender}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Create First Tender
                </button>
              </div>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
              <BuildingLibraryIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tenders.length === 0 ? 'No Tenders Created Yet' : 'No Matching Tenders Found'}
              </h3>
              <p className="text-gray-500 max-w-md mx-auto mb-6">
                {tenders.length === 0 
                  ? 'Create your first tender to start receiving proposals from qualified freelancers.'
                  : 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                }
              </p>
              {tenders.length === 0 && (
                <button
                  onClick={handleCreateTender}
                  className={`px-6 py-3 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
                >
                  Create Your First Tender
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredTenders.map((tender, index) => (
                <div 
                  key={tender._id || `tender-${index}`} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden group hover:shadow-lg transition-all duration-300"
                >
                  <OrganizationTenderCard
                    tender={tender}
                    showActions={false}
                    showStatus={true}
                  />
                  
                  {/* Action Buttons */}
                  <div className="p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleViewTender(tender._id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors font-medium group/action"
                          title="View tender details"
                        >
                          <EyeIcon className="h-4 w-4 group-hover/action:scale-110 transition-transform" />
                          View
                        </button>
                        
                        <button
                          onClick={() => handleEditTender(tender._id)}
                          className="flex items-center gap-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-800 transition-colors font-medium group/action"
                          title="Edit tender"
                        >
                          <PencilIcon className="h-4 w-4 group-hover/action:scale-110 transition-transform" />
                          Edit
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteTender(tender._id)}
                        disabled={deleteLoading === tender._id || (tender.proposals && tender.proposals.length > 0)}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium group/action"
                        title={tender.proposals && tender.proposals.length > 0 ? "Cannot delete tender with proposals" : "Delete tender"}
                      >
                        {deleteLoading === tender._id ? (
                          <div className="flex items-center gap-1">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-red-600"></div>
                            Deleting...
                          </div>
                        ) : (
                          <>
                            <TrashIcon className="h-4 w-4 group-hover/action:scale-110 transition-transform" />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                    
                    {tender.proposals && tender.proposals.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                        <UserGroupIcon className="h-3 w-3" />
                        {tender.proposals.length} proposal{tender.proposals.length !== 1 ? 's' : ''} submitted
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default OrganizationTendersPage;