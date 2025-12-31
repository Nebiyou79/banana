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
  User,
  Hash
} from 'lucide-react';
import Image from 'next/image';

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  onEdit?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  onViewStats?: (jobId: string) => void;
  onViewApplications?: (jobId: string) => void;
  onToggleStatus?: (jobId: string, newStatus: "draft" | "active" | "paused" | "closed" | "archived") => void;
  isOrganizationView?: boolean;
}

const JobCard: React.FC<JobCardProps> = ({ 
  job, 
  showActions = false, 
  onEdit,
  onDelete,
  onViewStats,
  onViewApplications,
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
      draft: { color: 'bg-gray-100 text-gray-800', label: 'Draft', icon: '📝' },
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: '✅' },
      paused: { color: 'bg-orange-100 text-orange-800', label: 'Paused', icon: '⏸️' },
      closed: { color: 'bg-red-100 text-red-800', label: 'Closed', icon: '❌' },
      archived: { color: 'bg-purple-100 text-purple-800', label: 'Archived', icon: '📁' }
    };
    return config[status as keyof typeof config] || config.draft;
  };

  const getLocationText = (location: Job['location']) => {
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
        type: 'Organization'
      };
    } else if (job.jobType === 'company' && job.company) {
      return {
        name: job.company.name,
        logo: job.company.logoUrl,
        verified: job.company.verified,
        type: 'Company'
      };
    }
    return {
      name: 'Unknown',
      logo: undefined,
      verified: false,
      type: 'Unknown'
    };
  };

  const getOpportunityTypeBadge = () => {
    if (job.jobType !== 'organization') return null;
    
    const opportunityTypes: Record<string, { label: string, color: string }> = {
      'volunteer': { label: 'Volunteer', color: 'bg-purple-100 text-purple-800' },
      'internship': { label: 'Internship', color: 'bg-blue-100 text-blue-800' },
      'fellowship': { label: 'Fellowship', color: 'bg-indigo-100 text-indigo-800' },
      'training': { label: 'Training', color: 'bg-cyan-100 text-cyan-800' },
      'grant': { label: 'Grant', color: 'bg-emerald-100 text-emerald-800' },
      'other': { label: 'Opportunity', color: 'bg-gray-100 text-gray-800' },
      'job': { label: 'Job', color: 'bg-green-100 text-green-800' }
    };
    
    const type = job.opportunityType || 'job';
    return opportunityTypes[type] || opportunityTypes.other;
  };

  const ownerInfo = getOwnerInfo();
  const statusConfig = getStatusConfig(job.status);
  const opportunityTypeBadge = getOpportunityTypeBadge();
  const jobTypeLabel = jobService.getJobTypeDisplayLabel(job);
  const demographicInfo = getDemographicInfo();

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
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-lg transition-all duration-300 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4 flex-1 min-w-0">
          {ownerInfo.logo ? (
            <Image 
              src={ownerInfo.logo} 
              alt={ownerInfo.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              width={48}
              height={48}
            />
          ) : (
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
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
                <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                  <Link href={getViewUrl()} className="hover:underline">
                    {job.title}
                  </Link>
                </h3>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-700">{jobTypeLabel}</span>
                  {opportunityTypeBadge && (
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${opportunityTypeBadge.color}`}>
                      {opportunityTypeBadge.label}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end space-y-2 ml-4">
                <span className="text-sm text-gray-500">{getTimeAgo(job.createdAt)}</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 flex-wrap">
              <p className="text-sm text-gray-700 font-medium">{ownerInfo.name}</p>
              {ownerInfo.verified && (
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

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          <MapPin className="w-3 h-3 mr-1" />
          {getLocationText(job.location)}
        </span>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
          <Briefcase className="w-3 h-3 mr-1" />
          {jobService.getJobTypeLabel(job.type)}
        </span>
        {job.remote !== 'on-site' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
            {job.remote === 'remote' ? '🌍 Remote' : '🏢 Hybrid'}
          </span>
        )}
        {job.featured && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
            ⭐ Featured
          </span>
        )}
        {job.urgent && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
            <Clock className="w-3 h-3 mr-1" />
            Urgent
          </span>
        )}
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

      {/* Salary Information */}
      {job.salary && job.salary.isPublic && (
        <div className="mb-4">
          <div className="text-lg font-semibold text-green-600">
            {jobService.formatSalary(job.salary)}
          </div>
          {job.salary.isNegotiable && (
            <span className="text-sm text-gray-500">(Negotiable)</span>
          )}
        </div>
      )}

      {/* Skills */}
      {job.skills && job.skills.length > 0 && (
        <div className="mb-4">
          <div className="flex flex-wrap gap-2">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-50 text-gray-700 border border-gray-200"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-600">
                +{job.skills.length - 4} more
              </span>
            )}
          </div>
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
          {job.applicationDeadline && (
            <span className="flex items-center">
              <Calendar className="w-4 h-4 mr-1" />
              {new Date(job.applicationDeadline).toLocaleDateString()}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {showActions ? (
            <>
              <button
                onClick={() => onViewStats?.(job._id)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="View Statistics"
              >
                <BarChart3 className="w-4 h-4" />
              </button>
              
              {onViewApplications && (
                <button
                  onClick={() => onViewApplications(job._id)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                  title="View Applications"
                >
                  <Users className="w-4 h-4" />
                </button>
              )}
              
              {onEdit ? (
                <button
                  onClick={() => onEdit(job._id)}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Job"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              ) : (
                <Link
                  href={getEditUrl()}
                  className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Edit Job"
                >
                  <Edit3 className="w-4 h-4" />
                </Link>
              )}
              
              <button
                onClick={() => onDelete?.(job._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Job"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href={getViewUrl()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
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