/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/organization/applications/index.tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Application, applicationService } from '@/services/applicationService';
import { ApplicationList } from '@/components/applications/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { colorClasses } from '@/utils/color';
import { useResponsive } from '@/hooks/useResponsive';
import { motion } from 'framer-motion';
import {
  Heart,
  Users,
  Clock,
  CheckCircle,
  Target,
  Filter,
  RefreshCw,
  TrendingUp,
  Award,
  BookOpen
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
  volunteer?: number;
  internship?: number;
  fellowship?: number;
}

interface FilterState {
  dateRange: 'today' | 'week' | 'month' | 'all';
  opportunityType: 'all' | 'volunteer' | 'internship' | 'fellowship';
}

const STAT_CARDS = [
  { key: 'total',               title: 'Total',       icon: Users,       color: 'teal',   trend: 8  },
  { key: 'underReview',         title: 'Under Review', icon: Clock,       color: 'amber',  trend: 5  },
  { key: 'shortlisted',         title: 'Shortlisted',  icon: CheckCircle, color: 'emerald',trend: 12 },
  { key: 'interviewScheduled',  title: 'Interviews',   icon: Target,      color: 'rose',   trend: 15 },
  { key: 'newToday',            title: 'New Today',    icon: TrendingUp,  color: 'cyan'             },
  { key: 'rejected',            title: 'Rejected',     icon: BookOpen,    color: 'gray'             },
] as const;

const TABS = [
  { value: 'all',         label: 'All',        shortLabel: 'All',       icon: Users,       statKey: 'total'              },
  { value: 'review',      label: 'Review',     shortLabel: 'Review',    icon: Clock,       statKey: 'underReview'        },
  { value: 'shortlisted', label: 'Shortlisted',shortLabel: 'Short.',    icon: CheckCircle, statKey: 'shortlisted'        },
  { value: 'interview',   label: 'Interviews', shortLabel: 'Interview', icon: Target,      statKey: 'interviewScheduled' },
  { value: 'rejected',    label: 'Rejected',   shortLabel: 'Rejected',  icon: BookOpen,    statKey: 'rejected'           },
] as const;

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  teal:    { bg: colorClasses.bg.tealLight,    text: colorClasses.text.teal    },
  cyan:    { bg: colorClasses.bg.blueLight,    text: colorClasses.text.blue    },
  emerald: { bg: colorClasses.bg.emeraldLight, text: colorClasses.text.emerald },
  amber:   { bg: colorClasses.bg.amberLight,   text: colorClasses.text.amber   },
  rose:    { bg: colorClasses.bg.roseLight,    text: colorClasses.text.rose    },
  purple:  { bg: colorClasses.bg.purpleLight,  text: colorClasses.text.purple  },
  gray:    { bg: colorClasses.bg.gray100,      text: colorClasses.text.gray600 },
};

const OrganizationApplicationsPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();
  const { breakpoint, getTouchTargetSize } = useResponsive();

  const isMobile  = breakpoint === 'mobile';
  const isDesktop = breakpoint === 'desktop';

  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState<ApplicationStats>({
    total: 0, underReview: 0, shortlisted: 0,
    interviewScheduled: 0, rejected: 0, newToday: 0,
  });
  const [loading,          setLoading]          = useState(true);
  const [refreshing,       setRefreshing]        = useState(false);
  const [showMobileFilters,setShowMobileFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({ dateRange: 'all', opportunityType: 'all' });

  useEffect(() => { fetchApplicationStats(); }, []);

  const fetchApplicationStats = async () => {
    try {
      setLoading(true);
      const response = await applicationService.getApplicationStatistics();
      if (!response.data?.statistics) throw new Error('No statistics data received');
      const s = response.data.statistics;
      setStats({
        total:               s.totalApplications  || 0,
        underReview:         s.underReview         || 0,
        shortlisted:         s.shortlisted         || 0,
        interviewScheduled:  s.interviewScheduled  || 0,
        rejected:            s.rejected            || 0,
        newToday:            s.newApplications     || 0,
        volunteer:  Math.floor((s.totalApplications || 0) * 0.60),
        internship: Math.floor((s.totalApplications || 0) * 0.25),
        fellowship: Math.floor((s.totalApplications || 0) * 0.15),
      });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to load statistics', variant: 'destructive' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => { setRefreshing(true); fetchApplicationStats(); };

  const handleApplicationSelect = (application: Application) => {
    router.push(`/dashboard/organization/applications/${application._id}`);
  };

  const getFiltersForTab = () => {
    const base: any = {};
    if (filters.opportunityType !== 'all') base.opportunityType = filters.opportunityType;
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const dates = {
        today: new Date(now.setHours(0, 0, 0, 0)),
        week:  new Date(now.setDate(now.getDate() - 7)),
        month: new Date(now.setMonth(now.getMonth() - 1)),
      };
      base.dateFrom = dates[filters.dateRange].toISOString();
    }
    const statusMap: Record<string, string> = {
      review: 'under-review', shortlisted: 'shortlisted',
      interview: 'interview-scheduled', rejected: 'rejected',
    };
    if (statusMap[activeTab]) base.status = statusMap[activeTab];
    return base;
  };

  // ── Sub-components ──────────────────────────────────────────────────────────

  const StatCard = ({ title, value, icon: Icon, color = 'teal', trend }: {
    title: string; value: number; icon: any; color?: string; trend?: number;
  }) => {
    const c = COLOR_MAP[color] ?? COLOR_MAP.teal;
    return (
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ type: 'spring', stiffness: 300 }}
        className={[
          'p-3 sm:p-5 rounded-xl border shadow-sm hover:shadow-md transition-all duration-200',
          colorClasses.bg.primary, colorClasses.border.primary,
          getTouchTargetSize('md'),
        ].join(' ')}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <p className={`text-2xl sm:text-3xl font-bold ${colorClasses.text.primary} leading-tight`}>
              {value.toLocaleString()}
            </p>
            <p className={`text-xs sm:text-sm ${colorClasses.text.secondary} truncate`}>{title}</p>
            {trend !== undefined && (
              <div className={`flex items-center gap-1 text-xs ${trend > 0 ? colorClasses.text.green : colorClasses.text.rose}`}>
                <TrendingUp className={`h-3 w-3 shrink-0 ${trend < 0 ? 'rotate-180' : ''}`} />
                <span>{Math.abs(trend)}% vs last month</span>
              </div>
            )}
          </div>
          <div className={`p-2 sm:p-2.5 rounded-xl shrink-0 ${c.bg}`}>
            <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${c.text}`} />
          </div>
        </div>
      </motion.div>
    );
  };

  const FilterBar = () => (
    <div className="space-y-4">
      <div>
        <label className={`text-xs sm:text-sm font-medium ${colorClasses.text.secondary} mb-1.5 block`}>
          Date Range
        </label>
        <select
          value={filters.dateRange}
          onChange={e => setFilters(p => ({ ...p, dateRange: e.target.value as any }))}
          className={[
            'w-full h-10 sm:h-11 px-3 rounded-lg border text-sm',
            'focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors duration-200',
            colorClasses.bg.primary, colorClasses.border.primary, colorClasses.text.primary,
          ].join(' ')}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>
      <div>
        <label className={`text-xs sm:text-sm font-medium ${colorClasses.text.secondary} mb-1.5 block`}>
          Opportunity Type
        </label>
        <select
          value={filters.opportunityType}
          onChange={e => setFilters(p => ({ ...p, opportunityType: e.target.value as any }))}
          className={[
            'w-full h-10 sm:h-11 px-3 rounded-lg border text-sm',
            'focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-colors duration-200',
            colorClasses.bg.primary, colorClasses.border.primary, colorClasses.text.primary,
          ].join(' ')}
        >
          <option value="all">All Types</option>
          <option value="volunteer">Volunteer</option>
          <option value="internship">Internship</option>
          <option value="fellowship">Fellowship</option>
        </select>
      </div>
    </div>
  );

  const TabBar = () => (
    <div className={[
      'flex items-center gap-1 p-1 rounded-xl overflow-x-auto scrollbar-hide',
      colorClasses.bg.primary, 'border', colorClasses.border.primary,
    ].join(' ')}>
      {TABS.map(({ value, label, shortLabel, icon: Icon, statKey }) => {
        const count   = stats[statKey as keyof ApplicationStats] as number ?? 0;
        const isActive = activeTab === value;
        return (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={[
              'flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-lg',
              'text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap',
              getTouchTargetSize('sm'),
              isActive
                ? `${colorClasses.bg.tealLight} ${colorClasses.text.teal} border ${colorClasses.border.teal}`
                : `${colorClasses.text.secondary}`,
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
            <span className="sm:hidden">{shortLabel}</span>
            <span className="hidden sm:inline">{label}</span>
            {count > 0 && (
              <span className={[
                'ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] leading-none font-semibold',
                isActive
                  ? `${colorClasses.bg.teal} ${colorClasses.text.white}`
                  : colorClasses.bg.secondary,
              ].join(' ')}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout requiredRole="organization">
        <main className={`min-h-screen ${colorClasses.bg.secondary}`}>
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
            <div className="mb-6">
              <Skeleton className="h-9 w-48 mb-2" />
              <Skeleton className="h-4 w-64 sm:w-96" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
              {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-24 sm:h-28 rounded-xl" />)}
            </div>
            <Skeleton className="h-10 rounded-xl mb-4" />
            <Skeleton className="h-80 rounded-xl" />
          </div>
        </main>
      </DashboardLayout>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <TooltipProvider>
      <DashboardLayout requiredRole="organization">
        <main className={`min-h-screen ${colorClasses.bg.secondary}`}>
          <div className="mx-auto w-full max-w-7xl px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

            {/* ── HEADER ──────────────────────────────────────────────── */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={[
                'mb-4 sm:mb-8 p-3 sm:p-6 md:p-8 rounded-2xl border shadow-sm',
                colorClasses.bg.primary, colorClasses.border.primary,
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                {/* Icon + text */}
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shrink-0">
                    <Heart className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                  <div className="min-w-0">
                    <h1 className={`text-xl sm:text-3xl font-bold ${colorClasses.text.primary} mb-0.5 sm:mb-1 leading-tight`}>
                      Community Applications
                    </h1>
                    <p className={`hidden xs:block text-xs sm:text-base ${colorClasses.text.secondary} leading-snug`}>
                      Review and manage applications across all your opportunities
                    </p>
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

                {/* Action buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowMobileFilters(true)}
                    className={[
                      'h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3',
                      colorClasses.border.primary, colorClasses.text.secondary,
                      getTouchTargetSize('sm'),
                    ].join(' ')}
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1.5 text-sm">Filters</span>
                  </Button>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className={[
                          'h-9 w-9 p-0 sm:h-10 sm:w-auto sm:px-3',
                          colorClasses.border.primary, colorClasses.text.secondary,
                          getTouchTargetSize('sm'),
                        ].join(' ')}
                      >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Refresh statistics</p></TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </motion.div>

            {/* ── STATS GRID ───────────────────────────────────────────── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 mb-4 sm:mb-6">
              {STAT_CARDS.map(({ key, title, icon, color }) => (
                <StatCard
                  key={key}
                  title={title}
                  value={(stats[key as keyof ApplicationStats] as number) ?? 0}
                  icon={icon}
                  color={color}
                />
              ))}
            </div>

            {/* ── Opportunity type breakdown (desktop only) ─────────────── */}
            {isDesktop && stats.volunteer !== undefined && (
              <div className="grid grid-cols-3 gap-3 mb-6">
                <StatCard title="Volunteer"  value={stats.volunteer}           icon={Heart}  color="teal"   />
                <StatCard title="Internship" value={stats.internship || 0}     icon={Target} color="cyan"   />
                <StatCard title="Fellowship" value={stats.fellowship || 0}     icon={Award}  color="purple" />
              </div>
            )}

            {/* ── DESKTOP LAYOUT: sidebar + content ─────────────────────── */}
            {!isMobile ? (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
                {/* Filter sidebar */}
                <div className="lg:col-span-1">
                  <div className={[
                    'p-4 sm:p-5 rounded-xl border sticky top-24',
                    colorClasses.bg.primary, colorClasses.border.primary,
                  ].join(' ')}>
                    <h3 className={`font-semibold mb-4 ${colorClasses.text.primary} flex items-center gap-2`}>
                      <Filter className="h-4 w-4" /> Filters
                    </h3>
                    <FilterBar />
                    <Button
                      variant="outline"
                      onClick={() => setFilters({ dateRange: 'all', opportunityType: 'all' })}
                      className={`w-full mt-4 h-10 ${colorClasses.border.primary} ${colorClasses.text.secondary}`}
                    >
                      Reset Filters
                    </Button>
                  </div>
                </div>

                {/* Main content */}
                <div className="lg:col-span-3 space-y-4">
                  <TabBar />
                  <ApplicationList
                    viewType="organization"
                    onApplicationSelect={handleApplicationSelect}
                    showFilters={false}
                    title=""
                    description=""
                    {...getFiltersForTab()}
                  />
                </div>
              </div>
            ) : (
              /* ── MOBILE LAYOUT ─────────────────────────────────────────── */
              <div className="space-y-4">
                <TabBar />
                <ApplicationList
                  viewType="organization"
                  onApplicationSelect={handleApplicationSelect}
                  showFilters={false}
                  title=""
                  description=""
                  {...getFiltersForTab()}
                />
              </div>
            )}
          </div>
        </main>

        {/* ── MOBILE FILTER BOTTOM SHEET ──────────────────────────────── */}
        <BottomSheet
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          title="Filter Applications"
        >
          <div className="space-y-5 pb-2">
            <FilterBar />
            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => { setFilters({ dateRange: 'all', opportunityType: 'all' }); setShowMobileFilters(false); }}
                className={`flex-1 h-11 ${colorClasses.border.primary} ${colorClasses.text.secondary}`}
              >
                Reset
              </Button>
              <Button
                onClick={() => setShowMobileFilters(false)}
                className="flex-1 h-11 bg-gradient-to-r from-teal-600 to-cyan-600 text-white"
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

export default OrganizationApplicationsPage;