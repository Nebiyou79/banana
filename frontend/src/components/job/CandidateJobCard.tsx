/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Job, jobService } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/Button';
import { 
  MapPin, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock,
  Building2,
  Eye,
  Users,
  Bookmark,
  BookmarkCheck,
  FileCheck,
  ExternalLink,
  User,
  Hash
} from 'lucide-react';
import Image from 'next/image';

interface CandidateJobCardProps {
  job: Job;
  onSaveJob?: (jobId: string) => void;
  onUnsaveJob?: (jobId: string) => void;
  isSaved?: boolean;
  showActions?: boolean;
  className?: string;
  userApplications?: any[];
}

const CandidateJobCard: React.FC<CandidateJobCardProps> = ({ 
  job, 
  onSaveJob, 
  onUnsaveJob, 
  isSaved = false,
  showActions = true,
  className = '',
  userApplications = []
}) => {
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const hasApplied = userApplications.some(app => app.job?._id === job._id);
  const userApplication = userApplications.find(app => app.job?._id === job._id);

  React.useEffect(() => {
    setLocalIsSaved(isSaved);
  }, [isSaved]);

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getLocationText = (location: Job['location']) => {
    if (!location) return 'Location not specified';
    if (location.region === 'international') return '🌍 Remote Worldwide';
    
    const city = location.city || location.region;
    const country = location.country === 'Ethiopia' ? 'ET' : location.country;
    return `${city}, ${country}`;
  };

  const getDemographicInfo = () => {
    if (!job.demographicRequirements) return null;
    
    const { sex, age } = job.demographicRequirements;
    const info = [];
    
    if (sex && sex !== 'any') {
      info.push(jobService.getSexRequirementLabel(sex));
    }
    
    if (age && (age.min || age.max)) {
      info.push(jobService.formatAgeRequirement(job.demographicRequirements));
    }
    
    return info.length > 0 ? info.join(' • ') : null;
  };

  const handleSaveJob = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs',
        variant: 'warning',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    setSaving(true);
    try {
      await jobService.saveJob(job._id);
      setLocalIsSaved(true);
      onSaveJob?.(job._id);
      toast({ 
        title: 'Job Saved', 
        description: 'Job has been added to your saved jobs',
        variant: 'success' 
      });
    } catch (error: any) {
      console.error('Error saving job:', error);
      toast({ 
        title: 'Error saving job', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  }, [job._id, isAuthenticated, router, toast, onSaveJob]);

  const handleUnsaveJob = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) return;

    setSaving(true);
    try {
      await jobService.unsaveJob(job._id);
      setLocalIsSaved(false);
      onUnsaveJob?.(job._id);
      toast({ 
        title: 'Job Removed', 
        description: 'Job has been removed from your saved jobs',
        variant: 'default' 
      });
    } catch (error: any) {
      console.error('Error unsaving job:', error);
      toast({ 
        title: 'Error removing job', 
        description: error.message || 'Please try again',
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  }, [job._id, isAuthenticated, toast, onUnsaveJob]);

  const handleQuickApply = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: 'Authentication Required',
        description: 'Please log in to apply for jobs',
        variant: 'warning',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    if (hasApplied) {
      router.push(`/dashboard/candidate/applications/${userApplication?._id}`);
      return;
    }

    setApplying(true);
    try {
      await router.push(`/dashboard/candidate/apply/${job._id}`);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: 'Application Error',
        description: 'Failed to apply to job. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setApplying(false);
    }
  };

  const isUrgent = job.urgent || (job.applicationDeadline && 
    new Date(job.applicationDeadline).getTime() - Date.now() < 3 * 24 * 60 * 60 * 1000);

  const isNew = (() => {
    if (!job.createdAt) return false;
    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  })();

  const isEthiopianJob = job.location?.region !== 'international';
  const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
  const ownerName = ownerInfo?.name || 'Unknown';
  const ownerVerified = ownerInfo?.verified || false;
  const demographicInfo = getDemographicInfo();

  return (
    <div className={`group bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 p-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {ownerInfo?.logoUrl ? (
            <Image 
              src={ownerInfo.logoUrl} 
              alt={ownerName}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              width={48}
              height={48}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  <Link 
                    href={`/dashboard/candidate/jobs/${job._id}`} 
                    className="hover:underline"
                  >
                    {job.title}
                  </Link>
                </h3>
                <div className="flex items-center space-x-2 flex-wrap">
                  <p className="text-sm text-gray-700 font-medium">{ownerName}</p>
                  {ownerVerified && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {job.jobNumber && (
                    <span className="inline-flex items-center text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                      <Hash className="w-3 h-3 mr-1" />
                      {job.jobNumber}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-2 ml-4">
          {showActions && (
            <Button
              onClick={localIsSaved ? handleUnsaveJob : handleSaveJob}
              disabled={saving}
              variant="outline"
              size="sm"
              className={`p-2 ${localIsSaved ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : localIsSaved ? (
                <BookmarkCheck className="w-4 h-4 fill-current" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </Button>
          )}
          <span className="text-xs text-gray-500">{formatDate(job.createdAt)}</span>
          {isNew && (
            <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full font-medium">
              New
            </span>
          )}
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <Briefcase className="w-3 h-3 mr-1" />
          {jobService.getJobTypeLabel(job.type)}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          {jobService.getExperienceLabel(job.experienceLevel)}
        </span>
        {job.remote !== 'on-site' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {job.remote === 'remote' ? '🌍 Remote' : '🏢 Hybrid'}
          </span>
        )}
        {isUrgent && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </span>
        )}
        {hasApplied && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            <FileCheck className="w-3 h-3 mr-1" />
            Applied
          </span>
        )}
      </div>
      
      {/* Location and Salary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span>{getLocationText(job.location)}</span>
        </div>
        <div className="text-sm font-semibold text-gray-900">
          {jobService.formatSalary(job.salary)}
        </div>
      </div>

      {/* Demographic Requirements */}
      {demographicInfo && (
        <div className="mb-4">
          <div className="flex items-center text-sm text-gray-600 mb-1">
            <User className="w-4 h-4 mr-2" />
            <span className="font-medium">Requirements:</span>
          </div>
          <p className="text-sm text-gray-700 bg-blue-50 p-2 rounded-lg">
            {demographicInfo}
          </p>
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span 
                key={index} 
                className="bg-gray-50 text-gray-700 text-sm px-2 py-1 rounded-md border border-gray-200"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-sm text-gray-500 bg-gray-50 px-2 py-1 rounded-md">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
        </div>
      )}

      {/* Short Description */}
      {job.shortDescription && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
            {job.shortDescription}
          </p>
        </div>
      )}
      
      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span className="flex items-center">
            <Eye className="w-4 h-4 mr-1" />
            {job.viewCount || 0}
          </span>
          <span className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            {job.applicationCount || 0}
          </span>
        </div>
        
        <div className="flex space-x-2">
          <Link 
            href={`/dashboard/candidate/jobs/${job._id}`}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            View Details
            <ExternalLink className="w-4 h-4" />
          </Link>
          {showActions && (
            <Button 
              onClick={handleQuickApply}
              disabled={applying}
              size="sm"
              variant={hasApplied ? "outline" : "primary"}
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2"></div>
                  Applying...
                </>
              ) : hasApplied ? (
                'View Application'
              ) : (
                'Quick Apply'
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Deadline Notice */}
      {job.applicationDeadline && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              Application deadline:
            </span>
            <span className="font-medium text-gray-700">
              {new Date(job.applicationDeadline).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateJobCard;