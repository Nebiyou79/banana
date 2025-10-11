/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/tenders/index.tsx - MODERN PROFESSIONAL VERSION
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TenderCard from '@/components/tenders/TenderCard';
import TenderFilters from '@/components/tenders/TenderFilters';
import { TenderService, Tender, TenderFilters as TenderFiltersType } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
  SparklesIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  CurrencyDollarIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const TendersPage: NextPage = () => {
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
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
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState({
    totalTenders: 1250,
    activeCompanies: 89,
    totalFreelancers: 3500,
    avgBudget: 2500
  });

  useEffect(() => {
    loadTenders();
  }, [filters]);

  useEffect(() => {
    if (user?.role === 'freelancer') {
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
    if (!user || user.role !== 'freelancer') return;
    
    try {
      const response = await TenderService.getSavedTenders();
      const savedIds = new Set(response.data.tenders.map(tender => tender._id));
      setSavedTenders(savedIds);
    } catch (err) {
      console.error('Error loading saved tenders:', err);
    }
  };

  const handleFiltersChange = (newFilters: TenderFiltersType) => {
    setFilters({ ...newFilters, page: 1 });
  };

  const handleSaveToggle = async (tenderId: string, saved: boolean) => {
    if (!user || user.role !== 'freelancer') {
      router.push('/login?returnTo=/tenders');
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

      setTenders(prev => prev.map(tender => 
        tender._id === tenderId 
          ? {
              ...tender,
              metadata: {
                ...tender.metadata,
                savedBy: saved 
                  ? tender.metadata.savedBy.filter(id => id !== user._id)
                  : [...tender.metadata.savedBy, user._id]
              }
            }
          : tender
      ));
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handlePageChange = (newPage: number) => {
    setFilters(prev => ({ ...prev, page: newPage }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCreateTender = () => {
    if (!user) {
      router.push('/login?returnTo=/dashboard/company/tenders/create');
      return;
    }
    if (user.role !== 'company') {
      return;
    }
    router.push('/dashboard/company/tenders/create');
  };

  const StatCard = ({ icon: Icon, value, label, description, color }: any) => (
    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${color} shadow-md`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
          <div className="text-sm font-semibold text-gray-700 mb-1">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
      </div>
    </div>
  );

  const QuickFilter = ({ label, count, active, onClick }: any) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
        active
          ? `${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} shadow-md`
          : 'bg-white text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300'
      }`}
    >
      {label}
      {count && (
        <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
          active ? 'bg-darkNavy text-white' : 'bg-gray-100 text-gray-600'
        }`}>
          {count}
        </span>
      )}
    </button>
  );

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenMustard mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading opportunities...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Head>
        <title>Find Projects | Professional Marketplace</title>
        <meta name="description" content="Discover premium freelance projects from top companies. Find your next opportunity that matches your expertise." />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-gray-500 to-gray-100">
        {/* Modern Header with Stats */}
        <div className="relative bg-gradient-to-r from-blue-800 to-gray-900 text-white overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.15)_1px,transparent_0)] bg-[length:20px_20px]"></div>
          <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-l from-goldenMustard/10 to-transparent rounded-full blur-3xl"></div>
          
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1">
                {/* Premium Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 mb-6">
                  <SparklesIcon className="h-4 w-4 text-goldenMustard" />
                  <span className="text-goldenMustard font-semibold text-sm">PREMIUM PROJECTS</span>
                </div>
                
                {/* Main Heading */}
                <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
                  Find Your Next
                  <span className="block text-goldenMustard mt-2">Career Opportunity</span>
                </h1>
                
                <p className="text-xl text-gray-300 max-w-2xl mb-8 leading-relaxed">
                  Connect with innovative companies and work on projects that matter. 
                  From startups to enterprises, find opportunities that match your expertise.
                </p>
                
                {/* Platform Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <StatCard 
                    icon={BuildingOfficeIcon}
                    value={`${stats.totalTenders}+`}
                    label="Active Projects"
                    description="Available now"
                    color={colorClasses.bg.blue}
                  />
                  <StatCard 
                    icon={UserGroupIcon}
                    value={`${stats.activeCompanies}+`}
                    label="Verified Companies"
                    description="Hiring talent"
                    color={colorClasses.bg.teal}
                  />
                  <StatCard 
                    icon={CurrencyDollarIcon}
                    value={`$${stats.avgBudget}+`}
                    label="Avg. Budget"
                    description="Per project"
                    color={colorClasses.bg.orange}
                  />
                  <StatCard 
                    icon={ClockIcon}
                    value="24h"
                    label="Avg. Response"
                    description="Quick replies"
                    color={colorClasses.bg.goldenMustard}
                  />
                </div>

                {/* Quick Filters */}
                <div className="flex flex-wrap gap-3">
                  <QuickFilter label="All Projects" count={stats.totalTenders} active={!filters.category} onClick={() => handleFiltersChange({ ...filters, category: undefined })} />
                  <QuickFilter label="Web Development" active={filters.category === 'web_development'} onClick={() => handleFiltersChange({ ...filters, category: 'web_development' })} />
                  <QuickFilter label="Design" active={filters.category === 'design'} onClick={() => handleFiltersChange({ ...filters, category: 'design' })} />
                  <QuickFilter label="Marketing" active={filters.category === 'marketing'} onClick={() => handleFiltersChange({ ...filters, category: 'marketing' })} />
                </div>
              </div>
              
              {/* Create Project CTA */}
              {user?.role === 'company' && (
                <div className="lg:text-right">
                  <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-sm">
                    <h3 className="text-xl font-bold text-white mb-3">Ready to Hire Talent?</h3>
                    <p className="text-gray-300 mb-4 text-sm leading-relaxed">
                      Post your project and connect with vetted professionals from around the world.
                    </p>
                    <button
                      onClick={handleCreateTender}
                      className="group relative bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl w-full"
                    >
                      <span className="flex items-center gap-2 justify-center">
                        <PlusIcon className="h-5 w-5" />
                        Post a Project
                      </span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-8 relative z-10">
          
          {/* Modern Filters Section */}
          <div className="mb-8">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <FunnelIcon className="h-5 w-5 text-gray-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Refine Results</h3>
                  </div>
                  <button
                    onClick={() => setFilters({
                      page: 1,
                      limit: 12,
                      sortBy: 'createdAt',
                      sortOrder: 'desc'
                    })}
                    className="text-sm text-goldenMustard hover:text-yellow-600 font-medium transition-colors"
                  >
                    Clear All Filters
                  </button>
                </div>
                
                <div className="flex items-center gap-4">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'grid' 
                          ? `${colorClasses.bg.white} ${colorClasses.text.goldenMustard} shadow-sm` 
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <Squares2X2Icon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded-md transition-all duration-200 ${
                        viewMode === 'list' 
                          ? `${colorClasses.bg.white} ${colorClasses.text.goldenMustard} shadow-sm` 
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
                    {filters.search && (
                      <span className="text-goldenMustard font-medium"> for `{filters.search}`</span>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Filters Component */}
              <TenderFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onReset={() => setFilters({
                  page: 1,
                  limit: 12,
                  sortBy: 'createdAt',
                  sortOrder: 'desc'
                })}
              />
            </div>
          </div>

          {/* Projects Grid */}
          <div>
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
                    <div className="flex gap-1 mb-4">
                      <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </div>
                    <div className="h-12 bg-gray-200 rounded-xl"></div>
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
                    className={`px-6 py-3 ${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} rounded-xl hover:shadow-lg transition-all duration-200 font-semibold w-full`}
                  >
                    Try Again
                  </button>
                </div>
              </div>
            ) : tenders.length === 0 ? (
              <div className="text-center py-16">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MagnifyingGlassIcon className="h-8 w-8 text-blue-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No Projects Found</h3>
                  <p className="text-gray-600 mb-6">
                    {filters.search || filters.category || filters.skills
                      ? "Try adjusting your search criteria or browse all available projects."
                      : "Currently there are no active projects. Please check back later for new opportunities."
                    }
                  </p>
                  {(filters.search || filters.category || filters.skills) && (
                    <button
                      onClick={() => setFilters({
                        page: 1,
                        limit: 12,
                        sortBy: 'createdAt',
                        sortOrder: 'desc'
                      })}
                      className={`px-6 py-3 ${colorClasses.bg.darkNavy} text-white rounded-xl hover:shadow-lg transition-all duration-200 font-semibold w-full`}
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
                    <TenderCard
                      key={tender._id}
                      tender={tender}
                      onSaveToggle={user?.role === 'freelancer' ? handleSaveToggle : undefined}
                      saved={savedTenders.has(tender._id)}
                      showCompany={true}
                    />
                  ))}
                </div>

                {/* Modern Pagination */}
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
                                ? `${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} shadow-md`
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      {pagination.pages > 5 && (
                        <>
                          <span className="px-2 text-gray-500">...</span>
                          <button
                            onClick={() => handlePageChange(pagination.pages)}
                            className={`px-4 py-2.5 rounded-xl font-medium transition-all duration-200 ${
                              pagination.page === pagination.pages
                                ? `${colorClasses.bg.goldenMustard} ${colorClasses.text.darkNavy} shadow-md`
                                : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                            }`}
                          >
                            {pagination.pages}
                          </button>
                        </>
                      )}
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

          {/* Platform Features */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className={`w-12 h-12 ${colorClasses.bg.blue} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <ClockIcon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Quick Applications</h4>
              <p className="text-gray-600 text-sm">Apply to projects in minutes with our streamlined process</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className={`w-12 h-12 ${colorClasses.bg.teal} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <BuildingOfficeIcon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Verified Companies</h4>
              <p className="text-gray-600 text-sm">Work with trusted businesses and established brands</p>
            </div>
            
            <div className="text-center p-6 bg-white rounded-2xl shadow-sm border border-gray-200">
              <div className={`w-12 h-12 ${colorClasses.bg.orange} rounded-xl flex items-center justify-center mx-auto mb-4`}>
                <CurrencyDollarIcon className="h-6 w-6 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Competitive Rates</h4>
              <p className="text-gray-600 text-sm">Get paid what you`re worth with transparent pricing</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TendersPage;