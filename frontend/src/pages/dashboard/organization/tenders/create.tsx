/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TenderForm from '@/components/tenders/TenderForm';
import { TenderService, CreateTenderData, UpdateTenderData } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, BuildingLibraryIcon } from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CreateOrganizationTenderPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not an organization
  React.useEffect(() => {
    if (user && user.role !== 'organization') {
      router.push('/tenders');
    }
  }, [user, router]);

  const handleSubmit = async (data: CreateTenderData | UpdateTenderData) => {
    if (!user || user.role !== 'organization') {
      setError('Please login as an organization to create tenders');
      router.push('/login');
      return;
    }

    // Since this is a create page, we can safely cast to CreateTenderData
    const tenderData = data as CreateTenderData;

    console.log('Creating organization tender with data:', tenderData);

    setIsLoading(true);
    setError('');
    try {
      const response = await TenderService.createTender(tenderData);
      console.log('Organization tender created successfully:', response);
      
      // Redirect to tenders list with success message
      router.push({
        pathname: '/dashboard/organization/tenders',
        query: { created: 'true' }
      });
    } catch (error: any) {
      console.error('Error creating tender:', error);
      setError(error.response?.data?.message || 'Failed to create tender. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user || user.role !== 'organization') {
    return (
      <DashboardLayout requiredRole="organization">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only organizations can create tenders.</p>
            <button
              onClick={() => router.push('/tenders')}
              className={`px-6 py-2 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors`}
            >
              Browse Tenders
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="organization">
      <Head>
        <title>Create Organization Tender | Freelance Platform</title>
        <meta name="description" content="Create a new organization tender to find the perfect freelancer for your project" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors font-medium hover:bg-white px-4 py-2 rounded-lg"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to My Tenders
            </button>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BuildingLibraryIcon className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">Create Organization Tender</h1>
                <p className="text-xl text-gray-600 mb-6">
                  Create a professional tender to connect with qualified freelancers for your organization`s projects.
                </p>
                <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    Organization Tender
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    Professional Freelancers
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    Secure Collaboration
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 animate-fade-in">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <BuildingLibraryIcon className="h-3 w-3 text-red-600" />
                </div>
                <p className="text-red-800 text-sm">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="ml-auto text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Tender Form */}
          <TenderForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            mode="create"
            tenderType="organization"
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </DashboardLayout>
  );
};

export default CreateOrganizationTenderPage;