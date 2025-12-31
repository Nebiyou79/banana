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
      border: 'border-amber-200'
    },
    darkNavy: {
      bg: 'bg-gradient-to-br from-slate-700 to-slate-800',
      text: colorClasses.text.darkNavy,
      border: 'border-slate-200'
    },
    teal: {
      bg: 'bg-gradient-to-br from-teal-500 to-teal-600',
      text: colorClasses.text.teal,
      border: 'border-teal-200'
    },
    orange: {
      bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
      text: colorClasses.text.orange,
      border: 'border-orange-200'
    },
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      text: colorClasses.text.blue,
      border: 'border-blue-200'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      text: colorClasses.text.darkNavy,
      border: 'border-purple-200'
    },
    green: {
      bg: 'bg-gradient-to-br from-green-500 to-green-600',
      text: colorClasses.text.teal,
      border: 'border-green-200'
    }
  };

  const config = colorConfig[color];

  return (
    <div className={`bg-white rounded-2xl p-6 shadow-lg border ${config.border} hover:shadow-xl transition-all duration-300 group hover:scale-105`}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-gray-600 uppercase tracking-wide">{title}</p>
          <div className={`text-3xl font-bold ${colorClasses.text.darkNavy} mt-2`}>
            {value}
          </div>
        </div>
        <div className={`p-3 rounded-xl ${config.bg} text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 font-medium">{subtitle}</p>
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
}

const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  const certificationsCount = stats.certifications?.total || 0;

  // Determine verification status from props or fallback to boolean
  const verificationStatus = stats.profile.verificationStatus
    ? (stats.profile.verified ? 'full' : 'none')
    : (stats.profile.verified ? 'full' : 'none');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {/* Profile Views */}
      <StatsCard
        title="Profile Views"
        value={stats.profile.views.toLocaleString()}
        subtitle="Total views"
        icon={<EyeIcon className="w-6 h-6" />}
        color="teal"
      />

      {/* Portfolio Items */}
      <StatsCard
        title="Portfolio"
        value={stats.portfolio.total}
        subtitle={`${stats.portfolio.featured} featured`}
        icon={<StarIcon className="w-6 h-6" />}
        color="blue"
      />

      {/* Skills */}
      <StatsCard
        title="Skills"
        value={stats.skills.total}
        subtitle={`${stats.skills.categories.length} categories`}
        icon={<AcademicCapIcon className="w-6 h-6" />}
        color="darkNavy"
      />

      {/* Certifications */}
      <StatsCard
        title="Certifications"
        value={certificationsCount}
        subtitle="Professional credentials"
        icon={<AcademicCapIcon className="w-6 h-6" />}
        color="teal"
      />

      {/* Proposals */}
      <StatsCard
        title="Proposals"
        value={stats.proposals.sent}
        subtitle={`${stats.proposals.accepted} accepted`}
        icon={<BriefcaseIcon className="w-6 h-6" />}
        color="purple"
      />

      {/* Pending Proposals */}
      <StatsCard
        title="Active Proposals"
        value={stats.proposals.pending}
        subtitle="Waiting for response"
        icon={<UserGroupIcon className="w-6 h-6" />}
        color="orange"
      />

      {/* Ratings */}
      <StatsCard
        title="Rating"
        value={stats.ratings.average.toFixed(1)}
        subtitle={`${stats.ratings.count} reviews`}
        icon={<CheckBadgeIcon className="w-6 h-6" />}
        color="green"
      />

      {/* Verification Status */}
      <StatsCard
        title="Verification"
        value={
          <VerificationBadge
            status={verificationStatus}
            size="md"
            showText={true}
            showTooltip={true}
            className="text-sm"
            autoFetch={false}
          />
        }
        subtitle="Profile status"
        icon={<CheckBadgeIcon className="w-6 h-6" />}
        color={stats.profile.verified ? "green" : "orange"}
      />
    </div>
  );
};

export default DashboardStats;