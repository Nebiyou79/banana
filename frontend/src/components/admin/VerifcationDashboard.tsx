// src/components/admin/VerificationDashboard.tsx
import React, { useEffect, useState } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  UserGroupIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import verificationService, { VerificationStats } from '@/services/verificationService';
import UserVerificationBadge from '@/components/verifcation/UserVerificationBadge';
import VerificationBadge from '@/components/verifcation/VerificationBadge';

const VerificationDashboard: React.FC = () => {
  const [stats, setStats] = useState<VerificationStats | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [statsData, requestsData] = await Promise.all([
        verificationService.getVerificationStats(),
        verificationService.getVerificationRequests()
      ]);
      setStats(statsData.stats);
      setRequests(requestsData.requests);
    } catch (error) {
      console.error('Error loading verification data:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleBulkVerify = async (userIds: string[]) => {
    if (!confirm(`Verify ${userIds.length} user(s)?`)) return;

    try {
      await verificationService.bulkUpdateVerification({
        userIds,
        updates: { profileVerified: true }
      });
      await loadData();
    } catch (error) {
      console.error('Error bulk verifying:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Verification Dashboard</h1>
          <p className="text-gray-600">Manage user verification status</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.total || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Fully Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.verified || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Partially Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.partiallyVerified || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Not Verified</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats?.notVerified || 0}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Rate */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Rate</h3>
        <div className="flex items-center">
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${stats?.verificationRate || 0}%` }}
              />
            </div>
          </div>
          <div className="ml-4">
            <span className="text-2xl font-bold text-gray-900">{stats?.verificationRate?.toFixed(1) || 0}%</span>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Percentage of users who are fully verified
        </p>
      </div>

      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pending Verification Requests ({requests.length})</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {requests.map((request, index) => (
              <div key={index} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">{request.name}</h4>
                      <p className="text-sm text-gray-500">{request.email}</p>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {request.role}
                        </span>
                        <UserVerificationBadge userId={request.userId} size="sm" className="ml-2" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => handleBulkVerify([request.userId])}
                      className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Verify
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Verification Distribution</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {stats?.detailedStats?.map((stat: { status: any; roles: any[]; count: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; }, index: React.Key | null | undefined) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center">
                  <VerificationBadge
                    status={stat.status}
                    size="sm"
                    showText={true}
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    {stat.roles.join(', ')}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-semibold text-gray-900">{stat.count}</span>
                  <span className="text-sm text-gray-500 ml-1">
                    ({((Number(stat.count) / (stats?.total || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerificationDashboard;