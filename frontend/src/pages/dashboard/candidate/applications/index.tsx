/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import {
  Briefcase,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  RefreshCw,
  SlidersHorizontal,
  XCircle,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { useToast } from '@/hooks/use-toast';
import { applicationService, Application } from '@/services/applicationService';
import { colorClasses } from '@/utils/color';
import { useMediaQuery } from '@/hooks/use-media-query';
import { ApplicationList } from '@/components/applications/ApplicationList';

// ==================== Types ====================
interface Stats {
  total: number;
  underReview: number;
  shortlisted: number;
  interviewScheduled: number;
}

// ==================== Stat Card Component ====================
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'amber' | 'emerald' | 'purple';
  onClick?: () => void;
  isActive?: boolean;
}> = ({ title, value, icon, color, onClick, isActive }) => {
  const bgColors = {
    blue: colorClasses.bg.blueLight,
    amber: colorClasses.bg.amberLight,
    emerald: colorClasses.bg.emeraldLight,
    purple: colorClasses.bg.purpleLight
  };

  const textColors = {
    blue: colorClasses.text.blue,
    amber: colorClasses.text.amber,
    emerald: colorClasses.text.emerald,
    purple: colorClasses.text.purple
  };

  return (
    <Card
      className={`
        ${colorClasses.bg.primary} border ${colorClasses.border.gray400} 
        rounded-xl overflow-hidden transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md' : ''}
        ${isActive ? `ring-2 ring-offset-2 ${colorClasses.ring[color]}` : ''}
      `}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-sm ${colorClasses.text.muted} mb-1`}>{title}</p>
            <p className={`text-2xl font-bold ${textColors[color]}`}>{value}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg ${bgColors[color]} flex items-center justify-center`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ==================== Empty State Component ====================
const EmptyState: React.FC<{ onBrowseJobs: () => void }> = ({ onBrowseJobs }) => (
  <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl`}>
    <CardContent className="py-16 px-4 text-center">
      <div className={`h-16 w-16 rounded-full ${colorClasses.bg.gray100} flex items-center justify-center mx-auto mb-4`}>
        <FileText className={`h-8 w-8 ${colorClasses.text.muted}`} />
      </div>
      <h3 className={`text-xl font-semibold ${colorClasses.text.primary} mb-2`}>
        No applications yet
      </h3>
      <p className={`${colorClasses.text.secondary} mb-6 max-w-md mx-auto`}>
        Start your job search journey by browsing available positions that match your skills.
      </p>
      <Button
        onClick={onBrowseJobs}
        className={`${colorClasses.bg.blue} text-white hover:bg-blue-600 px-6 h-11 rounded-lg`}
      >
        <Briefcase className="h-4 w-4 mr-2" />
        Browse Jobs
      </Button>
    </CardContent>
  </Card>
);

// ==================== Filter Bar Component ====================
const FilterBar: React.FC<{
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilter: (status: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  showFilters: boolean;
  onToggleFilters: () => void;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilter,
  onRefresh,
  isRefreshing,
  showFilters,
  onToggleFilters,
  hasActiveFilters,
  onClearFilters
}) => {
    const isMobile = useMediaQuery('(max-width: 640px)');

    return (
      <div className="space-y-4">
        {/* Search and Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search by job title or company..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className={`
              pl-9 w-full ${colorClasses.bg.primary} 
              border ${colorClasses.border.gray400} 
              rounded-lg h-11 text-sm
            `}
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
                aria-label="Clear search"
              >
                <XCircle className={`h-4 w-4 ${colorClasses.text.muted} hover:${colorClasses.text.primary}`} />
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onToggleFilters}
              className={`
              h-11 px-4 ${colorClasses.border.gray400} rounded-lg
              ${showFilters ? `${colorClasses.bg.blue} text-white border-transparent` : ''}
            `}
            >
              <SlidersHorizontal className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Filters</span>
              {hasActiveFilters && !showFilters && (
                <Badge className={`ml-2 ${colorClasses.bg.blue} text-white h-5 w-5 p-0 flex items-center justify-center rounded-full text-xs`}>
                  {Object.entries({ status: statusFilter, search: searchTerm }).filter(([_, v]) => v).length}
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isRefreshing}
              className={`h-11 w-11 sm:w-auto px-0 sm:px-4 ${colorClasses.border.gray400} rounded-lg`}
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} sm:mr-2`} />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>

        {/* Filter Chips */}
        {showFilters && (
          <Card className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} shadow-sm rounded-xl overflow-hidden`}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-4">
                <div>
                  <span className={`text-sm font-medium ${colorClasses.text.primary} block mb-3`}>Status</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => onStatusFilter('')}
                      className={`
                      px-3 py-2 text-xs rounded-full transition-colors h-9
                      ${!statusFilter
                          ? `${colorClasses.bg.blue} text-white`
                          : `${colorClasses.bg.gray100} ${colorClasses.text.secondary} hover:${colorClasses.bg.gray200}`
                        }
                    `}
                    >
                      All
                    </button>
                    {['applied', 'under-review', 'shortlisted', 'interview-scheduled', 'rejected'].map((status) => (
                      <button
                        key={status}
                        onClick={() => onStatusFilter(status)}
                        className={`
                        px-3 py-2 text-xs rounded-full transition-colors h-9
                        ${statusFilter === status
                            ? `${colorClasses.bg.blue} text-white`
                            : `${colorClasses.bg.gray100} ${colorClasses.text.secondary} hover:${colorClasses.bg.gray200}`
                          }
                      `}
                      >
                        {applicationService.getStatusLabel(status)}
                      </button>
                    ))}
                  </div>
                </div>

                {hasActiveFilters && (
                  <div className="flex justify-end">
                    <button
                      onClick={onClearFilters}
                      className={`text-xs ${colorClasses.text.muted} hover:${colorClasses.text.primary} underline h-9 px-3`}
                    >
                      Clear all filters
                    </button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

// ==================== Main Page Component ====================
const CandidateApplicationsPage: NextPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 640px)');

  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [stats, setStats] = useState<Stats>({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0
  });

  // Load applications
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setIsLoading(true);
      const response = await applicationService.getMyApplications();
      const apps = response.data || [];
      setApplications(apps);

      setStats({
        total: apps.length,
        underReview: apps.filter((app: Application) => app.status === 'under-review').length,
        shortlisted: apps.filter((app: Application) =>
          ['shortlisted', 'offer-made', 'offer-accepted'].includes(app.status)
        ).length,
        interviewScheduled: apps.filter((app: Application) =>
          ['interview-scheduled', 'interviewed'].includes(app.status)
        ).length
      });
    } catch (error: any) {
      console.error('Failed to load applications:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load your applications',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadApplications();
    setIsRefreshing(false);
    toast({
      title: 'Refreshed',
      description: 'Your applications have been updated',
    });
  };

  const handleViewDetails = (application: Application) => {
    router.push(`/dashboard/candidate/applications/${application._id}`);
  };

  const handleBrowseJobs = () => {
    router.push('/jobs');
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(prev => prev === status ? '' : status);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
  };

  const hasActiveFilters = Boolean(searchTerm || statusFilter);

  return (
    <DashboardLayout>
      <Head>
        <title>My Applications | JobStack</title>
      </Head>

      {/* Single container - no nested wrappers */}
      <div className={`min-h-screen ${colorClasses.bg.secondary} py-6 md:py-8`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Header Section */}
          <div className="mb-8">
            <h1 className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.primary}`}>
              My Applications
            </h1>
            <p className={`text-sm sm:text-base ${colorClasses.text.secondary} mt-1`}>
              Track and manage your job applications
            </p>
          </div>

          {/* Stats Grid - Only show if there are applications */}
          {!isLoading && stats.total > 0 && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              <StatCard
                title="Total"
                value={stats.total}
                icon={<FileText className={`h-5 w-5 ${colorClasses.text.blue}`} />}
                color="blue"
                onClick={() => setStatusFilter('')}
                isActive={!statusFilter}
              />
              <StatCard
                title="Under Review"
                value={stats.underReview}
                icon={<Clock className={`h-5 w-5 ${colorClasses.text.amber}`} />}
                color="amber"
                onClick={() => handleStatusFilter('under-review')}
                isActive={statusFilter === 'under-review'}
              />
              <StatCard
                title="Shortlisted"
                value={stats.shortlisted}
                icon={<CheckCircle className={`h-5 w-5 ${colorClasses.text.emerald}`} />}
                color="emerald"
                onClick={() => handleStatusFilter('shortlisted')}
                isActive={['shortlisted', 'offer-made', 'offer-accepted'].includes(statusFilter)}
              />
              <StatCard
                title="Interviews"
                value={stats.interviewScheduled}
                icon={<Calendar className={`h-5 w-5 ${colorClasses.text.purple}`} />}
                color="purple"
                onClick={() => handleStatusFilter('interview-scheduled')}
                isActive={['interview-scheduled', 'interviewed'].includes(statusFilter)}
              />
            </div>
          )}

          {/* Filter Bar */}
          <div className="mb-8">
            <FilterBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              statusFilter={statusFilter}
              onStatusFilter={setStatusFilter}
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              showFilters={showFilters}
              onToggleFilters={() => setShowFilters(prev => !prev)}
              hasActiveFilters={hasActiveFilters}
              onClearFilters={clearFilters}
            />
          </div>

          {/* Results Header */}
          {!isLoading && applications.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <span className={`text-sm ${colorClasses.text.muted}`}>
                <span className={`font-medium ${colorClasses.text.primary}`}>
                  {applications.length}
                </span> Applications
              </span>

              {hasActiveFilters && (
                <Badge
                  variant="outline"
                  className={`
                    ${colorClasses.border.gray400} ${colorClasses.text.secondary} 
                    text-xs px-3 py-1 rounded-full
                  `}
                >
                  <Filter className="h-3 w-3 mr-1" />
                  Filtered
                </Badge>
              )}
            </div>
          )}

          {/* Application List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className={`${colorClasses.bg.primary} border ${colorClasses.border.gray400} rounded-xl overflow-hidden`}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className={`h-5 ${colorClasses.bg.gray100} rounded w-2/3`}></div>
                      <div className={`h-4 ${colorClasses.bg.gray100} rounded w-1/2`}></div>
                      <div className="flex justify-between items-center">
                        <div className={`h-4 ${colorClasses.bg.gray100} rounded w-20`}></div>
                        <div className={`h-8 ${colorClasses.bg.gray100} rounded w-24`}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <EmptyState onBrowseJobs={handleBrowseJobs} />
          ) : (
            <ApplicationList
              viewType="candidate"
              onApplicationSelect={handleViewDetails}
              showFilters={false}
              title=""
              description=""
              dateFrom=""
              dateTo=""
              page={1}
              limit={20}
              status={statusFilter}
              search={searchTerm}
              sortBy="createdAt"
              sortOrder="desc"
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateApplicationsPage;