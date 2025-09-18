/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon,
  BookmarkIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  BuildingOfficeIcon,
  EyeIcon,
  UserGroupIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { jobService, Job, JobFilters } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';

const FreelancerJobs: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<JobFilters>({
    page: 1,
    limit: 10,
    search: '',
    type: '',
    location: '',
    category: '',
    remote: undefined,
    experienceLevel: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  // Fetch jobs with filters
  const { 
    data: jobsResponse, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['freelancerJobs', filters],
    queryFn: () => jobService.getFreelancerJobs(filters),
    enabled: !!user,
  });

  // Fetch saved jobs
  const { data: savedJobsData } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: jobService.getSavedJobs,
    enabled: !!user,
  });

  const jobs = jobsResponse?.data || [];
  const pagination = jobsResponse?.pagination;
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());

  // Save/unsave job mutations
  const saveJobMutation = useMutation({
    mutationFn: jobService.saveJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  const unsaveJobMutation = useMutation({
    mutationFn: jobService.unsaveJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['savedJobs'] });
    },
  });

  // Update saved jobs set when data changes
  useEffect(() => {
    if (savedJobsData) {
      const savedIds = new Set(savedJobsData.map(job => job._id));
      setSavedJobs(savedIds);
    }
  }, [savedJobsData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };

  const handleFilterChange = (key: keyof JobFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      type: '',
      location: '',
      category: '',
      remote: undefined,
      experienceLevel: ''
    });
    setSearchTerm('');
  };

  const toggleSaveJob = async (jobId: string) => {
    if (savedJobs.has(jobId)) {
      await unsaveJobMutation.mutateAsync(jobId);
    } else {
      await saveJobMutation.mutateAsync(jobId);
    }
  };

  const formatSalary = (salary?: Job['salary']) => {
    if (!salary?.min && !salary?.max) return 'Negotiable';
    
    const min = salary.min ? `$${salary.min.toLocaleString()}` : '';
    const max = salary.max ? `$${salary.max.toLocaleString()}` : '';
    const period = salary.period ? `/${salary.period}` : '';
    
    if (min && max) return `${min} - ${max}${period}`;
    if (min) return `From ${min}${period}`;
    if (max) return `Up to ${max}${period}`;
    
    return 'Negotiable';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  if (error) {
    return (
      <DashboardLayout requiredRole="freelancer">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-6">
            <p className="font-medium">Error loading jobs</p>
            <p>{(error as Error).message}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="freelancer">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header and search section remains the same */}
        {/* ... */}

        {/* Jobs Grid */}
        <div className="space-y-6">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-gray-200 rounded w-16"></div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-6 ml-4"></div>
                </div>
              </div>
            ))
          ) : jobs.length > 0 ? (
            jobs.map((job) => (
              <div key={job._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-4 mb-3">
                      {job.company.logoUrl ? (
                        <img
                          src={job.company.logoUrl}
                          alt={job.company.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-1">{job.title}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-gray-600">{job.company.name}</p>
                          {job.company.verified && (
                            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                              Verified
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                      <span className="flex items-center">
                        <CurrencyDollarIcon className="w-4 h-4 mr-1" />
                        {formatSalary(job.salary)}
                      </span>
                      <span className="flex items-center">
                        <ClockIcon className="w-4 h-4 mr-1" />
                        {job.type.replace('-', ' ')}
                      </span>
                      <span className="flex items-center">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {job.remote ? 'Remote' : job.location || 'Not specified'}
                      </span>
                      <span className="flex items-center">
                        <UserGroupIcon className="w-4 h-4 mr-1" />
                        {job.experienceLevel}
                      </span>
                      <span className="flex items-center">
                        <EyeIcon className="w-4 h-4 mr-1" />
                        {job.views} views
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4 line-clamp-2">{job.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {job.skills.slice(0, 5).map((skill, index) => (
                        <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                          {skill}
                        </span>
                      ))}
                      {job.skills.length > 5 && (
                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                          +{job.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleSaveJob(job._id)}
                    disabled={saveJobMutation.isPending || unsaveJobMutation.isPending}
                    className={`p-2 rounded-lg ml-4 transition-colors ${
                      savedJobs.has(job._id) 
                        ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                        : 'text-gray-400 hover:text-yellow-600 hover:bg-yellow-50'
                    }`}
                  >
                    <BookmarkIcon className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Posted {formatDate(job.createdAt)} • {job.applicationCount} applications
                  </span>
                  <div className="flex gap-3">
                    <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                      View Details
                    </button>
                    <button className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
              <div className="w-24 h-24 mx-auto mb-6 text-gray-400">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 8h-2v2h2v-2zm0-4h-2v2h2V7zm-4 0H9v2h2V7zm-2 4h2v2H9v-2zm6 4h-2v2h2v-2zm-4 0H9v2h2v-2z"/>
                </svg>
              </div>
              <p className="text-gray-500 text-lg font-medium mb-2">No jobs found</p>
              <p className="text-gray-400 text-sm">Try adjusting your search criteria or check back later</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-blue-600 hover:text-blue-800"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 1 && (
          <div className="flex justify-center mt-8">
            <div className="flex gap-2">
              {Array.from({ length: pagination.total }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setFilters(prev => ({ ...prev, page }))}
                  className={`px-3 py-2 rounded-lg border ${
                    page === pagination.current
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default FreelancerJobs;