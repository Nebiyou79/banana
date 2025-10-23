/* eslint-disable @typescript-eslint/no-explicit-any */
// components/job/CandidateJobCard.tsx - COMPLETE FIXED VERSION
import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Job, jobService } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  MapPin, 
  Briefcase, 
  Calendar, 
  CheckCircle, 
  Clock,
  Building2,
  Eye,
  Users,
  Flag,
  BookOpen,
  GraduationCap,
  Globe,
  Shield,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
} from 'lucide-react';
import Image from 'next/image';

interface CandidateJobCardProps {
  job: Job;
  onSaveJob?: (jobId: string) => void;
  onUnsaveJob?: (jobId: string) => void;
  isSaved?: boolean;
  showActions?: boolean;
  className?: string;
}

const CandidateJobCard: React.FC<CandidateJobCardProps> = ({ 
  job, 
  onSaveJob, 
  onUnsaveJob, 
  isSaved = false,
  showActions = true,
  className = ''
}) => {
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [localIsSaved, setLocalIsSaved] = useState(isSaved);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const saveButtonRef = useRef<HTMLButtonElement>(null);

  // Sync local state with prop changes
  React.useEffect(() => {
    setLocalIsSaved(isSaved);
  }, [isSaved]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getLocationText = (location: Job['location']) => {
    if (location.region === 'international') return '🌍 Remote Worldwide';
    
    const city = location.city || location.region;
    const country = location.country === 'Ethiopia' ? 'ET' : location.country;
    return `${city}, ${country}`;
  };

  // Separate save and unsave handlers using jobService
  const handleSaveJob = useCallback(async (e: React.MouseEvent) => {
    // NUCLEAR EVENT PREVENTION
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    const requestId = `${job._id}-${Date.now()}-${Math.random()}`;
    console.log(`🚀 Save request ${requestId} initiated`);
    
    // Use window-level locking to prevent multiple requests
    if ((window as any).__currentSaveRequest) {
      console.log('🛑 Global save lock active, ignoring click');
      return;
    }
    
    // Set global lock
    (window as any).__currentSaveRequest = requestId;

    if (!isAuthenticated) {
      delete (window as any).__currentSaveRequest;
      toast({
        title: 'Authentication Required',
        description: 'Please log in to save jobs',
        variant: 'warning',
      });
      router.push('/login?redirect=' + encodeURIComponent(router.asPath));
      return;
    }

    console.log('💾 Save job clicked, current state:', localIsSaved);
    setSaving(true);

    try {
      // Use jobService.saveJob
      const result = await jobService.saveJob(job._id);
      console.log('📡 Server response received:', result);
      
      setLocalIsSaved(true);
      onSaveJob?.(job._id);
      toast({ 
        title: '💼 Job Saved', 
        description: 'Job has been added to your saved jobs',
        variant: 'success' 
      });
    } catch (error: any) {
      console.error('❌ Error saving job:', error);
      
      if (error.response?.status === 404) {
        toast({ 
          title: '❌ Feature Not Available', 
          description: 'Saving jobs is currently unavailable. Please try again later.',
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: '❌ Error saving job', 
          description: error.message || 'Please try again',
          variant: 'destructive' 
        });
      }
    } finally {
      setSaving(false);
      // Clear global lock after a short delay
      setTimeout(() => {
        if ((window as any).__currentSaveRequest === requestId) {
          delete (window as any).__currentSaveRequest;
        }
      }, 1000);
    }
  }, [job._id, localIsSaved, isAuthenticated, router, toast, onSaveJob]);

  const handleUnsaveJob = useCallback(async (e: React.MouseEvent) => {
    // NUCLEAR EVENT PREVENTION
    e.preventDefault();
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    
    const requestId = `${job._id}-${Date.now()}-${Math.random()}`;
    console.log(`🗑️ Unsave request ${requestId} initiated`);
    
    // Use window-level locking to prevent multiple requests
    if ((window as any).__currentSaveRequest) {
      console.log('🛑 Global save lock active, ignoring click');
      return;
    }
    
    // Set global lock
    (window as any).__currentSaveRequest = requestId;

    if (!isAuthenticated) {
      delete (window as any).__currentSaveRequest;
      return;
    }

    console.log('🗑️ Unsave job clicked, current state:', localIsSaved);
    setSaving(true);

    try {
      // Use jobService.unsaveJob
      const result = await jobService.unsaveJob(job._id);
      console.log('📡 Server response received:', result);
      
      setLocalIsSaved(false);
      onUnsaveJob?.(job._id);
      toast({ 
        title: '🗑️ Job Removed', 
        description: 'Job has been removed from your saved jobs',
        variant: 'default' 
      });
    } catch (error: any) {
      console.error('❌ Error unsaving job:', error);
      
      if (error.response?.status === 404) {
        toast({ 
          title: '❌ Feature Not Available', 
          description: 'Unsaving jobs is currently unavailable. Please try again later.',
          variant: 'destructive' 
        });
      } else {
        toast({ 
          title: '❌ Error removing job', 
          description: error.message || 'Please try again',
          variant: 'destructive' 
        });
      }
    } finally {
      setSaving(false);
      // Clear global lock after a short delay
      setTimeout(() => {
        if ((window as any).__currentSaveRequest === requestId) {
          delete (window as any).__currentSaveRequest;
        }
      }, 1000);
    }
  }, [job._id, localIsSaved, isAuthenticated, toast, onUnsaveJob]);

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

    setApplying(true);
    try {
      await router.push(`/dashboard/candidate/jobs/${job._id}?apply=true`);
    } catch (error) {
      console.error('Error applying to job:', error);
      toast({
        title: '❌ Application Error',
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
    const createdAt = new Date(job.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    return diffInHours < 24;
  })();

  const isEthiopianJob = job.location.region !== 'international';

  // Get company/organization info
  const ownerInfo = job.jobType === 'organization' ? job.organization : job.company;
  const ownerName = ownerInfo?.name || 'Unknown';
  const ownerVerified = ownerInfo?.verified || false;
  const ownerIndustry = ownerInfo?.industry;

  return (
    <div className={`p-6 rounded-2xl border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm bg-white/95 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {ownerInfo?.logoUrl ? (
            <div className="flex-shrink-0">
              <Image 
                src={ownerInfo.logoUrl} 
                alt={ownerName}
                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-100 transition-colors shadow-sm"
                width={56}
                height={56}
              />
            </div>
          ) : (
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
                  <Link 
                    href={`/dashboard/candidate/jobs/${job._id}`} 
                    className="hover:underline decoration-2 underline-offset-4"
                    onClick={(e) => e.stopPropagation()} // Prevent card click when clicking title
                  >
                    {job.title}
                  </Link>
                </h3>
                <div className="flex items-center space-x-3 flex-wrap">
                  <p className="text-gray-700 font-medium">{ownerName}</p>
                  {ownerVerified && (
                    <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </span>
                  )}
                  {ownerIndustry && (
                    <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                      {ownerIndustry}
                    </span>
                  )}
                  {job.jobType === 'organization' && (
                    <span className="text-xs text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                      {jobService.getJobTypeDisplayLabel(job)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end space-y-3 flex-shrink-0 ml-4">
          {showActions && (
            <button
              ref={saveButtonRef}
              onClick={localIsSaved ? handleUnsaveJob : handleSaveJob}
              disabled={saving}
              className={`p-2.5 rounded-xl transition-all duration-200 ${
                localIsSaved 
                  ? 'text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 shadow-sm' 
                  : 'text-gray-400 bg-gray-50 hover:bg-gray-100 hover:text-blue-500 border border-gray-200'
              } disabled:opacity-50 disabled:cursor-not-allowed group/save relative`}
              title={localIsSaved ? 'Remove from saved' : 'Save job'}
              // Add pointer-events control
              style={{ pointerEvents: saving ? 'none' : 'auto' }}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : localIsSaved ? (
                <BookmarkCheck className="w-5 h-5 fill-current text-blue-600" />
              ) : (
                <Bookmark className="w-5 h-5 group-hover/save:scale-110 transition-transform" />
              )}
            </button>
          )}
          <div className="flex flex-col items-end space-y-1">
            <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
              {formatDate(job.createdAt)}
            </span>
            {isNew && (
              <span className="text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200 font-medium">
                New
              </span>
            )}
          </div>
        </div>
      </div>
      
      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <Briefcase className="w-4 h-4 mr-1.5" />
          {jobService.getJobTypeLabel(job.type)}
        </span>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <BookOpen className="w-4 h-4 mr-1.5" />
          {jobService.getExperienceLabel(job.experienceLevel)}
        </span>
        {job.educationLevel && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 border border-indigo-200">
            <GraduationCap className="w-4 h-4 mr-1.5" />
            {jobService.getEducationLabel(job.educationLevel)}
          </span>
        )}
        {job.remote && job.remote !== 'on-site' && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Globe className="w-4 h-4 mr-1.5" />
            {job.remote === 'remote' ? '🌍 Remote' : '🏢 Hybrid'}
          </span>
        )}
        {isUrgent && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <Clock className="w-4 h-4 mr-1.5" />
            Urgent
          </span>
        )}
        {job.featured && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            ⭐ Featured
          </span>
        )}
        {isEthiopianJob && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Shield className="w-4 h-4 mr-1.5" />
            Ethiopian Job
          </span>
        )}
      </div>
      
      {/* Location and Salary */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          <span className="font-medium">{getLocationText(job.location)}</span>
          {isEthiopianJob && (
            <Flag className="w-4 h-4 ml-3 text-green-600" />
          )}
        </div>
        
        <div className="text-lg font-bold text-gray-900">
          {jobService.formatSalary(job.salary)}
        </div>
      </div>

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span 
                key={index} 
                className="bg-gray-50 text-gray-700 text-sm px-3 py-1.5 rounded-lg border border-gray-200 font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="text-sm text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
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
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <span className="flex items-center font-medium">
            <Eye className="w-4 h-4 mr-1.5" />
            {job.viewCount || job.views || 0} views
          </span>
          <span className="flex items-center font-medium">
            <Users className="w-4 h-4 mr-1.5" />
            {job.applicationCount || 0} applications
          </span>
        </div>
        
        <div className="flex space-x-3">
          <Link 
            href={`/dashboard/candidate/jobs/${job._id}`}
            className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold shadow-sm hover:shadow-md flex items-center gap-2"
            onClick={(e) => e.stopPropagation()} // Prevent card click
          >
            View Details
            <ExternalLink className="w-4 h-4" />
          </Link>
          {showActions && (
            <button 
              onClick={handleQuickApply}
              disabled={applying}
              className="px-6 py-3 text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center gap-2"
            >
              {applying ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Applying...
                </>
              ) : (
                'Quick Apply'
              )}
            </button>
          )}
        </div>
      </div>

      {/* Deadline Notice */}
      {job.applicationDeadline && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500 flex items-center font-medium">
              <Calendar className="w-4 h-4 mr-2" />
              Application deadline:
            </span>
            <span className="font-bold text-gray-700">
              {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateJobCard;