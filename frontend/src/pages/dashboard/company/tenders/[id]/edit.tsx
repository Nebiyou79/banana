/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/[id]/edit.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import TenderForm from '@/components/tenders/TenderForm';
import { TenderService, Tender, UpdateTenderData } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeftIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const EditTenderPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && user && user.role === 'company') {
      loadTender();
    }
  }, [id, user]);

  const loadTender = async () => {
    if (!id || typeof id !== 'string') {
      setError('Invalid tender ID');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('Loading tender with ID:', id);
      
      const response = await TenderService.getTender(id);
      const tenderData = response.data.tender;
      
      console.log('Tender loaded successfully:', tenderData._id);
      setTender(tenderData);
    } catch (err: any) {
      console.error('Error loading tender:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tender';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (updateData: UpdateTenderData) => {
    if (!id || typeof id !== 'string' || !user) {
      setError('Invalid tender ID or user');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('Updating tender with data:', updateData);
      await TenderService.updateTender(id, updateData);
      
      // Show success message and redirect
      router.push({
        pathname: '/dashboard/company/tenders',
        query: { updated: 'true' }
      });
    } catch (err: any) {
      console.error('Error updating tender:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update tender';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenMustard mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading tender details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tender) {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Tender</h1>
            <p className="text-gray-600 mb-6">{error || 'The tender you are trying to edit was not found.'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => router.push('/dashboard/company/tenders')}
                className={`px-6 py-2 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
              >
                Back to My Tenders
              </button>
              <button
                onClick={loadTender}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user?.role !== 'company') {
    return (
      <DashboardLayout requiredRole="company">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-6">Only companies can edit tenders.</p>
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
        <title>Edit {tender.title} | Freelance Platform</title>
        <meta name="description" content={`Edit ${tender.title}`} />
      </Head>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors font-medium"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to Tenders
            </button>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Tender</h1>
                  <p className="text-gray-600">
                    Update your tender information. Changes will be reflected immediately after saving.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  tender.status === 'published' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                </div>
              </div>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Tender Form */}
          <TenderForm
            tender={tender}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            isLoading={isSubmitting}
            mode="edit"
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditTenderPage;