// src/pages/dashboard/freelancer/index.tsx
import React from 'react';
import { useRouter } from 'next/router';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { FiUsers, FiClock, FiAward, FiBriefcase } from 'react-icons/fi';

const FreelancerHomePage: React.FC = () => {
  const router = useRouter();

  return (
    <DashboardLayout requiredRole="company">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Freelancer Management</h1>
              <p className="text-gray-600 mt-2">Manage your freelancers and projects</p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-blue-100 rounded-full">
                  <FiUsers className="text-blue-600 text-xl" />
                </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 mb-2">0</div>
              <div className="text-gray-600">Active Freelancers</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-green-100 rounded-full">
                  <FiClock className="text-green-600 text-xl" />
                </div>
              </div>
              <div className="text-3xl font-bold text-green-600 mb-2">0</div>
              <div className="text-gray-600">Pending Projects</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-purple-100 rounded-full">
                  <FiAward className="text-purple-600 text-xl" />
                </div>
              </div>
              <div className="text-3xl font-bold text-purple-600 mb-2">0</div>
              <div className="text-gray-600">Completed Tasks</div>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
              <div className="flex justify-center mb-3">
                <div className="p-3 bg-orange-100 rounded-full">
                  <FiBriefcase className="text-orange-600 text-xl" />
                </div>
              </div>
              <div className="text-3xl font-bold text-orange-600 mb-2">0</div>
              <div className="text-gray-600">Total Earnings</div>
            </div>
          </div>

          {/* Coming Soon Content */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="p-8 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FiUsers className="text-blue-600 text-3xl" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Freelancer Management Coming Soon
                </h2>
                <p className="text-gray-600 mb-6">
                  We’re building a powerful freelancer management system. 
                  Soon you’ll be able to add, track, and manage your freelancers effortlessly.
                </p>
                <div className="space-y-3 text-left bg-gray-50 rounded-lg p-4 mb-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Planned Features:</h3>
                  {[
                    "Add and manage freelancers",
                    "Assign projects and tasks",
                    "Track progress and deadlines",
                    "Generate reports and invoices"
                  ].map((feature, idx) => (
                    <div key={idx} className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/dashboard/company')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Back to Dashboard
                  </button>
                  <button className="border border-gray-300 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    Notify Me When Ready
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FreelancerHomePage;
