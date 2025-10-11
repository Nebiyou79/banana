/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/dashboard/company/tenders/[id]/index.tsx
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TenderService, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import {
  ArrowLeftIcon,
  PencilIcon,
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  EyeIcon,
  UserGroupIcon,
  MapPinIcon,
  LanguageIcon,
  CheckBadgeIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

const CompanyTenderDetailsPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

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
      console.log('Loading tender details with ID:', id);
      
      const response = await TenderService.getTender(id);
      const tenderData = response.data.tender;
      
      console.log('Tender details loaded successfully:', tenderData._id);
      setTender(tenderData);
    } catch (err: any) {
      console.error('Error loading tender details:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Failed to load tender details';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditTender = () => {
    if (!tender?._id) return;
    router.push(`/dashboard/company/tenders/${tender._id}/edit`);
  };

  const handleDeleteTender = async () => {
    if (!tender?._id) return;

    if (!confirm('Are you sure you want to delete this tender? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(true);
    try {
      console.log('Deleting tender:', tender._id);
      await TenderService.deleteTender(tender._id);
      router.push('/dashboard/company/tenders?deleted=true');
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMessage = err.response?.data?.message || 'Failed to delete tender';
      setError(errorMessage);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/company/tenders');
  };

  const formatCurrency = (amount: number, currency: string) => {
    const validCurrency = currency && currency.trim() ? currency : 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'open':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVisibilityColor = (visibility: string) => {
    switch (visibility) {
      case 'public':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'invite_only':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
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
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="h-8 w-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Tender Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The tender you are looking for was not found or you do not have permission to view it.'}</p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={handleBack}
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
            <p className="text-gray-600 mb-6">Only companies can view tender details.</p>
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

  const daysRemaining = getDaysRemaining(tender.deadline);
  const isExpired = daysRemaining < 0;

  return (
    <DashboardLayout requiredRole="company">
      <Head>
        <title>{tender.title} | Company Tender | Freelance Platform</title>
        <meta name="description" content={`View details for ${tender.title}`} />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className={`${colorClasses.bg.darkNavy} text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors font-medium"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to My Tenders
                </button>
                
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(tender.status)}`}>
                        {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                      </span>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getVisibilityColor(tender.visibility)}`}>
                        {tender.visibility === 'public' ? 'Public' : 'Invite Only'}
                      </span>
                    </div>
                    <h1 className="text-3xl font-bold mb-3">{tender.title}</h1>
                    <p className="text-gray-300 text-lg max-w-3xl">
                      {tender.description.substring(0, 150)}
                      {tender.description.length > 150 && '...'}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={handleEditTender}
                      className={`flex items-center gap-2 px-6 py-3 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
                    >
                      <PencilIcon className="h-4 w-4" />
                      Edit Tender
                    </button>
                    
                    <button
                      onClick={handleDeleteTender}
                      disabled={deleteLoading || (tender.proposals && tender.proposals.length > 0)}
                      className="flex items-center gap-2 px-6 py-3 border border-red-300 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                      title={tender.proposals && tender.proposals.length > 0 ? "Cannot delete tender with proposals" : "Delete tender"}
                    >
                      {deleteLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          Deleting...
                        </div>
                      ) : (
                        <>
                          <TrashIcon className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center mr-2">
                  <CalendarIcon className="h-3 w-3 text-red-600" />
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

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Proposals</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {tender.proposals?.length || 0}
                  </p>
                </div>
                <UserGroupIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Budget Range</p>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(tender.budget.min, tender.budget.currency)} - {formatCurrency(tender.budget.max, tender.budget.currency)}
                  </p>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Time Remaining</p>
                  <p className={`text-lg font-bold ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                    {isExpired ? 'Expired' : `${daysRemaining} days`}
                  </p>
                </div>
                <ClockIcon className="h-8 w-8 text-orange-400" />
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Duration</p>
                  <p className="text-lg font-bold text-gray-900">
                    {tender.duration} days
                  </p>
                </div>
                <CalendarIcon className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Tender Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Navigation Tabs */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'overview'
                          ? 'border-goldenMustard text-goldenMustard'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setActiveTab('proposals')}
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'proposals'
                          ? 'border-goldenMustard text-goldenMustard'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Proposals ({tender.proposals?.length || 0})
                    </button>
                    <button
                      onClick={() => setActiveTab('requirements')}
                      className={`flex-1 py-4 px-6 text-center font-medium text-sm border-b-2 transition-colors ${
                        activeTab === 'requirements'
                          ? 'border-goldenMustard text-goldenMustard'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Requirements
                    </button>
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {activeTab === 'overview' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Description</h3>
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {tender.description}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Required Skills</h3>
                        <div className="flex flex-wrap gap-2">
                          {tender.skillsRequired.map((skill, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Details</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <CalendarIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Deadline</p>
                                <p className="text-gray-900">{formatDate(tender.deadline)}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <ClockIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Project Duration</p>
                                <p className="text-gray-900">{tender.duration} days</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <CurrencyDollarIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Budget</p>
                                <p className="text-gray-900">
                                  {formatCurrency(tender.budget.min, tender.budget.currency)} - {formatCurrency(tender.budget.max, tender.budget.currency)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Project Settings</h3>
                          <div className="space-y-3">
                            <div className="flex items-center gap-3">
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Visibility</p>
                                <p className="text-gray-900 capitalize">
                                  {tender.visibility.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
                              <div>
                                <p className="text-sm font-medium text-gray-600">Category</p>
                                <p className="text-gray-900 capitalize">
                                  {tender.category.replace('_', ' ')}
                                </p>
                              </div>
                            </div>
                            {tender.requirements?.location && tender.requirements.location !== 'anywhere' && (
                              <div className="flex items-center gap-3">
                                <MapPinIcon className="h-5 w-5 text-gray-400" />
                                <div>
                                  <p className="text-sm font-medium text-gray-600">Location</p>
                                  <p className="text-gray-900">{tender.requirements.specificLocation}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'proposals' && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Submitted Proposals</h3>
                      {tender.proposals && tender.proposals.length > 0 ? (
                        <div className="space-y-4">
                          {tender.proposals.map((proposal: any, index: number) => (
                            <div key={proposal._id || index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <UserGroupIcon className="h-5 w-5 text-blue-600" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {proposal.freelancer?.name || 'Unknown Freelancer'}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      Submitted {new Date(proposal.submittedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  proposal.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                                  proposal.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                  proposal.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {proposal.status?.charAt(0).toUpperCase() + proposal.status?.slice(1) || 'Pending'}
                                </span>
                              </div>
                              {proposal.bidAmount && (
                                <p className="text-lg font-semibold text-gray-900 mb-2">
                                  {formatCurrency(proposal.bidAmount, tender.budget.currency)}
                                </p>
                              )}
                              {proposal.proposalText && (
                                <p className="text-gray-700 line-clamp-2">
                                  {proposal.proposalText}
                                </p>
                              )}
                              <div className="mt-3 flex gap-2">
                                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                                  View Details
                                </button>
                                <button className="text-sm text-green-600 hover:text-green-800 font-medium">
                                  Accept
                                </button>
                                <button className="text-sm text-red-600 hover:text-red-800 font-medium">
                                  Reject
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <h4 className="text-lg font-medium text-gray-900 mb-2">No Proposals Yet</h4>
                          <p className="text-gray-500 mb-4">
                            No freelancers have submitted proposals for this tender yet.
                          </p>
                          <button
                            onClick={() => router.push(`/tenders/${tender._id}`)}
                            className={`px-4 py-2 ${colorClasses.bg.goldenMustard} text-darkNavy rounded-lg hover:bg-yellow-500 transition-colors font-medium`}
                          >
                            View Public Listing
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'requirements' && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Experience Level</h3>
                        <div className="flex items-center gap-3">
                          <CheckBadgeIcon className="h-5 w-5 text-gray-400" />
                          <span className="text-gray-700 capitalize">
                            {tender.requirements?.experienceLevel || 'Not specified'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Location Preference</h3>
                        <div className="flex items-center gap-3">
                          <MapPinIcon className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-gray-700 capitalize">
                              {tender.requirements?.location === 'anywhere' ? 'Remote (Anywhere)' :
                               tender.requirements?.location === 'specific_country' ? 'Specific Country' :
                               tender.requirements?.location === 'specific_city' ? 'Specific City' :
                               'Not specified'}
                            </p>
                            {tender.requirements?.specificLocation && (
                              <p className="text-sm text-gray-600 mt-1">
                                {tender.requirements.specificLocation}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {tender.requirements?.languageRequirements && tender.requirements.languageRequirements.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Language Requirements</h3>
                          <div className="space-y-2">
                            {tender.requirements.languageRequirements.map((req: any, index: number) => (
                              <div key={index} className="flex items-center gap-3">
                                <LanguageIcon className="h-5 w-5 text-gray-400" />
                                <span className="text-gray-700">
                                  {req.language} ({req.proficiency})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {tender.invitedFreelancers && tender.invitedFreelancers.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-3">Invited Freelancers</h3>
                          <p className="text-gray-700">
                            {tender.invitedFreelancers.length} freelancer{tender.invitedFreelancers.length !== 1 ? 's' : ''} invited
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Status Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tender Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Current Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tender.status)}`}>
                      {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Visibility</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getVisibilityColor(tender.visibility)}`}>
                      {tender.visibility === 'public' ? 'Public' : 'Invite Only'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Proposals</span>
                    <span className="text-sm font-medium text-gray-900">
                      {tender.proposals?.length || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Views</span>
                    <span className="text-sm font-medium text-gray-900">
                      {tender.metadata?.views || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(tender.createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(tender.updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Deadline</span>
                    <span className={`text-sm font-medium ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                      {formatDate(tender.deadline)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Card */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleEditTender}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    <PencilIcon className="h-4 w-4" />
                    Edit Tender
                  </button>
                  <button
                    onClick={() => router.push(`/tenders/${tender._id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    <EyeIcon className="h-4 w-4" />
                    View Public Page
                  </button>
                  <button
                    onClick={handleDeleteTender}
                    disabled={deleteLoading || (tender.proposals && tender.proposals.length > 0)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 border border-red-300 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {deleteLoading ? 'Deleting...' : 'Delete Tender'}
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

export default CompanyTenderDetailsPage;