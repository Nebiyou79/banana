/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pages/dashboard/candidate/applications.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { applicationService, Application } from '@/services/applicationService';
import ApplicationsList from '@/components/application/ApplicationList';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Briefcase, TrendingUp, FileText } from 'lucide-react';

const CandidateApplicationsPage: React.FC = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    hired: 0
  });

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async (filters?: any) => {
    try {
      setLoading(true);
      const response = await applicationService.getCandidateApplications(filters);
      setApplications(response.data);
      
      // Calculate stats
      const total = response.data.length;
      const active = response.data.filter(app => 
        ['submitted', 'reviewed', 'shortlisted'].includes(app.status)
      ).length;
      const hired = response.data.filter(app => app.status === 'hired').length;
      
      setStats({ total, active, hired });
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
    <DashboardLayout requiredRole="candidate">
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Applications</h1>
          <p className="text-gray-600 mt-2">Track your job applications and status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg mr-4">
                <Briefcase className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-gray-600">Total Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg mr-4">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                <p className="text-gray-600">Active Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg mr-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.hired}</p>
                <p className="text-gray-600">Hired Positions</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications List */}
        <div className="bg-white border rounded-lg p-6">
          <ApplicationsList
            applications={applications}
            loading={loading}
            variant="candidate"
            onFilterChange={handleFilterChange}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CandidateApplicationsPage;