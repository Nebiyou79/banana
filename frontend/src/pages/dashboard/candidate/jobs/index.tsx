import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import LoadingSpinner from '@/components/LoadingSpinner';
import JobFilters from '@/components/job/JobFillers';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';

const JobsPage: React.FC = () => {
  const [filters, setFilters] = useState({
    page: 1,
    limit: 12,
    search: '',
    location: '',
    type: '',
    remote: false
  });

  const { data: jobsData, isLoading, error } = useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => jobService.getJobs(filters),
  });

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Unable to load jobs
          </h2>
          <p className="text-gray-600">
            Please try refreshing the page or check back later.
          </p>
        </div>
      </div>
    );
  }

  return (
  <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Your Dream Job
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Discover opportunities from top companies around the world
          </p>
        </div>

        {/* Filters */}
        <JobFilters filters={filters} onFilterChange={handleFilterChange} />

        {/* Jobs Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid gap-6">
            {jobsData?.data && jobsData.data.length > 0 ? (
              jobsData.data.map((job: Job) => (
                <CandidateJobCard key={job._id} job={job} />
              ))
            ) : (
              <div className="text-center py-12">
                <div className="bg-white rounded-2xl p-8 shadow-lg">
                  <div className="text-6xl mb-4">🔍</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    No jobs found
                  </h3>
                  <p className="text-gray-600">
                    Try adjusting your search criteria or check back later for new opportunities.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {jobsData?.pagination && jobsData.pagination.total > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: jobsData.pagination.total }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters(prev => ({ ...prev, page }))}
                  className={`px-4 py-2 rounded-lg font-medium ${
                    filters.page === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  </DashboardLayout>

  );
};

export default JobsPage;