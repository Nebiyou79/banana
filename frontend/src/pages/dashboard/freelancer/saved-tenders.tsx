/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/tender/saved-tender.tsx
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import FreelancerTenderCard from '@/components/tenders/FreelancerTenderCard';
import { TenderService, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  BookmarkIcon,
  BookmarkSlashIcon,
  TrashIcon,
  SparklesIcon,
  EyeIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

const SavedTendersPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [savedTenders, setSavedTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedTenders, setSelectedTenders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadSavedTenders();
    } else {
      router.push('/login');
    }
  }, [user]);

  const loadSavedTenders = async () => {
    try {
      setLoading(true);
      const response = await TenderService.getSavedTenders();
      setSavedTenders(response.data.tenders || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load saved tenders');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToggle = async (tenderId: string, saved: boolean) => {
    try {
      await TenderService.toggleSaveTender(tenderId);
      
      if (saved) {
        // Remove from saved list
        setSavedTenders(prev => prev.filter(tender => tender._id !== tenderId));
        setSelectedTenders(prev => {
          const newSelected = new Set(prev);
          newSelected.delete(tenderId);
          return newSelected;
        });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleSelectTender = (tenderId: string) => {
    setSelectedTenders(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(tenderId)) {
        newSelected.delete(tenderId);
      } else {
        newSelected.add(tenderId);
      }
      return newSelected;
    });
  };

  const handleBulkRemove = async () => {
    if (selectedTenders.size === 0) return;

    try {
      const removePromises = Array.from(selectedTenders).map(tenderId =>
        TenderService.toggleSaveTender(tenderId)
      );
      
      await Promise.all(removePromises);
      
      // Remove from local state
      setSavedTenders(prev => prev.filter(tender => !selectedTenders.has(tender._id)));
      setSelectedTenders(new Set());
    } catch (err) {
      console.error('Error bulk removing:', err);
    }
  };

  const handleSelectAll = () => {
    if (selectedTenders.size === savedTenders.length) {
      setSelectedTenders(new Set());
    } else {
      setSelectedTenders(new Set(savedTenders.map(tender => tender._id)));
    }
  };

  const getExpiredTenders = () => {
    const now = new Date();
    return savedTenders.filter(tender => {
      const deadline = new Date(tender.deadline);
      return deadline < now;
    });
  };

  const getUrgentTenders = () => {
    const now = new Date();
    return savedTenders.filter(tender => {
      const deadline = new Date(tender.deadline);
      const daysRemaining = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysRemaining <= 3 && daysRemaining >= 0;
    });
  };

  const expiredTenders = getExpiredTenders();
  const urgentTenders = getUrgentTenders();
  const activeTenders = savedTenders.filter(tender => {
    const deadline = new Date(tender.deadline);
    const daysRemaining = Math.ceil((deadline.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysRemaining > 3;
  });

  if (!user) {
    return null;
  }

  return (
    <FreelancerLayout>
      <Head>
        <title>Saved Projects | Freelancer Dashboard</title>
        <meta name="description" content="Manage your saved freelance projects and opportunities" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-pink-800 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center max-w-4xl mx-auto">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <BookmarkSolid className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-300 font-semibold text-sm">SAVED PROJECTS</span>
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Your Saved
                <span className="block text-yellow-300 mt-2">Opportunities</span>
              </h1>
              
              <p className="text-xl text-purple-100 mb-8 leading-relaxed max-w-2xl mx-auto">
                Keep track of projects that caught your eye. Apply when you`re ready or remove them from your list.
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{savedTenders.length}</div>
                  <div className="text-sm text-purple-200">Total Saved</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{activeTenders.length}</div>
                  <div className="text-sm text-purple-200">Active</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{urgentTenders.length}</div>
                  <div className="text-sm text-purple-200">Urgent</div>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
                  <div className="text-2xl font-bold text-white">{expiredTenders.length}</div>
                  <div className="text-sm text-purple-200">Expired</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          {/* Bulk Actions Bar */}
          {savedTenders.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTenders.size === savedTenders.length && savedTenders.length > 0}
                      onChange={handleSelectAll}
                      className="w-4 h-4 text-blue-500 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Select all ({selectedTenders.size} selected)
                    </span>
                  </div>
                </div>

                {selectedTenders.size > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {selectedTenders.size} project{selectedTenders.size !== 1 ? 's' : ''} selected
                    </span>
                    <button
                      onClick={handleBulkRemove}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors font-medium"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Remove Selected
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts */}
          {urgentTenders.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />
                <div>
                  <h4 className="font-semibold text-orange-800">Urgent Applications</h4>
                  <p className="text-orange-700 text-sm">
                    {urgentTenders.length} of your saved projects are ending in 3 days or less. Apply soon!
                  </p>
                </div>
              </div>
            </div>
          )}

          {expiredTenders.length > 0 && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-2xl">
              <div className="flex items-center gap-3">
                <ClockIcon className="h-5 w-5 text-red-500" />
                <div>
                  <h4 className="font-semibold text-red-800">Expired Projects</h4>
                  <p className="text-red-700 text-sm">
                    {expiredTenders.length} of your saved projects have expired. You can remove them to keep your list clean.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Tenders Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                  <div className="h-5 bg-gray-200 rounded mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookmarkSlashIcon className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Saved Projects</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={loadSavedTenders}
                  className="w-full bg-purple-500 text-white py-3 px-6 rounded-xl hover:bg-purple-600 transition-colors font-semibold"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : savedTenders.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookmarkIcon className="h-8 w-8 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Saved Projects Yet</h3>
                <p className="text-gray-600 mb-6">
                  Start exploring projects and save the ones that interest you to come back to them later.
                </p>
                <button
                  onClick={() => router.push('/dashboard/freelancer/tenders')}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200 font-semibold"
                >
                  Browse Projects
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Urgent Tenders Section */}
              {urgentTenders.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                      <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Urgent - Apply Soon!</h2>
                    <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                      {urgentTenders.length} projects
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {urgentTenders.map(tender => (
                      <div key={tender._id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTenders.has(tender._id)}
                          onChange={() => handleSelectTender(tender._id)}
                          className="absolute top-4 left-4 w-5 h-5 text-blue-500 rounded focus:ring-blue-500 z-10"
                        />
                        <FreelancerTenderCard
                          tender={tender}
                          onSaveToggle={handleSaveToggle}
                          saved={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Active Tenders Section */}
              {activeTenders.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                      <SparklesIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Active Projects</h2>
                    <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {activeTenders.length} projects
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {activeTenders.map(tender => (
                      <div key={tender._id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTenders.has(tender._id)}
                          onChange={() => handleSelectTender(tender._id)}
                          className="absolute top-4 left-4 w-5 h-5 text-blue-500 rounded focus:ring-blue-500 z-10"
                        />
                        <FreelancerTenderCard
                          tender={tender}
                          onSaveToggle={handleSaveToggle}
                          saved={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expired Tenders Section */}
              {expiredTenders.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-gradient-to-r from-gray-500 to-gray-600 rounded-xl">
                      <ClockIcon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Expired Projects</h2>
                    <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                      {expiredTenders.length} projects
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {expiredTenders.map(tender => (
                      <div key={tender._id} className="relative">
                        <input
                          type="checkbox"
                          checked={selectedTenders.has(tender._id)}
                          onChange={() => handleSelectTender(tender._id)}
                          className="absolute top-4 left-4 w-5 h-5 text-blue-500 rounded focus:ring-blue-500 z-10"
                        />
                        <FreelancerTenderCard
                          tender={tender}
                          onSaveToggle={handleSaveToggle}
                          saved={true}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default SavedTendersPage;