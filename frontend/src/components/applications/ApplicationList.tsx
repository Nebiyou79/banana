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
import { colorClasses, getTheme } from '@/utils/color';

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
  
  // Get theme colors
  const themeMode = 'light'; // In a real app, this would come from a theme context
  const theme = getTheme(themeMode);

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

  // Status color mapping from color.ts
  const getStatusColorClasses = (status: string) => {
    const colorMap: Record<string, { bg: string; text: string; border: string }> = {
      'under-review': {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: colorClasses.text.amber,
        border: colorClasses.border.amber
      },
      'shortlisted': {
        bg: 'bg-green-100 dark:bg-green-900/30',
        text: colorClasses.text.green,
        border: colorClasses.border.green
      },
      'interview-scheduled': {
        bg: 'bg-purple-100 dark:bg-purple-900/30',
        text: colorClasses.text.purple,
        border: colorClasses.border.purple
      },
      'offer-made': {
        bg: 'bg-teal-100 dark:bg-teal-900/30',
        text: colorClasses.text.teal,
        border: colorClasses.border.teal
      },
      'rejected': {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: colorClasses.text.red,
        border: colorClasses.border.red
      }
    };
    
    return colorMap[status] || {
      bg: colorClasses.bg.gray100,
      text: colorClasses.text.gray700,
      border: colorClasses.border.gray400
    };
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    status 
  }: { 
    title: string; 
    value: number; 
    icon: React.ReactNode; 
    status: 'blue' | 'yellow' | 'green' | 'purple' | 'red' 
  }) => {
    const colorConfig = {
      blue: {
        bg: 'from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-900',
        iconBg: 'bg-blue-100 dark:bg-blue-900/40',
        iconColor: colorClasses.text.blue,
        border: colorClasses.border.blue
      },
      yellow: {
        bg: 'from-yellow-50 to-white dark:from-yellow-900/20 dark:to-gray-900',
        iconBg: 'bg-yellow-100 dark:bg-yellow-900/40',
        iconColor: colorClasses.text.amber,
        border: colorClasses.border.amber
      },
      green: {
        bg: 'from-green-50 to-white dark:from-green-900/20 dark:to-gray-900',
        iconBg: 'bg-green-100 dark:bg-green-900/40',
        iconColor: colorClasses.text.green,
        border: colorClasses.border.green
      },
      purple: {
        bg: 'from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-900',
        iconBg: 'bg-purple-100 dark:bg-purple-900/40',
        iconColor: colorClasses.text.purple,
        border: colorClasses.border.purple
      },
      red: {
        bg: 'from-red-50 to-white dark:from-red-900/20 dark:to-gray-900',
        iconBg: 'bg-red-100 dark:bg-red-900/40',
        iconColor: colorClasses.text.red,
        border: colorClasses.border.red
      }
    };

    const colors = colorConfig[status];

    return (
      <Card className={`
        border shadow-sm hover:shadow-md transition-all duration-300
        bg-gradient-to-br ${colors.bg} ${colors.border}
      `}>
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm font-medium mb-1 ${colorClasses.text.gray600}`}>
                {title}
              </p>
              <p className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.darkNavy}`}>
                {value}
              </p>
            </div>
            <div className={`p-3 rounded-xl ${colors.iconBg} ${colors.iconColor}`}>
              {icon}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading && !refreshing) {
    return (
      <div className="space-y-6">
        {viewType !== 'candidate' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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
          {title && (
            <h2 className={`text-2xl sm:text-3xl font-bold mb-3 ${colorClasses.text.darkNavy}`}>
              {title}
            </h2>
          )}
          {description && (
            <p className={`text-gray-600 text-base sm:text-lg ${colorClasses.text.gray600}`}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Statistics Dashboard */}
      {viewType !== 'candidate' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            title="Total Applications"
            value={stats.total}
            icon={<FileText className="h-6 w-6" />}
            status="blue"
          />
          <StatCard
            title="Under Review"
            value={stats.underReview}
            icon={<Users className="h-6 w-6" />}
            status="yellow"
          />
          <StatCard
            title="Shortlisted"
            value={stats.shortlisted}
            icon={<TrendingUp className="h-6 w-6" />}
            status="green"
          />
          <StatCard
            title="Interviews"
            value={stats.interviewScheduled}
            icon={<Calendar className="h-6 w-6" />}
            status="purple"
          />
        </div>
      )}

      {/* Filters and Controls */}
      {showFilters && (
        <Card className={`
          border shadow-sm rounded-2xl
          ${colorClasses.bg.white}
          ${colorClasses.border.gray400}
        `}>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className={`
                  text-xl sm:text-2xl font-bold ${colorClasses.text.darkNavy}
                `}>
                  {viewType === 'candidate' ? 'My Applications' : 'Job Applications'}
                </CardTitle>
                <CardDescription className={colorClasses.text.gray600}>
                  {pagination.totalResults} applications found
                </CardDescription>
              </div>
              
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className={`
                    border text-gray-700 hover:bg-blue-50 rounded-xl
                    ${colorClasses.border.gray400}
                    ${colorClasses.text.gray700}
                    hover:${colorClasses.bg.blue}
                  `}
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
                  <Search className={`
                    absolute left-3 top-1/2 transform -translate-y-1/2 
                    h-4 w-4 ${colorClasses.text.gray400}
                  `} />
                  <Input
                    placeholder="Search applications..."
                    value={filters.search || ''}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    className={`
                      pl-10 border focus:ring-blue-500 focus:border-blue-500 
                      rounded-xl h-12
                      ${colorClasses.border.gray400}
                    `}
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => handleFilterChange('status', value === 'all' ? '' : value)}
                >
                  <SelectTrigger className={`
                    border focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12
                    ${colorClasses.border.gray400}
                  `}>
                    <div className="flex items-center gap-2">
                      <Filter className={`h-4 w-4 ${colorClasses.text.gray400}`} />
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
                  <SelectTrigger className={`
                    border focus:ring-blue-500 focus:border-blue-500 rounded-xl h-12
                    ${colorClasses.border.gray400}
                  `}>
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
                  { value: 'under-review', label: 'Under Review' },
                  { value: 'shortlisted', label: 'Shortlisted' },
                  { value: 'interview-scheduled', label: 'Interview' },
                  { value: 'offer-made', label: 'Offer Made' },
                  { value: 'rejected', label: 'Rejected' }
                ].map(option => {
                  const isActive = filters.status === option.value;
                  const statusColors = getStatusColorClasses(option.value);
                  
                  return (
                    <Badge
                      key={option.value}
                      variant={isActive ? 'default' : 'outline'}
                      className={`
                        cursor-pointer px-4 py-2 transition-all rounded-lg
                        ${isActive 
                          ? `${statusColors.bg} ${statusColors.text} border-transparent font-semibold` 
                          : `${colorClasses.bg.white} ${colorClasses.text.gray700} ${colorClasses.border.gray400} hover:${colorClasses.bg.gray100}`
                        }
                      `}
                      onClick={() => handleFilterChange('status', option.value)}
                    >
                      {option.label} ({getStatusCount(option.value)})
                    </Badge>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Applications List */}
      {applications.length === 0 ? (
        <Card className={`
          border shadow-sm rounded-2xl
          ${colorClasses.bg.white}
          ${colorClasses.border.gray400}
        `}>
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-20">
            <div className={`
              w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-6
              ${colorClasses.bg.gray100}
            `}>
              <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
            </div>
            <h3 className={`
              text-xl sm:text-2xl font-semibold mb-3
              ${colorClasses.text.darkNavy}
            `}>
              No applications found
            </h3>
            <p className={`
              text-gray-600 text-center max-w-md mb-8 text-sm sm:text-base
              ${colorClasses.text.gray600}
            `}>
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
                className={`
                  bg-blue-600 hover:bg-blue-700 text-white 
                  rounded-xl px-6 sm:px-8 py-3 text-sm sm:text-base
                `}
                onClick={() => window.open('/jobs', '_blank')}
              >
                Browse Jobs
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 sm:space-y-6">
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
        <div className={`
          flex flex-col sm:flex-row items-center justify-between 
          pt-6 border-t gap-4 sm:gap-0
          ${colorClasses.border.gray400}
        `}>
          <div className={`text-sm ${colorClasses.text.gray600}`}>
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
              className={`
                border text-gray-700 hover:bg-blue-50 rounded-xl
                ${colorClasses.border.gray400}
                ${colorClasses.text.gray700}
              `}
            >
              Previous
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const page = i + 1;
                const isActive = pagination.current === page;
                
                return (
                  <Button
                    key={page}
                    variant={isActive ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handlePageChange(page)}
                    className={`
                      w-10 h-10 p-0 transition-colors rounded-xl
                      ${isActive 
                        ? 'bg-blue-600 text-white border-blue-600' 
                        : `border text-gray-700 hover:bg-blue-50 
                           ${colorClasses.border.gray400} ${colorClasses.text.gray700}`
                      }
                    `}
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
              className={`
                border text-gray-700 hover:bg-blue-50 rounded-xl
                ${colorClasses.border.gray400}
                ${colorClasses.text.gray700}
              `}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};