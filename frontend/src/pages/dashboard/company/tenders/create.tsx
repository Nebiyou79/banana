/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/create.tsx - ENHANCED VERSION
import React, { useState } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '@/components/layout/Layout';
import TenderForm from '@/components/tenders/TenderForm';
import { TenderService, CreateTenderData, UpdateTenderData } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { toast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CreateTenderPage: NextPage = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not a company
  React.useEffect(() => {
    if (user && user.role !== 'company') {
      router.push('/tenders');
    }
  }, [user, router]);

  const handleSubmit = async (data: CreateTenderData | UpdateTenderData) => {
    if (!user || user.role !== 'company') {
      toast({
        title: 'Authentication Required',
        description: 'Please login as a company to create tenders',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }

    // Since this is a create page, we can safely cast to CreateTenderData
    const tenderData = data as CreateTenderData;

    console.log('Creating tender with data:', tenderData);

    setIsLoading(true);
    try {
      const response = await TenderService.createTender(tenderData);
      console.log('Tender created successfully:', response);
      
      toast({
        title: 'Success!',
        description: `Tender ${tenderData.status === 'published' ? 'published' : 'saved as draft'} successfully`,
      });
      
      router.push('/dashboard/company/tenders');
    } catch (error: any) {
      console.error('Error creating tender:', error);
      
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to create tender',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (!user || user.role !== 'company') {
    return (
      <DashboardLayout requiredRole="company">
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only companies can create tenders.</p>
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
    <DashboardLayout requiredRole="company">
      <Head>
        <title>Create Tender | Freelance Platform</title>
        <meta name="description" content="Create a new tender to find the perfect freelancer for your project" />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to My Tenders
            </button>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Create New Tender</h1>
              <p className="text-gray-600">
                Fill out the form below to create a new tender. You can save it as a draft or publish it immediately.
              </p>
            </div>
          </div>

          {/* Tender Form */}
          <TenderForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isLoading}
            mode="create"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateTenderPage;