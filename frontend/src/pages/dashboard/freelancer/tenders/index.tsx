/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/freelancer/tender/index.tsx
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { FreelancerLayout } from '@/components/layout/FreelancerLayout';
import FreelancerTenderCard from '@/components/tenders/FreelancerTenderCard';
import TenderFilters from '@/components/tenders/TenderFilters';
import { TenderService, Tender, TenderFilters as TenderFiltersType } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  RocketLaunchIcon,
  BriefcaseIcon,
  CurrencyDollarIcon,
  ClockIcon,
  StarIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const FreelancerTendersPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<TenderFiltersType>({
    page: 1,
    limit: 12,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0
  });
  const [savedTenders, setSavedTenders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadTenders();
  }, [filters]);

  useEffect(() => {
    if (user) {
      loadSavedTenders();
    }
  }, [user]);

  const loadTenders = async () => {
    try {
      setLoading(true);
      const response = await TenderService.getTenders(filters);
      setTenders(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tenders');
    } finally {
      setLoading(false);
    }
  };

  const loadSavedTenders = async () => {
    try {
      const response = await TenderService.getSavedTenders();
      const savedIds = new Set(response.data.tenders.map((tender: Tender) => tender._id));
      setSavedTenders(savedIds);
    } catch (err) {
      console.error('Error loading saved tenders:', err);
    }
  };

  const handleSaveToggle = async (tenderId: string, saved: boolean) => {
    if (!user) {
      router.push('/login');
      return;
    }

    try {
      await TenderService.toggleSaveTender(tenderId);
      
      const newSaved = new Set(savedTenders);
      if (saved) {
        newSaved.delete(tenderId);
      } else {
        newSaved.add(tenderId);
      }
      setSavedTenders(newSaved);

      // Update local state
      setTenders(prev => prev.map(tender => 
        tender._id === tenderId 
          ? { ...tender, isSaved: !saved }
          : tender
      ));
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleFiltersChange = (newFilters: TenderFiltersType) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setSearchQuery('');
    setShowFilters(false);
  };

  const QuickStat = ({ icon: Icon, value, label, color }: any) => (
    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 hover:bg-white/20 transition-all duration-300">
      <div className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${color} shadow-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-bold text-white">{value}</div>
          <div className="text-blue-100 text-sm">{label}</div>
        </div>
      </div>
    </div>
  );

  const FeaturePill = ({ icon: Icon, text }: any) => (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full border border-white/20">
      <Icon className="h-4 w-4 text-yellow-300" />
      <span className="text-white text-sm font-medium">{text}</span>
    </div>
  );

  return (
    <FreelancerLayout>
      <Head>
        <title>Find Projects | Freelancer Dashboard</title>
        <meta name="description" content="Discover premium freelance projects that match your skills and expertise" />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
        {/* Enhanced Header with Different Design */}
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white overflow-hidden">
          {/* Background Elements */}
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-purple-400/10 rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center max-w-4xl mx-auto">
              {/* Premium Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                <RocketLaunchIcon className="h-4 w-4 text-yellow-300" />
                <span className="text-yellow-300 font-semibold text-sm">FREELANCE OPPORTUNITIES</span>
              </div>
              
              {/* Main Heading */}
              <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                Launch Your Next
                <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent mt-2">
                  Career Project
                </span>
              </h1>
              
              <p className="text-xl text-indigo-100 mb-8 leading-relaxed max-w-2xl mx-auto">
                Discover projects that align with your expertise. From startups to enterprises, 
                find opportunities that help you grow and earn.
              </p>

              {/* Feature Pills */}
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                <FeaturePill icon={BriefcaseIcon} text="Remote Work" />
                <FeaturePill icon={CurrencyDollarIcon} text="Competitive Pay" />
                <FeaturePill icon={StarIcon} text="Verified Clients" />
                <FeaturePill icon={MapPinIcon} text="Global Opportunities" />
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 max-w-2xl mx-auto">
                <QuickStat 
                  icon={BriefcaseIcon}
                  value="1.2K+"
                  label="Active Projects"
                  color="bg-indigo-500"
                />
                <QuickStat 
                  icon={StarIcon}
                  value="89+"
                  label="Premium Clients"
                  color="bg-purple-500"
                />
                <QuickStat 
                  icon={CurrencyDollarIcon}
                  value="$3K+"
                  label="Average Budget"
                  color="bg-pink-500"
                />
                <QuickStat 
                  icon={ClockIcon}
                  value="24h"
                  label="Quick Response"
                  color="bg-orange-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8">
          {/* Filters Bar */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <FunnelIcon className="h-5 w-5 text-indigo-600" />
                  <span className="font-semibold text-gray-900">Quick Filters</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleFiltersChange({ ...filters, sortBy: 'createdAt' })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filters.sortBy === 'createdAt'
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    🆕 Newest
                  </button>
                  <button
                    onClick={() => handleFiltersChange({ ...filters, sortBy: 'deadline' })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filters.sortBy === 'deadline'
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    ⏰ Ending Soon
                  </button>
                  <button
                    onClick={() => handleFiltersChange({ ...filters, sortBy: 'budget.max' })}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      filters.sortBy === 'budget.max'
                        ? 'bg-indigo-500 text-white shadow-sm'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    💰 Highest Budget
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-4">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'grid' 
                        ? 'bg-white text-indigo-500 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-all duration-200 ${
                      viewMode === 'list' 
                        ? 'bg-white text-indigo-500 shadow-sm' 
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <ListBulletIcon className="h-4 w-4" />
                  </button>
                </div>

                {/* Results Count */}
                <div className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="font-semibold text-gray-900">{tenders.length}</span> of{' '}
                  <span className="font-semibold text-gray-900">{pagination.total}</span> projects
                </div>

                {/* Advanced Filters Toggle */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 shadow-sm ${
                    showFilters
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                      : 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white hover:from-indigo-600 hover:to-purple-600'
                  }`}
                >
                  <FunnelIcon className="h-4 w-4" />
                  {showFilters ? 'Hide Filters' : 'Advanced Filters'}
                </button>
              </div>
            </div>

            {/* Advanced Filters Component */}
            {showFilters && (
              <div className="mt-6">
                <TenderFilters
                  filters={filters}
                  onFiltersChange={handleFiltersChange}
                  onReset={clearFilters}
                  showTenderTypeFilter={true}
                />
              </div>
            )}
          </div>

          {/* Tenders Grid */}
          {loading ? (
            <div className={`grid gap-6 ${
              viewMode === 'grid' 
                ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
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
                  <MagnifyingGlassIcon className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Projects</h3>
                <p className="text-gray-600 mb-6">{error}</p>
                <button
                  onClick={loadTenders}
                  className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-sm"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : tenders.length === 0 ? (
            <div className="text-center py-16">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-indigo-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                <p className="text-gray-600 mb-6">
                  {filters.search || filters.category
                    ? "Try adjusting your search criteria or browse all available projects."
                    : "Currently there are no active projects matching your criteria."
                  }
                </p>
                {(filters.search || filters.category) && (
                  <button
                    onClick={clearFilters}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-3 px-6 rounded-xl hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 font-semibold shadow-sm"
                  >
                    Browse All Projects
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className={`grid gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
                {tenders.map(tender => (
                  <FreelancerTenderCard
                    key={tender._id}
                    tender={tender}
                    onSaveToggle={user ? handleSaveToggle : undefined}
                    saved={savedTenders.has(tender._id)}
                    compact={viewMode === 'list'}
                  />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && (
                <div className="flex justify-center items-center gap-3 mt-12">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                  >
                    ← Previous
                  </button>
                  
                  <div className="flex items-center gap-2">
                    {[...Array(Math.min(5, pagination.pages))].map((_, i) => {
                      const page = i + 1;
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                            pagination.page === page
                              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-sm'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {page}
                        </button>
                      );
                    })}
                  </div>
                  
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </FreelancerLayout>
  );
};

export default FreelancerTendersPage;