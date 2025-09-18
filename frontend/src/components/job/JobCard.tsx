import React from 'react';
import Link from 'next/link';
import { Job } from '@/services/jobService';

interface JobCardProps {
  job: Job;
  showActions?: boolean;
  onEdit?: (job: Job) => void;
  onDelete?: (jobId: string) => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, showActions = false, onEdit, onDelete }) => {
  const formatSalary = (salary: Job['salary']) => {
    if (!salary || !salary.min || !salary.max) return 'Salary not specified';
    
    const formatNumber = (num: number) => 
      new Intl.NumberFormat('en-US').format(num);
    
    return `$${formatNumber(salary.min)} - $${formatNumber(salary.max)} ${salary.currency}/${salary.period}`;
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:border-blue-100">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-start space-x-4">
          {job.company.logoUrl && (
            <img 
              src={job.company.logoUrl} 
              alt={job.company.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
            />
          )}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
              <Link href={`/dashboard/company/jobs/${job._id}`}>
                {job.title}
              </Link>
            </h3>
            <p className="text-gray-600 text-sm mt-1">{job.company.name}</p>
            {job.company.verified && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                Verified
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-gray-500">{getTimeAgo(job.createdAt)}</span>
      </div>

      {/* Details */}
      <div className="space-y-3 mb-4">
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-700">
            📍 {job.location}
          </span>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-700">
            ⏱️ {job.type.replace('-', ' ')}
          </span>
          {job.remote && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-700">
              🏠 Remote
            </span>
          )}
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusColor(job.status)}`}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </span>
        </div>

        {job.salary && (
          <div className="text-lg font-semibold text-green-600">
            {formatSalary(job.salary)}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {job.skills.slice(0, 4).map((skill, index) => (
            <span
              key={index}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-700 border border-blue-200"
            >
              {skill}
            </span>
          ))}
          {job.skills.length > 4 && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-600">
              +{job.skills.length - 4} more
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <span>👁️ {job.views} views</span>
          <span>📄 {job.applicationCount} applications</span>
        </div>
        
        <div className="flex items-center space-x-2">
          {showActions ? (
            <>
              <button
                onClick={() => onEdit?.(job)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => onDelete?.(job._id)}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
              >
                Delete
              </button>
            </>
          ) : (
            <Link
              href={`/dashboard/company/jobs/${job._id}`}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-md hover:shadow-lg"
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