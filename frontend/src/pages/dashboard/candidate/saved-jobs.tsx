// pages/dashboard/candidate/saved-jobs.tsx
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Job } from '@/services/jobService';
import { candidateService } from '@/services/candidateService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  Bookmark,
  Search,
  Filter,
  Heart
} from 'lucide-react';

const SavedJobsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredJobs, setFilteredJobs] = useState<Job[]>([]);

  // Fetch saved jobs
  const { 
    data: savedJobs, 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: () => candidateService.getSavedJobs(),
    enabled: isAuthenticated,
    retry: 2,
  });

  // Filter jobs based on search term
  useEffect(() => {
    if (savedJobs) {
      const filtered = savedJobs.filter(job =>
        job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (job.company?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (job.organization?.name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        job.skills?.some((skill: string) => skill.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredJobs(filtered);
    }
  }, [savedJobs, searchTerm]);

  const handleSaveJob = (jobId: string) => {
    // This will be handled by the mutation in the job card
    refetch();
  };

  const handleUnsaveJob = (jobId: string) => {
    // This will be handled by the mutation in the job card
    refetch();
  };

  const handleRetry = () => {
    refetch();
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
              Unable to Load Saved Jobs
            </h2>
            <p className="text-gray-600 mb-6">
              We`re having trouble loading your saved jobs. Please check your connection and try again.
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center shadow-lg">
                <Bookmark className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              Your <span className="text-red-600">Saved Jobs</span>
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Keep track of opportunities that caught your eye
            </p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search saved jobs by title, company, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <Filter className="w-4 h-4" />
                <span>{filteredJobs.length} jobs saved</span>
              </div>
            </div>
          </div>

          {/* Saved Jobs Section */}
          <div className="mb-8">
            {isLoading ? (
              <div className="flex justify-center py-16">
                <div className="text-center">
                  <LoadingSpinner size="lg" />
                  <p className="text-gray-600 mt-4">Loading your saved jobs...</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredJobs && filteredJobs.length > 0 ? (
                  filteredJobs.map((job: Job) => (
                    <CandidateJobCard 
                      key={job._id} 
                      job={job}
                      onSaveJob={handleSaveJob}
                      onUnsaveJob={handleUnsaveJob}
                      isSaved={true}
                    />
                  ))
                ) : (
                  <div className="text-center py-16">
                    <div className="bg-white rounded-2xl p-12 shadow-lg border border-gray-200 max-w-2xl mx-auto">
                      <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Heart className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {searchTerm ? 'No matching saved jobs' : 'No saved jobs yet'}
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        {searchTerm 
                          ? 'No saved jobs match your search criteria. Try adjusting your search terms.'
                          : 'Start exploring job opportunities and save the ones you like to come back to later.'
                        }
                      </p>
                      {!searchTerm && (
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                          <button
                            onClick={() => window.location.href = '/dashboard/candidate/jobs'}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
                          >
                            Browse Jobs
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Tips Section */}
          {filteredJobs && filteredJobs.length > 0 && (
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl p-8 text-white text-center">
              <h3 className="text-2xl font-bold mb-4">
                Ready to apply?
              </h3>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">
                Don`t let great opportunities slip away! Review your saved jobs and start applying to positions that match your skills and interests.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => window.location.href = '/dashboard/candidate/jobs'}
                  className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
                >
                  Browse More Jobs
                </button>
                <button
                  onClick={() => window.location.href = '/dashboard/candidate/profile'}
                  className="px-6 py-3 bg-transparent border-2 border-white text-white rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition-colors"
                >
                  Update Profile
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SavedJobsPage;