/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard/company/applications.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applicationService, Application } from '@/services/applicationService';
import ApplicationsList from '@/components/application/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Users, TrendingUp, CheckCircle } from 'lucide-react';

const CompanyApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    new: 0,
    hired: 0
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (filters?: any) => {
    try {
      setLoading(true);
      const response = await applicationService.getCompanyApplications(filters);
      setApplications(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const newApps = response.data.filter(app => app.status === 'submitted').length;
      const hired = response.data.filter(app => app.status === 'hired').length;
      
      setStats({ total, new: newApps, hired });
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filters: any) => {
    fetchApplications(filters);
  };

  return (
    <DashboardLayout requiredRole="company">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Applications</h1>
          <p className="text-gray-600 mt-2">Manage applications for your job postings</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
                <p className="text-gray-600">New Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.hired}</p>
                <p className="text-gray-600">Successful Hires</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white border rounded-lg p-6">
          <ApplicationsList
            applications={applications}
            loading={loading}
            variant="company"
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CompanyApplicationsPage;