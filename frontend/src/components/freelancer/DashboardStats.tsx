'use client';

import React from 'react';
import {
  EyeIcon,
  StarIcon,
  CheckBadgeIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import VerificationBadge from '@/components/verifcation/VerificationBadge';

interface StatsCardProps {
  title: string;
  value: string | number | React.ReactNode;
  subtitle: string;
  icon: React.ReactNode;
  color: 'gold' | 'darkNavy' | 'teal' | 'orange' | 'blue' | 'purple' | 'green';
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, subtitle, icon, color }) => {
  const colorConfig = {
    gold: {
      bg: 'bg-gradient-to-br from-amber-400 to-amber-500',
      text: colorClasses.text.gold,
      border: colorClasses.border.gold
    },
    darkNavy: {
      bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      text: colorClasses.text.darkNavy,
      border: colorClasses.border.darkNavy
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
      text: colorClasses.text.teal,
      border: colorClasses.border.teal
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      text: colorClasses.text.orange,
      border: colorClasses.border.orange
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: colorClasses.text.blue,
      border: colorClasses.border.blue
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      text: colorClasses.text.darkNavy,
      border: colorClasses.border.gray400
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      text: colorClasses.text.teal,
      border: colorClasses.border.teal
    }
  };

  const config = colorConfig[color];

  return (
    <div className={`rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-all duration-300 group hover:scale-[1.02] border ${config.border} ${colorClasses.bg.white}`}>
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold uppercase tracking-wide truncate ${colorClasses.text.gray600}`}>
            {title}
          </p>
          <div className={`text-xl sm:text-2xl md:text-3xl font-bold mt-1 sm:mt-2 truncate ${colorClasses.text.darkNavy}`}>
            {value}
          </div>
        </div>
        <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ml-3 flex-shrink-0 ${config.bg} ${colorClasses.text.white} group-hover:scale-110 transition-transform duration-300 shadow-md`}>
          <div className="w-5 h-5 sm:w-6 sm:h-6">
            {icon}
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className={`text-xs sm:text-sm truncate ${colorClasses.text.gray600}`}>
          {subtitle}
        </p>
      </div>
    </div>
  );
};

interface DashboardStatsProps {
  stats: {
    profile: {
      completion: number;
      views: number;
      verified: boolean;
      verificationStatus?: 'none' | 'partial' | 'full';
    };
    portfolio: {
      total: number;
      featured: number;
    };
    skills: {
      total: number;
      categories: string[];
    };
    earnings: {
      total: number;
      successRate: number;
    };
    ratings: {
      average: number;
      count: number;
    };
    proposals: {
      sent: number;
      accepted: number;
      pending: number;
    };
    certifications?: {
      total: number;
    };
  };
  themeMode?: 'light' | 'dark';
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, themeMode = 'light' }) => {
  const certificationsCount = stats.certifications?.total || 0;

  // Determine verification status from props or fallback to boolean
  const verificationStatus = stats.profile.verificationStatus
    ? (stats.profile.verified ? 'full' : 'none')
    : (stats.profile.verified ? 'full' : 'none');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {/* Profile Views */}
      <StatsCard
        title="Profile Views"
        value={stats.profile.views.toLocaleString()}
        subtitle="Total views"
        icon={<EyeIcon className="w-full h-full" />}
        color="teal"
      />

      {/* Portfolio Items */}
      <StatsCard
        title="Portfolio"
        value={stats.portfolio.total}
        subtitle={`${stats.portfolio.featured} featured`}
        icon={<StarIcon className="w-full h-full" />}
        color="blue"
      />

      {/* Skills */}
      <StatsCard
        title="Skills"
        value={stats.skills.total}
        subtitle={`${stats.skills.categories.length} categories`}
        icon={<AcademicCapIcon className="w-full h-full" />}
        color="darkNavy"
      />

      {/* Certifications */}
      {certificationsCount > 0 && (
        <StatsCard
          title="Certifications"
          value={certificationsCount}
          subtitle="Professional credentials"
          icon={<AcademicCapIcon className="w-full h-full" />}
          color="teal"
        />
      )}

      {/* Proposals */}
      <StatsCard
        title="Proposals"
        value={stats.proposals.sent}
        subtitle={`${stats.proposals.accepted} accepted`}
        icon={<BriefcaseIcon className="w-full h-full" />}
        color="purple"
      />

      {/* Pending Proposals */}
      {stats.proposals.pending > 0 && (
        <StatsCard
          title="Active Proposals"
          value={stats.proposals.pending}
          subtitle="Waiting for response"
          icon={<UserGroupIcon className="w-full h-full" />}
          color="orange"
        />
      )}

      {/* Ratings */}
      {stats.ratings.count > 0 && (
        <StatsCard
          title="Rating"
          value={stats.ratings.average.toFixed(1)}
          subtitle={`${stats.ratings.count} reviews`}
          icon={<CheckBadgeIcon className="w-full h-full" />}
          color="green"
        />
      )}

      {/* Verification Status */}
      <StatsCard
        title="Verification"
        value={
          <div className="flex items-center">
            <VerificationBadge
              status={verificationStatus}
              size="sm"
              showText={true}
              showTooltip={true}
              className="text-xs sm:text-sm"
              autoFetch={false}
            />
          </div>
        }
        subtitle="Profile status"
        icon={<CheckBadgeIcon className="w-full h-full" />}
        color={stats.profile.verified ? "green" : "orange"}
      />

      {/* Profile Completion */}
      <StatsCard
        title="Profile Completion"
        value={`${stats.profile.completion}%`}
        subtitle={stats.profile.completion >= 80 ? "Excellent" : "Needs improvement"}
        icon={<CheckBadgeIcon className="w-full h-full" />}
        color={stats.profile.completion >= 80 ? "green" : "orange"}
      />
    </div>
  );
};

export default DashboardStats;