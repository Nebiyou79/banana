import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  description?: string;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  change,
  changeType = 'neutral',
  description,
  loading = false,
}) => {
  const changeColors = {
    positive: 'text-green-600 bg-green-100 dark:bg-green-900 dark:text-green-300',
    negative: 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300',
    neutral: 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-300',
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
        <div className="flex items-center">
          <div className="w-12 h-12 bg-gray-300 dark:bg-gray-600 rounded-lg"></div>
          <div className="ml-4 space-y-2 flex-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl text-white">
          {icon}
        </div>
        <div className="ml-4 flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          
          {change && (
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${changeColors[changeType]}`}>
              {changeType === 'positive' && '↗ '}
              {changeType === 'negative' && '↘ '}
              {change}
              {description && <span className="ml-1">{description}</span>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StatsCard;