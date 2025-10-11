import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job, JobFilters } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
import JobFilter from '@/components/job/JobFilter';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Search, 
  MapPin, 
  TrendingUp,
  Building2,
  Eye,
  Star
} from 'lucide-react';
import Link from 'next/link';

const JobsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 12,
    search: '',
    region: '',
    city: '',
    type: '',
    category: '',
    remote: undefined,
    experienceLevel: '',
    educationLevel: '',
    minSalary: undefined,
    maxSalary: undefined,
    currency: 'ETB',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Fetch jobs
  const { 
    data: jobsData, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
    retry: 2,
  });

  // Fetch job categories for market data
  const { data: categoriesData } = useQuery({
    queryKey: ['jobCategories'],
    queryFn: () => jobService.getCategories(),
  });

  // Fetch saved jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      if (isAuthenticated) {
        try {
          // Note: You'll need to implement getSavedJobs in your jobService
          // const saved = await jobService.getSavedJobs();
          // setSavedJobs(new Set(saved.map(job => job._id)));
        } catch (error) {
          console.error('Error fetching saved jobs:', error);
        }
      }
    };

    fetchSavedJobs();
  }, [isAuthenticated]);

  const handleFilterChange = (newFilters: JobFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  const handleSaveJob = async (jobId: string) => {
    try {
      // Note: You'll need to implement saveJob in your jobService
      // await jobService.saveJob(jobId);
      setSavedJobs(prev => new Set(prev.add(jobId)));
    } catch (error) {
      console.error('Error saving job:', error);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    try {
      // Note: You'll need to implement unsaveJob in your jobService
      // await jobService.unsaveJob(jobId);
      setSavedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      search: '',
      region: '',
      city: '',
      type: '',
      category: '',
      remote: undefined,
      experienceLevel: '',
      educationLevel: '',
      minSalary: undefined,
      maxSalary: undefined,
      currency: 'ETB',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
  };

  // Calculate market data from available data
  const marketData = {
    jobsByRegion: [
      { _id: 'addis-ababa', count: jobsData?.data?.filter(job => job.location.region === 'addis-ababa').length || 0 },
      { _id: 'oromia', count: jobsData?.data?.filter(job => job.location.region === 'oromia').length || 0 },
      { _id: 'amhara', count: jobsData?.data?.filter(job => job.location.region === 'amhara').length || 0 },
    ],
    regions: jobService.getEthiopianRegions(),
    popularCategories: categoriesData?.slice(0, 5) || []
  };

  if (error) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">😕</div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Unable to Load Jobs
            </h2>
            <p className="text-gray-600 mb-6">
              We`re having trouble loading job listings. Please check your connection and try again.
            </p>
            <button
              onClick={handleRetry}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
            >
              Try Again
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Find Your <span className="text-blue-600">Dream Job</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Discover amazing opportunities from top companies in Ethiopia and worldwide
            </p>
            
            {/* Quick Stats */}
            {marketData && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mb-2 mx-auto">
                    <Building2 className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {jobsData?.pagination?.totalResults || 0}+
                  </div>
                  <div className="text-sm text-gray-600">Active Jobs</div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg mb-2 mx-auto">
                    <MapPin className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {marketData.regions.length}
                  </div>
                  <div className="text-sm text-gray-600">Regions</div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg mb-2 mx-auto">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {marketData.popularCategories.length}+
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
                
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-lg mb-2 mx-auto">
                    <Eye className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {marketData.jobsByRegion.find(r => r._id === 'addis-ababa')?.count || 0}+
                  </div>
                  <div className="text-sm text-gray-600">In Addis</div>
                </div>
              </div>
            )}
          </div>

          {/* Filters Section */}
          <JobFilter 
            onFilter={handleFilterChange}
            loading={isLoading}
            showAdvanced={showAdvanced}
            onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          />

          {/* Results Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Job Opportunities
                </h2>
                {jobsData && (
                  <p className="text-gray-600 mt-1">
                    Showing {jobsData.data?.length || 0} of {jobsData.pagination?.totalResults || 0} jobs
                    {filters.search && ` for "${filters.search}"`}
                  </p>
                )}
              </div>
              
              {jobsData && jobsData.data && jobsData.data.length > 0 && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <Star className="w-4 h-4 mr-1 text-yellow-500" />
                    {savedJobs.size} saved
                  </span>
                </div>
              )}
            </div>

            {/* Jobs Grid */}
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 mt-4">Loading job opportunities...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {jobsData?.data && jobsData.data.length > 0 ? (
                  jobsData.data.map((job: Job) => (
                    <CandidateJobCard 
                      key={job._id} 
                      job={job}
                      onSaveJob={handleSaveJob}
                      onUnsaveJob={handleUnsaveJob}
                      isSaved={savedJobs.has(job._id)}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Search className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        No jobs found
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        We couldn`t find any jobs matching your criteria. Try adjusting your filters or search terms.
                      </p>
                      <button
                        onClick={clearFilters}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Pagination */}
            {jobsData?.pagination && jobsData.pagination.totalPages > 1 && (
              <div className="flex justify-center mt-12">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                    disabled={filters.page === 1}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, jobsData.pagination.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setFilters(prev => ({ ...prev, page }))}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          filters.page === page
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-gray-700 hover:bg-gray-100 border border-gray-300'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                  
                  {jobsData.pagination.totalPages > 5 && (
                    <span className="px-2 text-gray-500">...</span>
                  )}
                  
                  <button
                    onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                    disabled={filters.page === jobsData.pagination.totalPages}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Featured Companies Callout */}
          {!isLoading && jobsData?.data && jobsData.data.length > 0 && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to take the next step in your career?
              </h3>
              <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
                Join thousands of professionals who found their dream jobs through our platform. 
                Create your profile and let employers find you!
              </p>
              <Link href="/dashboard/candidate/profile">
                <button className="px-8 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg">
                  Complete Your Profile
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobsPage;