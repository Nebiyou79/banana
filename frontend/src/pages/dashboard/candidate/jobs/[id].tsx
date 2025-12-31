/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jobService, Job } from '@/services/jobService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { 
  Building, 
  MapPin, 
  DollarSign, 
  Briefcase, 
  User, 
  Calendar,
  Shield,
  ArrowLeft,
  Bookmark,
  Share2,
  Eye,
  Users,
  CheckCircle,
  Send,
  Globe,
  Award,
  Heart,
  FileText,
  Target,
  ChevronRight,
  GraduationCap,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { colorClasses } from '@/utils/color';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

const JobDetailsPage = () => {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (router.isReady && id && typeof id === 'string') {
      fetchJobDetails();
      checkIfJobIsSaved();
    }
  }, [router.isReady, id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (typeof id === 'string') {
        const jobData = await jobService.getJob(id);
        setJob(jobData);
      }
    } catch (error) {
      console.error('Error fetching job details:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load job details. Please try again.';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const checkIfJobIsSaved = async () => {
    if (!user || !id) return;
    
    try {
      // You'll need to implement this endpoint to check if job is saved
      const savedJobs = await jobService.getSavedJobs();
      const isJobSaved = savedJobs.some((savedJob: any) => savedJob.jobId === id || savedJob._id === id);
      setIsSaved(isJobSaved);
    } catch (error) {
      console.error('Error checking saved status:', error);
    }
  };

  const handleSaveJob = async () => {
    if (!job || !user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      
      if (isSaved) {
        await jobService.unsaveJob(job._id);
        setIsSaved(false);
        toast({
          title: 'Job Unsaved',
          description: 'Job has been removed from your saved list',
          variant: 'default',
        });
      } else {
        await jobService.saveJob(job._id);
        setIsSaved(true);
        toast({
          title: 'Job Saved',
          description: 'Job has been added to your saved list',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error saving job:', error);
      toast({
        title: 'Error',
        description: 'Failed to save job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleApplyNow = () => {
    if (!job) return;
    
    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for this job',
        variant: 'destructive',
      });
      return;
    }
    
    setIsApplying(true);
    router.push(`/dashboard/candidate/apply/${job._id}`);
  };

  const handleShareJob = () => {
    if (!job) return;
    
    const jobUrl = `${window.location.origin}/jobs/${job._id}`;
    navigator.clipboard.writeText(jobUrl).then(() => {
      toast({
        title: 'Link Copied',
        description: 'Job link has been copied to clipboard',
        variant: 'default',
      });
    }).catch(() => {
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    });
  };

  const handleRetry = () => {
    fetchJobDetails();
  };

  // Helper functions
  const getLogoUrl = (job: Job) => {
    if (job.jobType === 'company' && job.company?.logoUrl) {
      return job.company.logoUrl;
    }
    if (job.jobType === 'organization' && job.organization?.logoUrl) {
      return job.organization.logoUrl;
    }
    return null;
  };

  const getOwnerDescription = (job: Job) => {
    if (job.jobType === 'company' && job.company?.description) {
      return job.company.description;
    }
    if (job.jobType === 'organization' && job.organization?.description) {
      return job.organization.description;
    }
    return null;
  };

  const getWebsite = (job: Job) => {
    if (job.jobType === 'company' && job.company?.website) {
      return job.company.website;
    }
    if (job.jobType === 'organization' && job.organization?.website) {
      return job.organization.website;
    }
    return null;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getDaysAgo = (dateString: string) => {
    const days = Math.floor((new Date().getTime() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days} days ago`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Loading Opportunity</h3>
            <p className="text-gray-600">Fetching job details...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !job) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto">
            <div className="bg-red-100 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <Building className="h-10 w-10 text-red-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {error ? 'Error Loading Job' : 'Job Not Found'}
            </h1>
            <p className="text-gray-600 mb-8 text-lg">
              {error ? error : 'The job you\'re looking for might have been removed or is no longer available.'}
            </p>
            <div className="flex gap-4 justify-center">
              <Button 
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg"
              >
                Try Again
              </Button>
              <Button 
                onClick={() => router.push('/dashboard/candidate/jobs')}
                variant="outline"
                className="font-semibold px-6 py-3 rounded-lg"
              >
                Browse Opportunities
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Calculate derived values
  const isDeadlinePassed = job.applicationDeadline && new Date(job.applicationDeadline) < new Date();
  const companyName = jobService.getOwnerName(job);
  const isVerified = job.company?.verified || job.organization?.verified;
  const locationText = job.location ? `${job.location.city}, ${job.location.region}` : 'Location not specified';
  const jobTypeLabel = jobService.getJobTypeLabel(job.type);
  const experienceLabel = jobService.getExperienceLabel(job.experienceLevel);
  const educationLabel = jobService.getEducationLabel(job.educationLevel);
  const logoUrl = getLogoUrl(job);
  const ownerDescription = getOwnerDescription(job);
  const website = getWebsite(job);
  const jobDisplayLabel = jobService.getJobTypeDisplayLabel(job);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-8">
            <div className="space-y-3">
              <Button
                variant="ghost"
                onClick={() => router.push('/dashboard/candidate/jobs')}
                className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-0"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Jobs
              </Button>
              <h1 className="text-3xl font-bold text-gray-900">{job.title}</h1>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  {logoUrl ? (
                    <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border">
                      <Image
                        src={logoUrl}
                        alt={companyName}
                        width={32}
                        height={32}
                        className="rounded-md object-contain"
                      />
                    </div>
                  ) : (
                    <Building className="h-5 w-5 text-gray-500" />
                  )}
                  <span className="font-semibold text-gray-700">{companyName}</span>
                  {isVerified && (
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">{jobDisplayLabel}</span>
                <span className="text-gray-400">•</span>
                <span className="text-gray-600">Posted {getDaysAgo(job.createdAt)}</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={handleSaveJob}
                disabled={saving}
                className="border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? 'fill-blue-600 text-blue-600' : ''}`} />
                {saving ? 'Saving...' : isSaved ? 'Saved' : 'Save Job'}
              </Button>
              <Button
                variant="outline"
                onClick={handleShareJob}
                className="border-gray-300 hover:border-blue-500 text-gray-700 hover:text-blue-600"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">{job.viewCount || 0}</div>
                <div className="text-gray-600 flex items-center justify-center gap-1">
                  <Eye className="w-4 h-4" /> Total Views
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">{job.applicationCount || 0}</div>
                <div className="text-gray-600 flex items-center justify-center gap-1">
                  <Users className="w-4 h-4" /> Applications
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {job.remote === 'remote' ? 'Remote' : job.remote === 'hybrid' ? 'Hybrid' : 'On-site'}
                </div>
                <div className="text-gray-600 flex items-center justify-center gap-1">
                  <MapPin className="w-4 h-4" /> Work Type
                </div>
              </CardContent>
            </Card>
            <Card className="border border-gray-200 shadow-sm">
              <CardContent className="pt-6 text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  {jobService.getJobTypeLabel(job.type)}
                </div>
                <div className="text-gray-600 flex items-center justify-center gap-1">
                  <Briefcase className="w-4 h-4" /> Job Type
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Job Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick Apply Card */}
              <Card className="border border-blue-200 shadow-lg bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">Ready to apply?</h3>
                      <p className="text-gray-600">
                        This position matches your profile. Don`t miss this opportunity!
                      </p>
                      {job.applicationDeadline && !isDeadlinePassed && (
                        <p className="text-sm text-gray-500 mt-2">
                          Apply before {formatDate(job.applicationDeadline)}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleApplyNow}
                      disabled={isDeadlinePassed || isApplying}
                      className={`text-lg py-3 px-8 min-w-[200px] ${
                        isDeadlinePassed 
                          ? 'bg-gray-400 cursor-not-allowed' 
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                      }`}
                    >
                      {isApplying ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Preparing...</span>
                        </div>
                      ) : isDeadlinePassed ? (
                        'Application Closed'
                      ) : (
                        <div className="flex items-center gap-2">
                          <Send className="h-5 w-5" />
                          <span>Apply Now</span>
                        </div>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Job Description */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Job Description
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="prose prose-lg max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{job.description}</p>
                  </div>
                  {job.shortDescription && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        Quick Overview
                      </h4>
                      <p className="text-blue-800">{job.shortDescription}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Requirements & Responsibilities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Requirements */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      Requirements
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.requirements?.map((requirement, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{requirement}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                {/* Responsibilities */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      Responsibilities
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <ul className="space-y-3">
                      {job.responsibilities?.map((responsibility, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Target className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 leading-relaxed">{responsibility}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              {/* Skills & Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Skills */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-purple-600" />
                      Required Skills
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap gap-2">
                      {job.skills?.map((skill, index) => (
                        <Badge 
                          key={index} 
                          variant="secondary" 
                          className="bg-purple-50 text-purple-700 border-purple-200 px-3 py-1.5 text-sm font-medium"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Benefits */}
                <Card className="border border-gray-200 shadow-sm">
                  <CardHeader className="pb-4 border-b border-gray-200">
                    <CardTitle className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      Benefits & Compensation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    {job.salary && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-200">
                        <h4 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          Salary Range
                        </h4>
                        <p className="text-green-800 font-semibold text-lg">
                          {jobService.formatSalary(job.salary)}
                        </p>
                      </div>
                    )}
                    
                    {job.benefits && job.benefits.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Benefits Package</h4>
                        <ul className="space-y-2">
                          {job.benefits.map((benefit, index) => (
                            <li key={index} className="flex items-center gap-3">
                              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                              <span className="text-gray-700">{benefit}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Right Column - Company Info & Details */}
            <div className="space-y-6">
              {/* Company/Organization Info */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5 text-gray-600" />
                    {job.jobType === 'company' ? 'Company' : 'Organization'} Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="text-center">
                    {logoUrl ? (
                      <div className="w-20 h-20 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 p-2 shadow-lg border">
                        <Image
                          src={logoUrl}
                          alt={companyName}
                          width={80}
                          height={80}
                          className="rounded-lg object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                        <Building className="h-10 w-10 text-white" />
                      </div>
                    )}
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{companyName}</h3>
                    <p className="text-gray-600 text-sm mb-4">
                      {job.company?.industry || job.organization?.organizationType || 'Industry not specified'}
                    </p>
                    
                    {ownerDescription && (
                      <div className="text-left mb-4">
                        <p className="text-gray-700 text-sm leading-relaxed">{ownerDescription}</p>
                      </div>
                    )}
                    
                    <div className="space-y-3 text-sm">
                      {website && (
                        <Button
                          variant="outline"
                          className="w-full border-blue-200 text-blue-700 hover:bg-blue-50"
                          onClick={() => window.open(website, '_blank')}
                        >
                          <Globe className="h-4 w-4 mr-2" />
                          Visit Website
                        </Button>
                      )}
                      {isVerified && (
                        <div className="text-green-600 flex items-center gap-2 justify-center">
                          <Shield className="h-4 w-4" />
                          <span>Verified Organization</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Job Details */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle>Job Details</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Location
                      </span>
                      <span className="font-semibold text-gray-900">{locationText}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Job Type
                      </span>
                      <span className="font-semibold text-gray-900">{jobTypeLabel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Experience
                      </span>
                      <span className="font-semibold text-gray-900">{experienceLabel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <GraduationCap className="h-4 w-4" />
                        Education
                      </span>
                      <span className="font-semibold text-gray-900">{educationLabel}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Remote
                      </span>
                      <span className="font-semibold text-gray-900 capitalize">{job.remote}</span>
                    </div>
                    {job.applicationDeadline && (
                      <div className="flex justify-between items-center py-2">
                        <span className="text-gray-600 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Deadline
                        </span>
                        <span className={`font-semibold ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                          {formatDate(job.applicationDeadline)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Similar Jobs */}
              <Card className="border border-gray-200 shadow-sm">
                <CardHeader className="pb-4 border-b border-gray-200">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-orange-600" />
                    Similar Opportunities
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="text-center text-gray-500 text-sm py-4">
                      <p>Explore more opportunities in this field</p>
                      <Button
                        variant="ghost"
                        className="mt-2 text-blue-600 hover:text-blue-700"
                        onClick={() => router.push('/dashboard/candidate/jobs')}
                      >
                        Browse All Jobs
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default JobDetailsPage;