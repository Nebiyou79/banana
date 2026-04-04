/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/applications/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Application, applicationService } from '@/services/applicationService';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { motion } from 'framer-motion';
import {
  Briefcase,
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Target,
  Filter,
  RefreshCw,
  BarChart3,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/Tooltip';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Skeleton } from '@/components/ui/Skeleton';

interface ApplicationStats {
  total: number;
  underReview: number;
  shortlisted: number;
  interviewScheduled: number;
  rejected: number;
  newToday: number;
  fullTime?: number;
  partTime?: number;
  contract?: number;
}

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'all';
  jobType: 'all' | 'full-time' | 'part-time' | 'contract';
}

const TABS = [
  { value: 'all',        label: 'All',         shortLabel: 'All',        icon: Users      },
  { value: 'review',     label: 'Under Review', shortLabel: 'Review',    icon: Clock      },
  { value: 'shortlisted',label: 'Shortlisted',  shortLabel: 'Shortlist', icon: CheckCircle},
  { value: 'interview',  label: 'Interviews',   shortLabel: 'Interview', icon: Target     },
  { value: 'rejected',   label: 'Rejected',     shortLabel: 'Rejected',  icon: BarChart3  },
] as const;

const CompanyApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const isMobile = breakpoint === 'mobile';
  const isTablet = breakpoint === 'tablet';

  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0,
    underReview: 0,
    shortlisted: 0,
    interviewScheduled: 0,
    rejected: 0,
    newToday: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    dateRange: 'all',
    jobType: 'all',
  });

  useEffect(() => {
    fetchApplicationStats();
  }, []);

  const fetchApplicationStats = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplicationStatistics();

      if (!response.data?.statistics) {
        throw new Error('No statistics data received');
      }

      const statsData = response.data.statistics;
      setStats({
        total: statsData.totalApplications || 0,
        underReview: statsData.underReview || 0,
        shortlisted: statsData.shortlisted || 0,
        interviewScheduled: statsData.interviewScheduled || 0,
        rejected: statsData.rejected || 0,
        newToday: statsData.newApplications || 0,
        fullTime: Math.floor((statsData.totalApplications || 0) * 0.5),
        partTime: Math.floor((statsData.totalApplications || 0) * 0.3),
        contract: Math.floor((statsData.totalApplications || 0) * 0.2),
      });
    } catch (error: any) {
      console.error('Failed to fetch application stats:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load application statistics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchApplicationStats();
  };

  const handleApplicationSelect = (application: Application) => {
    router.push(`/dashboard/company/applications/${application._id}`);
  };

  const getFiltersForTab = () => {
    const baseFilters: any = {};

    if (filters.jobType !== 'all') baseFilters.jobType = filters.jobType;

    if (filters.dateRange !== 'all') {
      const now = new Date();
      const dates = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week: new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
      };
      baseFilters.dateFrom = dates[filters.dateRange].toISOString();
    }

    switch (activeTab) {
      case 'review':      return { ...baseFilters, status: 'under-review' };
      case 'shortlisted': return { ...baseFilters, status: 'shortlisted' };
      case 'interview':   return { ...baseFilters, status: 'interview-scheduled' };
      case 'rejected':    return { ...baseFilters, status: 'rejected' };
      default:            return baseFilters;
    }
  };

  const getStatForTab = (value: string) => {
    switch (value) {
      case 'all':         return stats.total;
      case 'review':      return stats.underReview;
      case 'shortlisted': return stats.shortlisted;
      case 'interview':   return stats.interviewScheduled;
      case 'rejected':    return stats.rejected;
      default:            return 0;
    }
  };

  // ── Shared tab bar ──────────────────────────────────────────────────────────
  const TabBar = () => (
    <div className={`
      flex items-center gap-1 p-1 rounded-xl
      ${colorClasses.bg.primary}
      border ${colorClasses.border.primary}
      overflow-x-auto scrollbar-hide
    `}>
      {TABS.map(({ value, label, shortLabel, icon: Icon }) => {
        const count = getStatForTab(value);
        const isActive = activeTab === value;
        return (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={`
              flex items-center gap-1.5
              px-2.5 sm:px-3.5 py-2
              rounded-lg text-xs sm:text-sm font-medium
              transition-all duration-200 whitespace-nowrap
              ${getTouchTargetSize('sm')}
              ${isActive
                ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple} border ${colorClasses.border.purple}`
                : `${colorClasses.text.secondary} hover:${colorClasses.bg.secondary}`
              }
            `}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            {/* Shorter labels on mobile */}
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && (
              <span className={`
                px-1.5 py-0.5 rounded-full text-xs leading-none
                ${isActive
                  ? `${colorClasses.bg.purple} ${colorClasses.text.white}`
                  : colorClasses.bg.secondary
                }
              `}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout requiredRole="company">
        <main className={`min-h-screen ${colorClasses.bg.secondary}`}>
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="mb-6">
              <Skeleton className="h-9 w-40 mb-2" />
              <Skeleton className="h-4 w-64 sm:w-96" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />
              ))}
            </div>
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // ── Main render ─────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <DashboardLayout requiredRole="company">
        <main className={`min-h-screen ${colorClasses.bg.secondary}`}>
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`
                mb-4 sm:mb-8
                p-3 sm:p-6 md:p-8
                rounded-2xl
                ${colorClasses.bg.primary}
                border ${colorClasses.border.primary}
                shadow-sm
              `}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Icon + text — side by side always, icon shrinks on mobile */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-600 shadow-lg shrink-0">
                    <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className={`text-xl sm:text-3xl font-bold ${colorClasses.text.primary} mb-0.5 sm:mb-1 leading-tight`}>
                      Applications
                    </h1>
                    {/* Description hidden on smallest phones to save space */}
                    <p className={`hidden xs:block text-xs sm:text-base ${colorClasses.text.secondary} leading-snug`}>
                      Review and manage candidate applications
                    </p>
                    {/* Inline stats — tight row */}
                    <div className="flex items-center gap-2 mt-1.5 sm:mt-3 flex-wrap">
                      <div className={`flex items-center gap-1 text-xs ${colorClasses.text.muted}`}>
                        <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{stats.total} total</span>
                      </div>
                      <span className={`w-1 h-1 rounded-full ${colorClasses.bg.muted}`} />
                      <div className={`flex items-center gap-1 text-xs ${colorClasses.text.green}`}>
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                        <span>{stats.newToday} new today</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action buttons — always visible, compact on mobile */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(true)}
                    className={`
                      h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3
                      ${colorClasses.border.primary}
                      ${colorClasses.text.secondary}
                      ${getTouchTargetSize('sm')}
                    `}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5 text-sm">Filters</span>
                    {/* Show active filter badge if any filter is set */}
                    {(filters.dateRange !== 'all' || filters.jobType !== 'all') && (
                      <span className="ml-1 h-1.5 w-1.5 rounded-full bg-purple-500 sm:hidden" />
                    )}
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={`
                          h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3
                          ${colorClasses.border.primary}
                          ${colorClasses.text.secondary}
                          ${getTouchTargetSize('sm')}
                        `}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Refresh statistics</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </motion.div>

            {/* ── STATS CARDS ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {[
                { label: 'Total',       value: stats.total,             color: 'purple' },
                { label: 'Under Review',value: stats.underReview,       color: 'amber'  },
                { label: 'Shortlisted', value: stats.shortlisted,       color: 'blue'   },
                { label: 'Interviews',  value: stats.interviewScheduled,color: 'emerald'},
                { label: 'Rejected',    value: stats.rejected,          color: 'red'    },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className={`
                    p-3 rounded-xl border cursor-pointer transition-all duration-200
                    ${colorClasses.bg.primary} ${colorClasses.border.primary}
                    hover:shadow-sm
                  `}
                >
                  <p className={`text-xs font-medium truncate ${colorClasses.text.muted} mb-1`}>{label}</p>
                  <p className={`text-xl sm:text-2xl font-bold ${colorClasses.text.primary} leading-none`}>{value}</p>
                </div>
              ))}
            </div>

            {/* ── TAB BAR + CONTENT ───────────────────────────────────── */}
            <div className="space-y-3 sm:space-y-6">
              <TabBar />
              <ApplicationList
                viewType="company"
                onApplicationSelect={handleApplicationSelect}
                showFilters={false}
                title=""
                description=""
                {...getFiltersForTab()}
              />
            </div>

          </div>
        </main>

        {/* ── FILTER BOTTOM SHEET ─────────────────────────────────── */}
        <BottomSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          title="Filter Applications"
        >
          <div className="space-y-5 pb-2">

            {/* Date Range */}
            <div>
              <p className={`text-sm font-semibold mb-2 ${colorClasses.text.primary}`}>Date Range</p>
              <div className="grid grid-cols-2 gap-2">
                {(['all', 'today', 'week', 'month'] as const).map(range => (
                  <button
                    key={range}
                    onClick={() => setFilters(f => ({ ...f, dateRange: range }))}
                    className={`
                      h-10 rounded-lg text-sm font-medium border transition-all
                      ${getTouchTargetSize('md')}
                      ${filters.dateRange === range
                        ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple} ${colorClasses.border.purple}`
                        : `${colorClasses.bg.secondary} ${colorClasses.text.secondary} ${colorClasses.border.primary}`
                      }
                    `}
                  >
                    {{ all: 'All time', today: 'Today', week: 'This week', month: 'This month' }[range]}
                  </button>
                ))}
              </div>
            </div>

            {/* Job Type */}
            <div>
              <p className={`text-sm font-semibold mb-2 ${colorClasses.text.primary}`}>Job Type</p>
              <div className="grid grid-cols-2 gap-2">
                {(['all', 'full-time', 'part-time', 'contract'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setFilters(f => ({ ...f, jobType: type }))}
                    className={`
                      h-10 rounded-lg text-sm font-medium border transition-all capitalize
                      ${getTouchTargetSize('md')}
                      ${filters.jobType === type
                        ? `${colorClasses.bg.purpleLight} ${colorClasses.text.purple} ${colorClasses.border.purple}`
                        : `${colorClasses.bg.secondary} ${colorClasses.text.secondary} ${colorClasses.border.primary}`
                      }
                    `}
                  >
                    {type === 'all' ? 'All types' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => {
                  setFilters({ dateRange: 'all', jobType: 'all' });
                  setShowMobileFilters(false);
                }}
                className={`flex-1 h-11 ${colorClasses.border.primary} ${colorClasses.text.secondary}`}
              >
                Reset
              </Button>
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 h-11 bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white"
              >
                Apply Filters
              </Button>
            </div>
          </div>
        </BottomSheet>

      </DashboardLayout>
    </TooltipProvider>
  );
};

export default CompanyApplicationsPage;