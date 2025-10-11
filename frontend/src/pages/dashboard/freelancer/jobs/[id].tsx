/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import CandidateJobCard from '@/components/job/CandidateJobCard';
// import LoadingSpinner from '@/components/LoadingSpinner';
import Link from 'next/link';
import { 
  ArrowLeft, 
  MapPin, 
  Briefcase, 
  Eye, 
  Users, 
  CheckCircle, 
  Clock,
  Loader2,
  Star,
  Share2,
  Building2,
  Globe,
  GraduationCap,
  DollarSign,
  Calendar,
  Shield,
  Languages,
  Car,
  FileCheck
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const JobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user, isAuthenticated } = useAuth();
  
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applying, setApplying] = useState(false);

  // Fetch job details
  const { 
    data: job, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['job', id],
    queryFn: () => jobService.getJob(id as string),
    enabled: !!id,
  });

  // Fetch similar jobs (you'll need to implement this in your service)
  const { data: similarJobs } = useQuery({
    queryKey: ['similarJobs', id],
    queryFn: () => jobService.getJobs({ 
      category: job?.category,
      limit: 3,
      page: 1 
    }),
    enabled: !!id && !!job,
    select: (data) => data.data?.filter(j => j._id !== id).slice(0, 3) || []
  });

  // Fetch saved jobs to check if current job is saved
  const { data: savedJobs } = useQuery({
    queryKey: ['savedJobs'],
    queryFn: async () => {
      // Note: You'll need to implement getSavedJobs in your jobService
      // return await jobService.getSavedJobs();
      return [];
    },
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (savedJobs && job) {
      setIsSaved(savedJobs.some((savedJob: Job) => savedJob._id === job._id));
    }
  }, [savedJobs, job]);

  const handleSaveJob = async () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    setSaving(true);
    try {
      if (isSaved) {
        // Note: You'll need to implement unsaveJob in your jobService
        // await jobService.unsaveJob(id as string);
        setIsSaved(false);
        toast({
          title: 'Job removed',
          description: 'Job has been removed from your saved jobs',
        });
      } else {
        // Note: You'll need to implement saveJob in your jobService
        // await jobService.saveJob(id as string);
        setIsSaved(true);
        toast({
          title: 'Job saved',
          description: 'Job has been added to your saved jobs',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save job',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: job?.title,
          text: `Check out this job: ${job?.title} at ${job?.company.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: 'Link copied',
        description: 'Job link copied to clipboard',
      });
    }
  };

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    setShowApplicationForm(true);
  };

  const handleApplicationSubmit = async (applicationData: any) => {
    setApplying(true);
    try {
      // Note: You'll need to implement applyToJob in your jobService
      // await jobService.applyToJob(id as string, applicationData);
      setShowApplicationForm(false);
      toast({
        title: 'Application submitted',
        description: 'Your application has been submitted successfully',
      });
    } catch (error: any) {
      toast({
        title: 'Application failed',
        description: error.message || 'Failed to submit application',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const formatSalary = () => {
    return jobService.formatSalary(job?.salary);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-gray-50 py-8">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-full"></div>
                  <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
                <div className="space-y-4">
                  <div className="h-32 bg-gray-300 rounded"></div>
                  <div className="h-32 bg-gray-300 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="text-center bg-white p-8 rounded-2xl shadow-lg max-w-md border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="text-2xl">😕</div>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Job Not Found</h1>
            <p className="text-gray-600 mb-6">
              The job you`re looking for doesn`t exist or has been removed.
            </p>
            <Link href="/dashboard/candidate/jobs">
              <button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </button>
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isInternational = job.location.region === 'international';
  const isUrgent = job.urgent || (job.applicationDeadline && 
    new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/dashboard/candidate/jobs">
              <button className="border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded-lg transition-colors flex items-center">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Jobs
              </button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-200">
                {/* Header */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-3">
                      {job.featured && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                          ⭐ Featured
                        </span>
                      )}
                      {isUrgent && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                          🔥 Urgent Hiring
                        </span>
                      )}
                      {job.premium && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                          💎 Premium
                        </span>
                      )}
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900 mb-3">{job.title}</h1>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center">
                        {job.company.logoUrl ? (
                          <img 
                            src={job.company.logoUrl} 
                            alt={job.company.name}
                            className="w-12 h-12 rounded-lg object-cover border border-gray-200 mr-3"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center mr-3">
                            <Building2 className="w-6 h-6 text-white" />
                          </div>
                        )}
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{job.company.name}</p>
                          {job.company.verified && (
                            <span className="inline-flex items-center text-sm text-green-600">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Verified Company
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleSaveJob}
                      disabled={saving}
                      className={`p-3 rounded-lg border transition-colors ${
                        isSaved 
                          ? 'bg-yellow-50 border-yellow-200 text-yellow-600' 
                          : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-yellow-500 hover:border-yellow-200'
                      }`}
                    >
                      <Star className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={handleShare}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-colors"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Key Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center text-gray-700">
                    <MapPin className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">
                        {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                      </div>
                      {!isInternational && (
                        <div className="flex items-center text-sm text-gray-600 mt-1">
                          <Shield className="w-4 h-4 mr-1 text-green-600" />
                          Ethiopian Job
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <Briefcase className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">{jobService.getJobTypeLabel(job.type)}</div>
                      <div className="text-sm text-gray-600">{job.workArrangement}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <GraduationCap className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">{jobService.getExperienceLabel(job.experienceLevel)}</div>
                      <div className="text-sm text-gray-600">{jobService.getEducationLabel(job.educationLevel)}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center text-gray-700">
                    <DollarSign className="w-5 h-5 mr-3 text-blue-600" />
                    <div>
                      <div className="font-medium">{formatSalary()}</div>
                      {job.salary?.isNegotiable && (
                        <div className="text-sm text-gray-600">Negotiable</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-2" />
                      {job.viewCount || 0} views
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      {job.applicationCount || 0} applications
                    </span>
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Posted {formatDate(job.createdAt)}
                    </span>
                  </div>
                </div>

                {/* Application Deadline */}
                {job.applicationDeadline && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
                    <div className="flex items-center">
                      <Clock className="w-5 h-5 text-yellow-600 mr-3" />
                      <div>
                        <div className="font-medium text-yellow-800">Application Deadline</div>
                        <div className="text-yellow-700">
                          {formatDate(job.applicationDeadline)} 
                          {new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000 && (
                            <span className="ml-2 font-semibold">- Apply Soon!</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Job Description */}
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold text-gray-900 mb-4">Job Description</h2>
                  <div className="prose prose-lg text-gray-700">
                    <p>{job.description}</p>
                  </div>
                </div>

                {/* Responsibilities */}
                {job.responsibilities && job.responsibilities.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Key Responsibilities</h2>
                    <ul className="space-y-3">
                      {job.responsibilities.map((responsibility, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Requirements */}
                {job.requirements && job.requirements.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Requirements</h2>
                    <ul className="space-y-3">
                      {job.requirements.map((requirement, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Benefits */}
                {job.benefits && job.benefits.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Benefits & Perks</h2>
                    <ul className="space-y-3">
                      {job.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                          <span className="text-gray-700">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills */}
                {job.skills && job.skills.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Required Skills</h2>
                    <div className="flex flex-wrap gap-3">
                      {job.skills.map((skill, index) => (
                        <span 
                          key={index} 
                          className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg font-medium border border-blue-200"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ethiopian Requirements */}
                {!isInternational && job.ethiopianRequirements && (
                  <div className="mb-8">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-4">Additional Requirements</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {job.ethiopianRequirements.knowledgeOfLocalLanguages.length > 0 && (
                        <div>
                          <h3 className="font-medium text-gray-900 mb-2 flex items-center">
                            <Languages className="w-4 h-4 mr-2" />
                            Local Languages
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {job.ethiopianRequirements.knowledgeOfLocalLanguages.map((language, index) => (
                              <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                                {language}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      <div className="space-y-2">
                        {job.ethiopianRequirements.workPermitRequired && (
                          <div className="flex items-center text-gray-700">
                            <FileCheck className="w-4 h-4 text-green-500 mr-2" />
                            Work Permit Required
                          </div>
                        )}
                        {job.ethiopianRequirements.drivingLicense && (
                          <div className="flex items-center text-gray-700">
                            <Car className="w-4 h-4 text-green-500 mr-2" />
                            Driving License Required
                          </div>
                        )}
                        {job.ethiopianRequirements.governmentClearance && (
                          <div className="flex items-center text-gray-700">
                            <Shield className="w-4 h-4 text-green-500 mr-2" />
                            Government Clearance Required
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Apply Button */}
                <div className="mt-8 pt-8 border-t border-gray-200">
                  <button
                    onClick={handleApplyClick}
                    disabled={applying}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {applying ? (
                      <div className="flex items-center justify-center">
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Applying...
                      </div>
                    ) : (
                      'Apply for This Position'
                    )}
                  </button>
                </div>
              </div>

              {/* Similar Jobs */}
              {similarJobs && similarJobs.length > 0 && (
                <div className="mt-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Similar Jobs You Might Like</h2>
                  <div className="grid gap-6">
                    {similarJobs.map(similarJob => (
                      <CandidateJobCard 
                        key={similarJob._id} 
                        job={similarJob}
                        showActions={false}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Company Info */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {job.company.name}</h2>
                
                {job.company.industry && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Industry:</span>
                    <p className="text-gray-600">{job.company.industry}</p>
                  </div>
                )}
                
                {job.company.size && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">Company Size:</span>
                    <p className="text-gray-600">{job.company.size}</p>
                  </div>
                )}
                
                {job.company.description && (
                  <div className="mb-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{job.company.description}</p>
                  </div>
                )}
                
                {job.company.website && (
                  <a 
                    href={job.company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center font-medium text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    Visit Website
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Job Summary */}
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Job Type:</span>
                    <span className="font-medium text-gray-900">{jobService.getJobTypeLabel(job.type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium text-gray-900">
                      {job.location.city}, {jobService.getEthiopianRegions().find(r => r.slug === job.location.region)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience:</span>
                    <span className="font-medium text-gray-900">{jobService.getExperienceLabel(job.experienceLevel)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Education:</span>
                    <span className="font-medium text-gray-900">{jobService.getEducationLabel(job.educationLevel)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Salary:</span>
                    <span className="font-medium text-gray-900">{formatSalary()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Remote Work:</span>
                    <span className="font-medium text-gray-900">
                      {job.remote === 'remote' ? 'Yes' : job.remote === 'hybrid' ? 'Hybrid' : 'No'}
                    </span>
                  </div>
                  {job.applicationDeadline && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deadline:</span>
                      <span className="font-medium text-gray-900">{formatDate(job.applicationDeadline)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
                <h3 className="text-lg font-semibold mb-4">Ready to Apply?</h3>
                <p className="text-blue-100 mb-4 text-sm">
                  Make sure your profile is up to date before applying to increase your chances.
                </p>
                <div className="space-y-3">
                  {/* <button
                    onClick={handleApplyClick}
                    disabled={applying}
                    className="w-full py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    {applying ? 'Applying...' : 'Apply Now'}
                  </button> */}
                  <Link href="/dashboard/candidate/profile">
                    <button className="w-full py-3 border border-white text-white rounded-lg font-semibold hover:bg-blue-500 transition-colors">
                      Update Profile
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetailPage;