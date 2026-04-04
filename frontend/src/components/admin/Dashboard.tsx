// src/components/admin/Dashboard.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import StatsCard from './StatCard';
import ActivityFeed from './ActivityFeed';
import { useAdminData } from '@/hooks/useAdmin';

const Dashboard: React.FC = () => {
  const { getDashboardStats, data, loading, error } = useAdminData();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      await getDashboardStats();
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    }
  };

  useEffect(() => {
    if (data) {
      setStats(data);
    }
  }, [data]);

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  // Safe access to activities with fallback
  const activities = stats?.recentActivities || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">Welcome to your admin dashboard</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={stats?.users?.total || 0}
          icon="👥"
          change={`+${stats?.users?.newLast30Days || 0}`}
          changeType="positive"
          description="from last 30 days"
          loading={loading}
        />
        <StatsCard
          title="Candidates"
          value={stats?.users?.candidates || 0}
          icon="🎓"
          loading={loading}
        />
        <StatsCard
          title="Freelancers"
          value={stats?.users?.freelancers || 0}
          icon="💻"
          loading={loading}
        />
        <StatsCard
          title="Companies"
          value={stats?.users?.companies || 0}
          icon="🏢"
          loading={loading}
        />
        <StatsCard
          title="Total Jobs"
          value={stats?.jobs?.total || 0}
          icon="💼"
          change={`+${stats?.jobs?.newLast30Days || 0}`}
          changeType="positive"
          description="from last 30 days"
          loading={loading}
        />
        <StatsCard
          title="Active Jobs"
          value={stats?.jobs?.active || 0}
          icon="✅"
          loading={loading}
        />
        <StatsCard
          title="Draft Jobs"
          value={stats?.jobs?.draft || 0}
          icon="📝"
          loading={loading}
        />
        <StatsCard
          title="Closed Jobs"
          value={stats?.jobs?.closed || 0}
          icon="🔒"
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <ActivityFeed
          activities={activities}
          loading={loading}
        />

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-4">
            <button className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <div className="text-blue-600 dark:text-blue-400 text-2xl mb-2">➕</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Add User</p>
            </button>
            <button className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
              <div className="text-green-600 dark:text-green-400 text-2xl mb-2">📊</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Generate Report</p>
            </button>
            <button className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
              <div className="text-purple-600 dark:text-purple-400 text-2xl mb-2">⚙️</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Settings</p>
            </button>
            <button className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
              <div className="text-orange-600 dark:text-orange-400 text-2xl mb-2">📋</div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Templates</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;