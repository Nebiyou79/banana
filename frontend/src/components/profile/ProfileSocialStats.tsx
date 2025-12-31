import React from 'react';
import { Card } from '@/components/social/ui/Card';
import { SocialStats } from '@/services/profileService';
import {
  Users,
  UserPlus,
  FileText,
  Handshake,
  Eye,
  TrendingUp,
  Award,
  Clock,
  Sparkles,
  BarChart3
} from 'lucide-react';

interface ProfileSocialStatsProps {
  stats: SocialStats;
  showLabels?: boolean;
  compact?: boolean;
  variant?: 'default' | 'glass' | 'gradient';
  showTrends?: boolean;
}

export const ProfileSocialStats: React.FC<ProfileSocialStatsProps> = ({
  stats,
  showLabels = true,
  compact = false,
  variant = 'glass',
  showTrends = false,
}) => {
  const statItems = [
    {
      label: 'Followers',
      value: stats.followerCount,
      icon: <Users className="w-5 h-5" />,
      description: 'People who follow you',
      trend: '+12%',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-500 to-cyan-500',
      metric: 'followerCount'
    },
    {
      label: 'Following',
      value: stats.followingCount,
      icon: <UserPlus className="w-5 h-5" />,
      description: 'People you follow',
      trend: '+5%',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-500 to-pink-500',
      metric: 'followingCount'
    },
    {
      label: 'Posts',
      value: stats.postCount,
      icon: <FileText className="w-5 h-5" />,
      description: 'Total posts created',
      trend: '+23%',
      color: 'from-amber-500 to-orange-500',
      bgColor: 'from-amber-500 to-orange-500',
      metric: 'postCount'
    },
    {
      label: 'Connections',
      value: stats.connectionCount,
      icon: <Handshake className="w-5 h-5" />,
      description: 'Professional connections',
      trend: '+8%',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-500 to-emerald-500',
      metric: 'connectionCount'
    },
    {
      label: 'Profile Views',
      value: stats.profileViews,
      icon: <Eye className="w-5 h-5" />,
      description: 'Profile visits this month',
      trend: '+42%',
      color: 'from-indigo-500 to-blue-500',
      bgColor: 'from-indigo-500 to-blue-500',
      metric: 'profileViews'
    },
    {
      label: 'Engagement',
      value: `${stats.engagementRate}%`,
      icon: <TrendingUp className="w-5 h-5" />,
      description: 'Interaction rate',
      trend: stats.engagementRate > 5 ? '+15%' : '-2%',
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-500 to-pink-500',
      metric: 'engagementRate'
    },
    {
      label: 'Endorsements',
      value: stats.endorsementCount,
      icon: <Award className="w-5 h-5" />,
      description: 'Skill endorsements',
      trend: '+7%',
      color: 'from-yellow-500 to-amber-500',
      bgColor: 'from-yellow-500 to-amber-500',
      metric: 'endorsementCount'
    },
    {
      label: 'Avg Response',
      value: `${stats.averageResponseTime}h`,
      icon: <Clock className="w-5 h-5" />,
      description: 'Average response time',
      trend: '-25%',
      color: 'from-teal-500 to-green-500',
      bgColor: 'from-teal-500 to-green-500',
      metric: 'averageResponseTime'
    },
  ];

  const getContainerClass = () => {
    if (compact) {
      return variant === 'glass'
        ? 'backdrop-blur-lg bg-white rounded-xl p-4 border border-gray-200'
        : 'bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-4';
    }

    return variant === 'glass'
      ? 'backdrop-blur-xl bg-gradient-to-b from-white to-gray-100 border border-gray-200 shadow-2xl rounded-3xl p-8'
      : 'bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 border border-gray-700';
  };

  const formatValue = (value: any) => {
    if (typeof value === 'number') {
      if (value >= 1000000) {
        return `${(value / 1000000).toFixed(1)}M`;
      } else if (value >= 1000) {
        return `${(value / 1000).toFixed(1)}K`;
      }
    }
    return value?.toString() || '0';
  };

  return (
    <Card className={getContainerClass()}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Social Analytics
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Real-time engagement metrics and trends
              </p>
            </div>
          </div>

          {showTrends && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full border border-green-500">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">+18% Growth</span>
            </div>
          )}
        </div>
      )}

      {/* Stats Grid */}
      <div className={`grid gap-4 ${compact ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4'}`}>
        {statItems.map((stat, index) => (
          <div
            key={index}
            className={`group relative backdrop-blur-lg bg-gradient-to-br ${stat.bgColor} rounded-xl p-4 border border-gray-200 hover:border-gray-300 transition-all duration-300 hover:scale-105 cursor-pointer ${compact ? 'min-h-20' : 'min-h-24'
              }`}
          >
            {/* Animated background gradient */}
            <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 transition-opacity duration-300`} />

            {/* Glowing particles */}
            <div className="absolute inset-0 overflow-hidden rounded-xl">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            <div className="relative z-10">
              <div className="flex items-start justify-between mb-2">
                <div className="p-2 rounded-lg bg-white">
                  {React.cloneElement(stat.icon, {
                    className: `w-${compact ? '4' : '5'} h-${compact ? '4' : '5'} text-gray-700`
                  })}
                </div>

                {showTrends && stat.trend && (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${stat.trend.startsWith('+')
                    ? 'bg-green-500 text-white border border-green-500'
                    : 'bg-red-500 text-white border border-red-500'
                    }`}>
                    {stat.trend}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                <div className={`font-bold text-gray-900 ${compact ? 'text-xl' : 'text-2xl'}`}>
                  {formatValue(stat.value)}
                </div>

                {showLabels && (
                  <div className="text-sm text-gray-700 font-medium">{stat.label}</div>
                )}

                {!compact && (
                  <div className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    {stat.description}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Network Strength Indicator */}
      {!compact && (
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-bold text-gray-900">Network Strength</h4>
                <p className="text-sm text-gray-600">Based on engagement and growth</p>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900">
              {stats.engagementRate > 10 ? 'Excellent' :
                stats.engagementRate > 5 ? 'Good' :
                  stats.engagementRate > 2 ? 'Average' : 'Developing'}
            </div>
          </div>

          <div className="relative h-2 rounded-full bg-gray-200 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 transition-all duration-1000 ease-out"
              style={{ width: `${Math.min(stats.engagementRate * 10, 100)}%` }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent animate-shimmer" />
          </div>

          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
            <span>Elite</span>
          </div>
        </div>
      )}

      {/* Engagement Insights */}
      {!compact && stats.engagementRate > 0 && (
        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="backdrop-blur-lg bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 mb-1">Avg. Engagement</div>
            <div className="text-xl font-bold text-gray-900">{stats.engagementRate}%</div>
          </div>
          <div className="backdrop-blur-lg bg-white rounded-lg p-3 text-center">
            <div className="text-sm text-gray-600 mb-1">Response Time</div>
            <div className="text-xl font-bold text-gray-900">{stats.averageResponseTime}h</div>
          </div>
        </div>
      )}
    </Card>
  );
};