/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/jobs/[id].tsx
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { jobService, Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ApplicationForm from '@/components/application/ApplicationForm';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { ArrowLeft, Calendar, MapPin, Briefcase, Eye, Users, CheckCircle, Clock } from 'lucide-react';
import Button from '@/components/forms/Button';

const JobDetailPage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  useEffect(() => {
    if (id) {
      fetchJobDetails();
    }
  }, [id]);

  const fetchJobDetails = async () => {
    try {
      setLoading(true);
      const jobData = await jobService.getJob(id as string);
      setJob(jobData);
    } catch (error: any) {
      console.error('Failed to fetch job details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApplyClick = () => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }
    setShowApplicationForm(true);
  };

  const handleApplicationSuccess = () => {
    // Refresh the page to show application status
    fetchJobDetails();
    toast({
      title: 'Application Submitted!',
      description: 'Your application has been submitted successfully.',
    });
  };

  const formatSalary = () => {
    if (!job?.salary?.min && !job?.salary?.max) return 'Negotiable';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (job.salary?.min && job.salary?.max) {
      return `${formatter.format(job.salary.min)} - ${formatter.format(job.salary.max)} ${job.salary.period}`;
    } else if (job.salary?.min) {
      return `From ${formatter.format(job.salary.min)} ${job.salary.period}`;
    } else if (job.salary?.max) {
      return `Up to ${formatter.format(job.salary.max)} ${job.salary.period}`;
    }
    
    return 'Negotiable';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'full-time': 'Full Time',
      'part-time': 'Part Time',
      contract: 'Contract',
      internship: 'Internship',
      remote: 'Remote'
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-300 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-8"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-8"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!job) {
    return (
      <DashboardLayout requiredRole="candidate">
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-gray-800">Job Not Found</h1>
          <p className="text-gray-600 mt-2">The job you`re looking for doesn`t exist or has been removed.</p>
          <Link href="/dashboard/candidate/jobs">
            <Button className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Jobs
            </Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout requiredRole="candidate">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link href="/dashboard/candidate/jobs">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Jobs
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-800">{job.title}</h1>
                  <div className="flex items-center mt-2">
                    {job.company.logoUrl && (
                      <img 
                        src={job.company.logoUrl} 
                        alt={job.company.name}
                        className="w-12 h-12 rounded-full object-cover mr-3"
                      />
                    )}
                    <div>
                      <p className="text-lg font-semibold text-gray-700">{job.company.name}</p>
                      {job.company.verified && (
                        <span className="inline-flex items-center text-xs text-green-600">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Verified Company
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{formatSalary()}</p>
                  <p className="text-sm text-gray-600">Posted {formatDate(job.createdAt)}</p>
                  <div className="flex items-center justify-end space-x-4 text-sm text-gray-600 mt-1">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {job.views} views
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {job.applicationCount} applications
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span>{job.location}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <Briefcase className="w-5 h-5 mr-2" />
                  <span>{getJobTypeLabel(job.type)}</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  <span>{job.experienceLevel} level</span>
                </div>
                
                <div className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z" clipRule="evenodd" />
                  </svg>
                  <span>{job.remote ? 'Remote' : 'On-site'}</span>
                </div>
              </div>

              {job.applicationDeadline && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-6">
                  <div className="flex items-center">
                    <Clock className="w-5 h-5 text-yellow-600 mr-2" />
                    <span>Application deadline: {formatDate(job.applicationDeadline)}</span>
                  </div>
                </div>
              )}

              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Job Description</h2>
                <div className="prose text-gray-700">
                  <p>{job.description}</p>
                </div>
              </div>

              {job.responsibilities && job.responsibilities.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Responsibilities</h2>
                  <ul className="list-disc list-inside space-y-2">
                    {job.responsibilities.map((responsibility, index) => (
                      <li key={index} className="text-gray-700">{responsibility}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.requirements && job.requirements.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Requirements</h2>
                  <ul className="list-disc list-inside space-y-2">
                    {job.requirements.map((requirement, index) => (
                      <li key={index} className="text-gray-700">{requirement}</li>
                    ))}
                  </ul>
                </div>
              )}

              {job.skills && job.skills.length > 0 && (
                <div className="mb-6">
                  <h2 className="text-xl font-semibold mb-3">Skills Required</h2>
                  <div className="flex flex-wrap gap-2">
                    {job.skills.map((skill, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <Button
                  onClick={handleApplyClick}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-md font-semibold text-lg"
                >
                  Apply Now
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div>
            {/* Company info */}
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h2 className="text-xl font-semibold mb-4">About {job.company.name}</h2>
              {job.company.industry && (
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">Industry:</span> {job.company.industry}
                </p>
              )}
              {job.company.description && (
                <p className="text-gray-700 mb-4">{job.company.description}</p>
              )}
              {job.company.website && (
                <a 
                  href={job.company.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium"
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
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">Job Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Job Type:</span>
                  <span className="font-medium">{getJobTypeLabel(job.type)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Location:</span>
                  <span className="font-medium">{job.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Experience:</span>
                  <span className="font-medium">{job.experienceLevel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Salary:</span>
                  <span className="font-medium">{formatSalary()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Remote:</span>
                  <span className="font-medium">{job.remote ? 'Yes' : 'No'}</span>
                </div>
                {job.applicationDeadline && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Deadline:</span>
                    <span className="font-medium">{formatDate(job.applicationDeadline)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Application Form Modal */}
        {showApplicationForm && (
          <ApplicationForm
            jobId={job._id}
            jobTitle={job.title}
            companyName={job.company.name}
            onClose={() => setShowApplicationForm(false)}
            onSuccess={handleApplicationSuccess}
          />
        )}
      </div>
    </DashboardLayout>
  );
};

export default JobDetailPage;