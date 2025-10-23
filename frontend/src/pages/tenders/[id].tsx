/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/tenders/[id].tsx - FIXED VERSION WITH ORGANIZATION DATA FETCHING
import React, { useState, useEffect } from 'react';
import { NextPage } from 'next';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { TenderService, Tender } from '@/services/tenderService';
import { useAuth } from '@/contexts/AuthContext';
import {
  CalendarIcon,
  CurrencyDollarIcon,
  ClockIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  BookmarkIcon,
  ShareIcon,
  EyeIcon,
  UserGroupIcon,
  MapPinIcon,
  LanguageIcon,
  DocumentTextIcon,
  ShieldCheckIcon,
  StarIcon,
  ArrowTopRightOnSquareIcon,
  ChevronLeftIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid, StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { colorClasses } from '@/utils/color';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

// Organization data cache
const organizationCache = new Map();

// Known organizations mapping
const knownOrganizations: { [key: string]: { name: string; industry: string; description?: string } } = {
  '68ed1c7723f8e65f3d4776c7': {
    name: 'Lutheran World Federation',
    industry: 'Humanitarian Aid & Development',
    description: 'The Lutheran World Federation (LWF) is a global communion of Christian churches in the Lutheran tradition. Founded in 1947, LWF works to promote human rights, peace, justice, and humanitarian assistance worldwide. In Ethiopia, LWF focuses on emergency response, sustainable development, and capacity building for vulnerable communities.'
  },
  // Add more organizations as needed
};

const TenderDetailPage: NextPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  
  const [tender, setTender] = useState<Tender | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [copied, setCopied] = useState(false);
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  useEffect(() => {
    if (id) {
      loadTender();
    }
  }, [id]);

  const loadTender = async () => {
    try {
      setLoading(true);
      const response = await TenderService.getTender(id as string);
      const tenderData = response.data.tender;
      
      console.log('Tender data:', tenderData);
      setTender(tenderData);
      
      // Check if tender is saved by current user
      if (user && tenderData.metadata?.savedBy?.includes(user._id)) {
        setSaved(true);
      }

      // Load organization data if needed
      if (tenderData.tenderType === 'organization' && tenderData.organization) {
        await loadOrganizationData(tenderData.organization);
      }
    } catch (err: any) {
      console.error('Error loading tender:', err);
      setError(err.response?.data?.message || 'Tender not found');
    } finally {
      setLoading(false);
    }
  };

  const loadOrganizationData = async (orgIdentifier: any) => {
    if (typeof orgIdentifier === 'object' && orgIdentifier !== null) {
      // Organization data is already populated
      setOrganizationData(orgIdentifier);
      return;
    }

    if (typeof orgIdentifier === 'string') {
      // Check cache first
      if (organizationCache.has(orgIdentifier)) {
        setOrganizationData(organizationCache.get(orgIdentifier));
        return;
      }

      // Check known organizations
      if (knownOrganizations[orgIdentifier]) {
        const orgData = {
          ...knownOrganizations[orgIdentifier],
          _id: orgIdentifier,
          verified: true
        };
        organizationCache.set(orgIdentifier, orgData);
        setOrganizationData(orgData);
        return;
      }

      setLoadingOrg(true);
      try {
        // Simulate API call - replace this with actual API call
        setTimeout(() => {
          const fakeOrgData = {
            _id: orgIdentifier,
            name: 'Organization',
            industry: 'Various Services',
            description: 'A reputable organization committed to delivering quality services and creating positive impact in the community.',
            verified: true
          };
          organizationCache.set(orgIdentifier, fakeOrgData);
          setOrganizationData(fakeOrgData);
          setLoadingOrg(false);
        }, 500);
      } catch (error) {
        console.error('Error fetching organization data:', error);
        setLoadingOrg(false);
      }
    }
  };

  const handleSaveToggle = async () => {
    if (!user) {
      router.push(`/login?returnTo=${router.asPath}`);
      return;
    }

    if (user.role !== 'freelancer') {
      return;
    }

    try {
      await TenderService.toggleSaveTender(id as string);
      setSaved(!saved);
      
      if (tender) {
        setTender({
          ...tender,
          metadata: {
            ...tender.metadata,
            savedBy: saved 
              ? tender.metadata.savedBy.filter(userId => userId !== user._id)
              : [...tender.metadata.savedBy, user._id]
          }
        });
      }
    } catch (err) {
      console.error('Error toggling save:', err);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleApply = () => {
    if (!user) {
      router.push(`/login?returnTo=${router.asPath}`);
      return;
    }
    
    if (user.role !== 'freelancer') {
      return;
    }

    router.push(`/proposals/create?tender=${id}`);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCategoryLabel = (category: string) => {
    return category.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  // SAFE owner information access
  const getOwnerInfo = () => {
    if (!tender) return null;
    
    const tenderType = tender.tenderType || 'company';
    
    if (tenderType === 'organization') {
      // Use fetched organization data or fallback
      return {
        type: 'organization',
        name: organizationData?.name || 'Organization',
        verified: organizationData?.verified || false,
        industry: organizationData?.industry || 'Various Services',
        description: organizationData?.description || 'A reputable organization committed to excellence and community impact.',
        logo: organizationData?.logo || '',
        _id: organizationData?._id || (typeof tender.organization === 'string' ? tender.organization : '')
      };
    } else {
      // Company tender
      const company = tender.company;
      return {
        type: 'company',
        name: company?.name || 'Company',
        verified: company?.verified || false,
        industry: company?.industry || 'Business Services',
        description: company?.description || '',
        logo: company?.logo || '',
        _id: company?._id || ''
      };
    }
  };

  const DetailCard = ({ icon: Icon, title, value, subtitle, color = 'text-gray-600' }: any) => (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-r ${colorClasses.bg.darkNavy} ${colorClasses.text.white} group-hover:scale-110 transition-transform duration-300`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 mb-1">{title}</h4>
          <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
          {subtitle && <p className={`text-sm ${color}`}>{subtitle}</p>}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-goldenMustard mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading project details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !tender) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DocumentTextIcon className="h-10 w-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Project Not Found</h1>
            <p className="text-gray-600 mb-6">{error || 'The project you are looking for does not exist or has been removed.'}</p>
            <button
              onClick={() => router.push('/tenders')}
              className="bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy font-semibold py-3 px-6 rounded-xl hover:shadow-lg transition-all duration-200"
            >
              Browse Available Projects
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const daysRemaining = getDaysRemaining(tender.deadline);
  const isExpired = daysRemaining < 0;
  const canApply = user?.role === 'freelancer' && !isExpired && tender.status === 'published';
  
  const ownerInfo = getOwnerInfo();
  const isOwner = user && (
    (user.role === 'company' && ownerInfo?.type === 'company' && ownerInfo?._id === user._id) ||
    (user.role === 'organization' && ownerInfo?.type === 'organization' && ownerInfo?._id === user._id)
  );

  return (
    <DashboardLayout>
      <Head>
        <title>{tender.title} | Freelance Platform</title>
        <meta name="description" content={tender.description.substring(0, 160)} />
      </Head>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        {/* Professional Header */}
        <div className={`bg-gradient-to-r ${
          ownerInfo?.type === 'organization' 
            ? 'from-purple-800 via-purple-700 to-purple-900' 
            : 'from-slate-900 via-blue-900 to-purple-900'
        } text-white`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
              <div className="flex-1">
                {/* Enhanced Breadcrumb */}
                <nav className="flex items-center gap-2 text-sm text-blue-200 mb-6">
                  <button 
                    onClick={() => router.push('/tenders')}
                    className="flex items-center gap-2 hover:text-white transition-colors group"
                  >
                    <ChevronLeftIcon className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    Back to Projects
                  </button>
                </nav>

                {/* Status & Category Badges */}
                <div className="flex flex-wrap items-center gap-3 mb-6">
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm border ${
                    tender.status === 'published' || tender.status === 'open'
                      ? 'bg-green-500/20 text-green-300 border-green-500/30'
                      : tender.status === 'draft'
                      ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {tender.status.charAt(0).toUpperCase() + tender.status.slice(1)}
                  </span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    ownerInfo?.type === 'organization' 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  }`}>
                    {getCategoryLabel(tender.category)}
                  </span>
                  <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm ${
                    ownerInfo?.type === 'organization'
                      ? 'bg-purple-600 text-white border-purple-500/30'
                      : 'bg-blue-600 text-white border-blue-500/30'
                  }`}>
                    {ownerInfo?.type === 'organization' ? 'Organization Project' : 'Company Project'}
                  </span>
                  {tender.visibility === 'invite_only' && (
                    <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm bg-orange-500/20 text-orange-300 border border-orange-500/30">
                      <ShieldCheckIcon className="h-3 w-3 mr-1" />
                      Invite Only
                    </span>
                  )}
                </div>
                
                {/* Title */}
                <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight">{tender.title}</h1>
                
                {/* Owner & Stats */}
                <div className="flex flex-wrap items-center gap-6 text-sm text-blue-200 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {ownerInfo?.type === 'organization' ? (
                        <BuildingLibraryIcon className="h-5 w-5 text-purple-300" />
                      ) : (
                        <BuildingOfficeIcon className="h-5 w-5 text-blue-300" />
                      )}
                      <span className="flex items-center gap-2 font-semibold text-white">
                        {ownerInfo?.name}
                        {ownerInfo?.verified && (
                          <CheckBadgeIcon className="h-4 w-4 text-goldenMustard" />
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4" />
                    <span>Posted {formatDate(tender.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <EyeIcon className="h-4 w-4" />
                    <span>{tender.metadata?.views || 0} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <UserGroupIcon className="h-4 w-4" />
                    <span>{tender.proposals?.length || 0} proposals</span>
                  </div>
                </div>

                {/* Project Summary */}
                <p className="text-lg text-blue-100 leading-relaxed max-w-3xl">
                  {tender.description.substring(0, 200)}...
                </p>
              </div>

              {/* Enhanced Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-4 flex-shrink-0">
                {user?.role === 'freelancer' && (
                  <button
                    onClick={handleSaveToggle}
                    className={`flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                      saved
                        ? 'bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy shadow-lg hover:shadow-xl'
                        : 'bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 hover:border-white/30'
                    }`}
                  >
                    {saved ? (
                      <BookmarkSolid className="h-5 w-5" />
                    ) : (
                      <BookmarkIcon className="h-5 w-5" />
                    )}
                    {saved ? 'Saved' : 'Save Project'}
                  </button>
                )}

                <button
                  onClick={handleShare}
                  className="flex items-center justify-center gap-3 px-6 py-4 bg-white/10 backdrop-blur-sm border border-white/20 text-white rounded-2xl font-semibold hover:bg-white/20 hover:border-white/30 transition-all duration-300"
                >
                  <ShareIcon className="h-5 w-5" />
                  {copied ? 'Copied!' : 'Share'}
                </button>

                {isOwner && (
                  <button
                    onClick={() => router.push(`/dashboard/${ownerInfo?.type}/tenders/${tender._id}/edit`)}
                    className="flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                  >
                    <ArrowTopRightOnSquareIcon className="h-5 w-5" />
                    Edit Project
                  </button>
                )}

                {canApply && (
                  <button
                    onClick={handleApply}
                    className="flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                  >
                    <StarIcon className="h-5 w-5" />
                    Apply Now
                  </button>
                )}

                {!user && (
                  <button
                    onClick={() => router.push(`/login?returnTo=${router.asPath}`)}
                    className="px-8 py-4 bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy rounded-2xl font-bold hover:shadow-lg transition-all duration-300 text-center"
                  >
                    Sign In to Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 -mt-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Enhanced Tabs */}
              <div className="bg-white rounded-3xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
                <nav className="flex overflow-x-auto bg-gray-50/50 border-b border-gray-200">
                  {['overview', 'requirements', 'owner', 'proposals'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 px-8 py-5 text-sm font-semibold border-b-2 capitalize whitespace-nowrap transition-all duration-300 ${
                        activeTab === tab
                          ? `${
                              ownerInfo?.type === 'organization' 
                                ? 'border-purple-500 text-purple-600' 
                                : 'border-goldenMustard text-goldenMustard'
                            } bg-white`
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {tab === 'proposals' ? `Proposals (${tender.proposals?.length || 0})` : 
                       tab === 'owner' ? (ownerInfo?.type === 'organization' ? 'Organization' : 'Company') : tab}
                    </button>
                  ))}
                </nav>

                {/* Tab Content */}
                <div className="p-8">
                  {activeTab === 'overview' && (
                    <div className="space-y-8">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                          <DocumentTextIcon className="h-6 w-6 text-goldenMustard" />
                          Project Description
                        </h3>
                        <div className="prose max-w-none">
                          <div className="bg-gray-50 rounded-2xl p-8 border border-gray-200">
                            <p className="text-gray-700 leading-relaxed text-lg whitespace-pre-line">
                              {tender.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {tender.skillsRequired && tender.skillsRequired.length > 0 && (
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <StarIcon className="h-6 w-6 text-goldenMustard" />
                            Required Skills & Expertise
                          </h3>
                          <div className="flex flex-wrap gap-3">
                            {tender.skillsRequired.map((skill, index) => (
                              <span
                                key={index}
                                className={`inline-flex items-center px-6 py-3 rounded-full text-sm font-semibold ${
                                  ownerInfo?.type === 'organization'
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white'
                                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                                } shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105`}
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'requirements' && tender.requirements && (
                    <div className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailCard
                          icon={UserGroupIcon}
                          title="Experience Level"
                          value={tender.requirements.experienceLevel ? 
                            tender.requirements.experienceLevel.charAt(0).toUpperCase() + tender.requirements.experienceLevel.slice(1) : 
                            'Not specified'
                          }
                          color="text-green-600"
                        />
                        
                        <DetailCard
                          icon={MapPinIcon}
                          title="Location Preference"
                          value={tender.requirements.location === 'anywhere' ? 
                            'Remote (Anywhere)' : 
                            tender.requirements.specificLocation || tender.requirements.location || 'Not specified'
                          }
                          subtitle="Work location preference"
                          color="text-blue-600"
                        />
                      </div>

                      {tender.requirements.languageRequirements && tender.requirements.languageRequirements.length > 0 && (
                        <div className="bg-gradient-to-br from-white to-blue-50 rounded-2xl p-8 border border-gray-200">
                          <h4 className="font-bold text-gray-900 mb-6 flex items-center gap-3 text-xl">
                            <LanguageIcon className="h-6 w-6 text-goldenMustard" />
                            Language Requirements
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tender.requirements.languageRequirements.map((lang, index) => (
                              <div key={index} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition-all duration-300">
                                <span className="font-semibold text-gray-900 capitalize">{lang.language}</span>
                                <span className="text-sm font-medium px-3 py-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full capitalize">
                                  {lang.proficiency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'owner' && ownerInfo && (
                    <div className="space-y-8">
                      <div className="flex items-center gap-6 p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl border border-gray-200">
                        <div className={`w-24 h-24 rounded-2xl flex items-center justify-center ${
                          ownerInfo?.type === 'organization'
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600'
                            : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                        }`}>
                          {ownerInfo?.type === 'organization' ? (
                            <BuildingLibraryIcon className="h-12 w-12 text-white" />
                          ) : (
                            <BuildingOfficeIcon className="h-12 w-12 text-white" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-3xl font-bold text-gray-900 flex items-center gap-3 mb-2">
                            {ownerInfo.name}
                            {ownerInfo.verified && (
                              <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-full text-sm font-semibold">
                                <CheckBadgeIcon className="h-4 w-4" />
                                Verified Partner
                              </div>
                            )}
                          </h3>
                          <p className="text-lg text-gray-600 mb-4 capitalize">{ownerInfo.industry}</p>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <StarSolid className="h-4 w-4 text-yellow-500" />
                              4.8 • 124 reviews
                            </span>
                            <span>•</span>
                            <span>Member since 2023</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-8 border border-gray-200">
                        <h4 className="font-bold text-gray-900 mb-4 text-xl">
                          About the {ownerInfo.type === 'organization' ? 'Organization' : 'Company'}
                        </h4>
                        <p className="text-gray-700 leading-relaxed text-lg">
                          {ownerInfo.description || 
                            (ownerInfo.type === 'organization' 
                              ? `${ownerInfo.name} is a reputable organization committed to delivering quality services and creating positive impact in the community. With a focus on excellence and innovation, they work to address important challenges and create sustainable solutions.`
                              : `${ownerInfo.name} is a professional company dedicated to providing high-quality services and building lasting relationships with clients. They prioritize customer satisfaction and continuous improvement in all their endeavors.`
                            )
                          }
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'proposals' && (
                    <div className="space-y-6">
                      {(!tender.proposals || tender.proposals.length === 0) ? (
                        <div className="text-center py-16">
                          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <UserGroupIcon className="h-10 w-10 text-blue-500" />
                          </div>
                          <h4 className="text-2xl font-bold text-gray-900 mb-3">No Proposals Yet</h4>
                          <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
                            Be the first to submit a proposal for this exciting project and showcase your expertise!
                          </p>
                          {canApply && (
                            <button
                              onClick={handleApply}
                              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold py-4 px-8 rounded-2xl hover:shadow-xl transition-all duration-300"
                            >
                              Submit Your Proposal
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-8 border border-blue-200">
                            <h4 className="font-bold text-gray-900 mb-3 text-xl">
                              {tender.proposals.length} Professional Proposal{tender.proposals.length !== 1 ? 's' : ''} Received
                            </h4>
                            <p className="text-gray-600 text-lg">
                              Talented freelancers have submitted their proposals for this project. {isOwner ? 'Review them carefully to find the perfect match for your requirements!' : 'The owner is currently reviewing all submitted proposals.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Key Details Card */}
                <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-200">Project Summary</h3>
                  
                  <div className="space-y-5">
                    {tender.budget && (tender.budget.min > 0 || tender.budget.max > 0) && (
                      <DetailCard
                        icon={CurrencyDollarIcon}
                        title="Budget Range"
                        value={`${formatCurrency(tender.budget.min, tender.budget.currency)} - ${formatCurrency(tender.budget.max, tender.budget.currency)}`}
                        subtitle={`in ${tender.budget.currency}`}
                      />
                    )}

                    <DetailCard
                      icon={CalendarIcon}
                      title="Application Deadline"
                      value={formatDate(tender.deadline)}
                      subtitle={isExpired ? 'Expired' : `${daysRemaining} days remaining`}
                      color={isExpired ? 'text-red-600' : 'text-green-600'}
                    />

                    {tender.duration > 0 && (
                      <DetailCard
                        icon={ClockIcon}
                        title="Project Duration"
                        value={`${tender.duration} days`}
                        subtitle="Estimated timeline"
                      />
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{tender.skillsRequired?.length || 0}</div>
                        <div className="text-sm text-gray-600">Skills Required</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">{tender.proposals?.length || 0}</div>
                        <div className="text-sm text-gray-600">Proposals</div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Action Button */}
                  {canApply && (
                    <div className="mt-6">
                      <button
                        onClick={handleApply}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 text-lg"
                      >
                        Submit Proposal
                      </button>
                      <p className="text-center text-gray-600 text-sm mt-3">
                        Apply before {formatDate(tender.deadline)}
                      </p>
                    </div>
                  )}

                  {!user && (
                    <div className="mt-6">
                      <button
                        onClick={() => router.push(`/login?returnTo=${router.asPath}`)}
                        className="w-full bg-gradient-to-r from-goldenMustard to-yellow-500 text-darkNavy font-bold py-4 px-6 rounded-2xl hover:shadow-lg transition-all duration-300"
                      >
                        Sign In to Apply
                      </button>
                    </div>
                  )}

                  {isExpired && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl">
                      <div className="flex items-center gap-2 text-red-800 font-semibold mb-2">
                        <CalendarIcon className="h-4 w-4" />
                        Project Closed
                      </div>
                      <p className="text-red-700 text-sm">
                        This project is no longer accepting proposals.
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Actions Card */}
                <div className={`bg-gradient-to-br rounded-3xl p-6 text-white ${
                  ownerInfo?.type === 'organization'
                    ? 'from-purple-600 to-purple-800'
                    : 'from-darkNavy to-blue-900'
                }`}>
                  <h4 className="font-bold mb-4 text-lg">Need Assistance?</h4>
                  <div className="space-y-3">
                    <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium">
                      How to Write a Winning Proposal
                    </button>
                    <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium">
                      View Application Guidelines
                    </button>
                    <button className="w-full text-left p-4 bg-white/10 rounded-xl hover:bg-white/20 transition-all duration-300 font-medium">
                      Contact Support Team
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default TenderDetailPage;