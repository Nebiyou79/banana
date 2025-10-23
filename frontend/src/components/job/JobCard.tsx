// components/JobCard.tsx
import React from 'react';
import Link from 'next/link';
import { Job, jobService } from '@/services/jobService';
import { 
  MapPin, 
  Briefcase, 
  Eye, 
  Users, 
  CheckCircle, 
  Clock,
  Edit3,
  Trash2,
  BarChart3,
  Calendar,
  Building2,
  Globe,
  Shield,
  AlertCircle,
  Play,
  Pause,
  Heart,
  Star
} from 'lucide-react';
import Image from 'next/image';

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  onDelete?: (jobId: string) => void;
  onViewStats?: (jobId: string) => void;
  onToggleStatus?: (jobId: string, newStatus: "draft" | "active" | "paused" | "closed" | "archived") => void;
  isOrganizationView?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  showActions = false, 
  onDelete,
  onViewStats,
  onToggleStatus,
  isOrganizationView = false
}) => {
  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getStatusConfig = (status: string) => {
    const config = {
      draft: { color: 'bg-gray-100 text-gray-800 border-gray-300', label: 'Draft', icon: '📝' },
      active: { color: 'bg-green-100 text-green-800 border-green-300', label: 'Active', icon: '✅' },
      paused: { color: 'bg-orange-100 text-orange-800 border-orange-300', label: 'Paused', icon: '⏸️' },
      closed: { color: 'bg-red-100 text-red-800 border-red-300', label: 'Closed', icon: '❌' },
      archived: { color: 'bg-purple-100 text-purple-800 border-purple-300', label: 'Archived', icon: '📁' }
    };
    return config[status as keyof typeof config] || config.draft;
  };

  const getLocationText = (location: Job['location']) => {
    if (location.region === 'international') return '🌍 Remote Worldwide';
    
    const city = location.city || location.region;
    const country = location.country === 'Ethiopia' ? 'ET' : location.country;
    return `${city}, ${country}`;
  };

  const handleStatusToggle = () => {
    if (onToggleStatus) {
      const newStatus = job.status === 'active' ? 'paused' : 'active';
      onToggleStatus(job._id, newStatus);
    }
  };

  const getOwnerInfo = () => {
    if (job.jobType === 'organization' && job.organization) {
      return {
        name: job.organization.name,
        logo: job.organization.logoUrl || job.organization.logoFullUrl,
        verified: job.organization.verified,
        type: 'Organization',
        industry: job.organization.industry,
        description: job.organization.description
      };
    } else if (job.jobType === 'company' && job.company) {
      return {
        name: job.company.name,
        logo: job.company.logoUrl,
        verified: job.company.verified,
        type: 'Company',
        industry: job.company.industry,
        description: job.company.description
      };
    }
    return {
      name: 'Unknown',
      logo: undefined,
      verified: false,
      type: 'Unknown',
      industry: undefined,
      description: undefined
    };
  };

  const getOpportunityTypeBadge = () => {
    if (job.jobType !== 'organization') return null;
    
    const opportunityTypes: Record<string, { label: string, color: string }> = {
      'volunteer': { label: 'Volunteer', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      'internship': { label: 'Internship', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'fellowship': { label: 'Fellowship', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
      'training': { label: 'Training', color: 'bg-cyan-100 text-cyan-800 border-cyan-200' },
      'grant': { label: 'Grant', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      'other': { label: 'Opportunity', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      'job': { label: 'Job', color: 'bg-green-100 text-green-800 border-green-200' }
    };
    
    const type = job.opportunityType || 'job';
    return opportunityTypes[type] || opportunityTypes.other;
  };

  const getDurationText = () => {
    if (!job.duration || job.duration.isOngoing) return 'Ongoing';
    if (job.duration.value && job.duration.unit) {
      return `${job.duration.value} ${job.duration.unit}`;
    }
    return 'Duration not specified';
  };

  const ownerInfo = getOwnerInfo();
  const statusConfig = getStatusConfig(job.status);
  const isEthiopianJob = job.location.region !== 'international';
  const opportunityTypeBadge = getOpportunityTypeBadge();
  const jobTypeLabel = jobService.getJobTypeDisplayLabel(job);

  // Determine the correct edit and view URLs based on job type and view context
  const getEditUrl = () => {
    if (isOrganizationView) {
      return `/dashboard/organization/jobs/edit/${job._id}`;
    }
    return job.jobType === 'organization' 
      ? `/dashboard/organization/jobs/edit/${job._id}`
      : `/dashboard/company/jobs/edit/${job._id}`;
  };

  const getViewUrl = () => {
    if (isOrganizationView) {
      return `/dashboard/organization/jobs/${job._id}`;
    }
    return job.jobType === 'organization' 
      ? `/dashboard/organization/jobs/${job._id}`
      : `/dashboard/company/jobs/${job._id}`;
  };

  return (
    <div className="rounded-2xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-xl transition-all duration-300 group backdrop-blur-sm bg-white/95">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {ownerInfo.logo ? (
            <div className="flex-shrink-0">
              <Image 
                src={ownerInfo.logo} 
                alt={ownerInfo.name}
                className="w-14 h-14 rounded-xl object-cover border-2 border-gray-100 group-hover:border-blue-100 transition-colors shadow-sm"
                width={56}
                height={56}
              />
            </div>
          ) : (
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              job.jobType === 'organization' 
                ? 'bg-gradient-to-br from-purple-500 to-purple-600' 
                : 'bg-gradient-to-br from-blue-500 to-blue-600'
            }`}>
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  <Link href={getViewUrl()} className="hover:underline decoration-2 underline-offset-4">
                    {job.title}
                  </Link>
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm font-medium text-gray-700">{jobTypeLabel}</span>
                  {opportunityTypeBadge && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${opportunityTypeBadge.color}`}>
                      {opportunityTypeBadge.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                <span className="text-sm text-gray-500 font-medium">{getTimeAgo(job.createdAt)}</span>
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${statusConfig.color}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-wrap">
              <p className="text-gray-700 font-medium">{ownerInfo.name}</p>
              {ownerInfo.verified && (
                <span className="inline-flex items-center text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full border border-green-200">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified
                </span>
              )}
              <span className={`inline-flex items-center text-xs px-2.5 py-1 rounded-full border ${
                job.jobType === 'organization'
                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                  : 'bg-blue-50 text-blue-700 border-blue-200'
              }`}>
                {ownerInfo.type}
              </span>
              {ownerInfo.industry && (
                <span className="text-xs text-gray-600 bg-gray-50 px-2.5 py-1 rounded-full border border-gray-200">
                  {ownerInfo.industry}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200">
          <MapPin className="w-4 h-4 mr-1.5" />
          {getLocationText(job.location)}
        </span>
        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-100 text-purple-800 border border-purple-200">
          <Briefcase className="w-4 h-4 mr-1.5" />
          {jobService.getJobTypeLabel(job.type)}
        </span>
        {job.remote && job.remote !== 'on-site' && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 border border-green-200">
            <Globe className="w-4 h-4 mr-1.5" />
            {job.remote === 'remote' ? '🌍 Remote' : '🏢 Hybrid'}
          </span>
        )}
        {isEthiopianJob && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-amber-100 text-amber-800 border border-amber-200">
            <Shield className="w-4 h-4 mr-1.5" />
            Ethiopian Job
          </span>
        )}
        {job.jobType === 'organization' && job.duration && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-cyan-100 text-cyan-800 border border-cyan-200">
            <Clock className="w-4 h-4 mr-1.5" />
            {getDurationText()}
          </span>
        )}
        {job.featured && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
            <Star className="w-4 h-4 mr-1.5" />
            Featured
          </span>
        )}
        {job.urgent && (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border border-red-200">
            <AlertCircle className="w-4 h-4 mr-1.5" />
            Urgent
          </span>
        )}
      </div>

      {/* Salary/Stipend Information */}
      {job.salary && job.salary.isPublic && (
        <div className="mb-4">
          <div className="text-lg font-bold text-green-600">
            {jobService.formatSalary(job.salary)}
          </div>
          {job.salary.isNegotiable && (
            <span className="text-sm text-gray-500">(Negotiable)</span>
          )}
        </div>
      )}

      {/* Volunteer Information */}
      {job.jobType === 'organization' && job.volunteerInfo && (
        <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center space-x-4 text-sm">
            {job.volunteerInfo.hoursPerWeek && (
              <span className="flex items-center text-purple-700">
                <Clock className="w-4 h-4 mr-1" />
                {job.volunteerInfo.hoursPerWeek} hrs/week
              </span>
            )}
            {job.volunteerInfo.commitmentLevel && (
              <span className="text-purple-700 capitalize">
                {job.volunteerInfo.commitmentLevel} commitment
              </span>
            )}
            {job.volunteerInfo.providesAccommodation && (
              <span className="flex items-center text-purple-700">
                <Building2 className="w-4 h-4 mr-1" />
                Accommodation
              </span>
            )}
            {job.volunteerInfo.providesStipend && (
              <span className="flex items-center text-purple-700">
                <Heart className="w-4 h-4 mr-1" />
                Stipend provided
              </span>
            )}
          </div>
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-50 text-gray-700 border border-gray-200 font-medium"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-600">
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
          {job.applicationDeadline && (
            <span className="flex items-center font-medium">
              <Calendar className="w-4 h-4 mr-1.5" />
              {new Date(job.applicationDeadline).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
              })}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showActions ? (
            <>
              <button
                onClick={() => onViewStats?.(job._id)}
                className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 border border-transparent hover:border-blue-200"
                title="View Statistics"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              {(job.status === 'active' || job.status === 'paused') && (
                <button
                  onClick={handleStatusToggle}
                  className={`p-2.5 rounded-xl transition-all duration-200 border ${
                    job.status === 'active' 
                      ? 'text-orange-400 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200' 
                      : 'text-green-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200'
                  }`}
                  title={job.status === 'active' ? 'Pause Job' : 'Activate Job'}
                >
                  {job.status === 'active' ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                </button>
              )}
              <Link
                href={getEditUrl()}
                className="p-2.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all duration-200 border border-transparent hover:border-green-200"
                title="Edit Job"
              >
                <Edit3 className="w-5 h-5" />
              </Link>
              <button
                onClick={() => onDelete?.(job._id)}
                className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                title="Delete Job"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </>
          ) : (
            <Link
              href={getViewUrl()}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md text-sm flex items-center gap-2"
            >
              View Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobCard;