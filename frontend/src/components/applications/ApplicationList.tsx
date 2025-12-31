/* eslint-disable @typescript-eslint/no-explicit-any */
// components/applications/ApplicationList.tsx - PROFESSIONAL REDESIGN
import React, { useState, useEffect } from 'react';
import { Application, applicationService, ApplicationFilters } from '@/services/applicationService';
import { ApplicationCard } from './ApplicationCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { 
  Search, 
  RefreshCw, 
  FileText,
  Users,
  Calendar,
  TrendingUp,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ApplicationListProps {
  viewType: 'candidate' | 'company' | 'organization';
  jobId?: string;
  onApplicationUpdate?: (application: Application) => void;
  onApplicationSelect?: (application: Application) => void;
  showFilters?: boolean;
  title?: string;
  description?: string;
}

export const ApplicationList: React.FC<ApplicationListProps> = ({
  viewType,
  jobId,
  onApplicationUpdate,
  onApplicationSelect,
  showFilters = true,
  title,
  description
}) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filters, setFilters] = useState<ApplicationFilters>({
    page: 1,
    limit: 10,
    status: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [pagination, setPagination] = useState({
    current: 1,
    totalPages: 1,
    totalResults: 0,
    resultsPerPage: 10
  });
  const [stats, setStats] = useState({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    rejected: 0,
  });

  const { toast } = useToast();

  const fetchApplications = async () => {
    try {
      setLoading(true);
      let response;
      
      console.log(`📋 Fetching applications for viewType: ${viewType}, jobId: ${jobId}`);
      
      if (viewType === 'candidate') {
        response = await applicationService.getMyApplications(filters);
      } else if (jobId) {
        response = await applicationService.getJobApplications(jobId, filters);
      } else {
        if (viewType === 'company') {
          response = await applicationService.getCompanyApplications(filters);
        } else {
          response = await applicationService.getOrganizationApplications(filters);
        }
      }

      console.log(`✅ Successfully fetched ${response.data?.length || 0} applications`);
      
      setApplications(response.data || []);
      setPagination(response.pagination || {
        current: 1,
        totalPages: 1,
        totalResults: response.data?.length || 0,
        resultsPerPage: 10
      });
    } catch (error: any) {
      console.error('❌ Failed to fetch applications:', error);
      
      if (error.response?.status === 403) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to view these applications.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: error.message || 'Failed to load applications',
          variant: 'destructive',
        });
      }
      
      setApplications([]);
      setPagination({
        current: 1,
        totalPages: 0,
        totalResults: 0,
        resultsPerPage: 10
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      if (viewType === 'candidate') return;
      
      const response = await applicationService.getApplicationStatistics();
      if (response.data?.statistics) {
        setStats({
          total: response.data.statistics.totalApplications || 0,
          underReview: response.data.statistics.underReview || 0,
          shortlisted: response.data.statistics.shortlisted || 0,
          interviewScheduled: response.data.statistics.interviewScheduled || 0,
          rejected: response.data.statistics.rejected || 0,
        });
      }
    } catch (error) {
      console.error('Failed to fetch statistics:', error);
    }
  };

  useEffect(() => {
    fetchApplications();
    if (viewType !== 'candidate') {
      fetchStatistics();
    }
  }, [filters, viewType, jobId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplications();
    if (viewType !== 'candidate') {
      fetchStatistics();
    }
  };

  const handleStatusUpdate = (updatedApplication: Application) => {
    setApplications(prev => 
      prev.map(app => 
        app._id === updatedApplication._id ? updatedApplication : app
      )
    );
    if (onApplicationUpdate) {
      onApplicationUpdate(updatedApplication);
    }
    fetchStatistics();
  };

  const handleWithdraw = (applicationId: string) => {
    setApplications(prev => prev.filter(app => app._id !== applicationId));
    fetchStatistics();
  };

  const handleFilterChange = (key: keyof ApplicationFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const getStatusCount = (status: string) => {
    return applications.filter(app => app.status === status).length;
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: number; icon: React.ReactNode; color: string }) => (
    <Card className={`border-${color}-200 bg-gradient-to-br from-${color}-50 to-white shadow-sm hover:shadow-md transition-all duration-300`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-xl bg-${color}-100 text-${color}-600`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        {viewType !== 'candidate' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        )}
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Custom Title and Description */}
      {(title || description) && (
        <div className="mb-6">
          {title && <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>}
          {description && <p className="text-gray-600 text-lg">{description}</p>}
        </div>
      )}

      {/* Statistics Dashboard */}
      {viewType !== 'candidate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={<FileText className="h-6 w-6" />}
            color="blue"
          />
          <StatCard
            title="Under Review"
            value={stats.underReview}
            icon={<Users className="h-6 w-6" />}
            color="yellow"
          />
          <StatCard
            title="Shortlisted"
            value={stats.shortlisted}
            icon={<TrendingUp className="h-6 w-6" />}
            color="green"
          />
          <StatCard
            title="Interviews"
            value={stats.interviewScheduled}
            icon={<Calendar className="h-6 w-6" />}
            color="purple"
          />
        </div>
      )}

      {/* Filters and Controls */}
      {showFilters && (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  {viewType === 'candidate' ? 'My Applications' : 'Job Applications'}
                </CardTitle>
                <CardDescription className="text-gray-600">
                  {pagination.totalResults} applications found
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="border-gray-300 text-gray-700 hover:bg-blue-50 rounded-xl"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search applications..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className="pl-10 border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4" />
                      <SelectValue placeholder="All Statuses" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="applied">Applied</SelectItem>
                    <SelectItem value="under-review">Under Review</SelectItem>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="interview-scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="interviewed">Interview Completed</SelectItem>
                    <SelectItem value="offer-pending">Offer Pending</SelectItem>
                    <SelectItem value="offer-made">Offer Made</SelectItem>
                    <SelectItem value="offer-accepted">Offer Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Sort */}
              <div>
                <Select
                  value={`${filters.sortBy}_${filters.sortOrder}`}
                  onValueChange={(value) => {
                    const [sortBy, sortOrder] = value.split('_');
                    handleFilterChange('sortBy', sortBy);
                    handleFilterChange('sortOrder', sortOrder);
                  }}
                >
                  <SelectTrigger className="border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="createdAt_desc">Newest First</SelectItem>
                    <SelectItem value="createdAt_asc">Oldest First</SelectItem>
                    <SelectItem value="updatedAt_desc">Recently Updated</SelectItem>
                    <SelectItem value="candidate.name_asc">Candidate Name</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick Status Filters */}
            {viewType !== 'candidate' && applications.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-6">
                {[
                  { value: 'under-review', label: 'Under Review', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
                  { value: 'shortlisted', label: 'Shortlisted', color: 'bg-green-100 text-green-800 border-green-200' },
                  { value: 'interview-scheduled', label: 'Interview', color: 'bg-purple-100 text-purple-800 border-purple-200' },
                  { value: 'offer-made', label: 'Offer Made', color: 'bg-teal-100 text-teal-800 border-teal-200' },
                  { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' }
                ].map(option => (
                  <Badge
                    key={option.value}
                    variant={filters.status === option.value ? 'default' : 'outline'}
                    className={`cursor-pointer px-4 py-2 transition-all rounded-lg ${
                      filters.status === option.value 
                        ? `${option.color} border-transparent font-semibold` 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    onClick={() => handleFilterChange('status', option.value)}
                  >
                    {option.label} ({getStatusCount(option.value)})
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className="border border-gray-200 shadow-sm bg-white rounded-2xl">
          <CardContent className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">No applications found</h3>
            <p className="text-gray-600 text-center max-w-md mb-8 text-lg">
              {filters.search || filters.status 
                ? 'Try adjusting your filters to see more results.'
                : viewType === 'candidate'
                ? "You haven't applied to any jobs yet. Start browsing opportunities!"
                : jobId
                ? 'No applications have been submitted for this job yet.'
                : 'No applications found for your company/organization.'
              }
            </p>
            {viewType === 'candidate' && (
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-8 py-3 text-lg"
                onClick={() => window.open('/jobs', '_blank')}
              >
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {applications.map(application => (
            <ApplicationCard
              key={application._id}
              application={application}
              viewType={viewType}
              onStatusUpdate={handleStatusUpdate}
              onWithdraw={handleWithdraw}
              onSelect={onApplicationSelect}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            Showing {((pagination.current - 1) * pagination.resultsPerPage) + 1} to{' '}
            {Math.min(pagination.current * pagination.resultsPerPage, pagination.totalResults)} of{' '}
            {pagination.totalResults} applications
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current - 1)}
              disabled={pagination.current === 1}
              className="border-gray-300 text-gray-700 hover:bg-blue-50 rounded-xl"
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <Button
                    key={page}
                    variant={pagination.current === page ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`w-10 h-10 p-0 transition-colors rounded-xl ${
                      pagination.current === page 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : 'border-gray-300 text-gray-700 hover:bg-blue-50'
                    }`}
                  >
                    {page}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.current + 1)}
              disabled={pagination.current === pagination.totalPages}
              className="border-gray-300 text-gray-700 hover:bg-blue-50 rounded-xl"
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};