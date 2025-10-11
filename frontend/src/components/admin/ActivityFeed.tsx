// src/components/admin/ActivityFeed.tsx
import React, { useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface Activity {
  id?: string; // Made optional since some might be undefined
  user?: {
    name?: string;
    email?: string;
  };
  action: string;
  target: string;
  timestamp: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  loading?: boolean;
}

const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, loading = false }) => {
  useEffect(() => {
    if (!activities || activities.length === 0) {
      toast({
        title: 'No Activity',
        description: 'There is no recent activity to display.',
        variant: 'default',
      });
    }
  }, [activities]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <div className="space-y-4">
          {[...Array(5)].map((_, index) => (
            <div key={`activity-loading-${index}`} className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h3>
      <div className="space-y-4">
        {activities.map((activity, index) => (
          // FIXED: Use a combination of id and index to ensure unique keys
          <div key={activity.id ? `activity-${activity.id}` : `activity-${index}-${Date.now()}`} className="border-l-4 border-blue-500 pl-4 py-2">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-semibold">{activity.user?.name || 'Unknown User'}</span> {activity.action} {activity.target}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(activity.timestamp).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityFeed;