// components/CandidateJobCard.tsx
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Job } from '@/services/jobService';
import { useAuth } from '@/contexts/AuthContext';
import ApplicationForm from '@/components/application/ApplicationForm';
import { MapPin, Briefcase, Calendar, CheckCircle } from 'lucide-react';

interface CandidateJobCardProps {
  job: Job;
}

const CandidateJobCard: React.FC<CandidateJobCardProps> = ({ job }) => {
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const formatSalary = () => {
    if (!job.salary?.min && !job.salary?.max) return 'Negotiable';
    
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: job.salary?.currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (job.salary?.min && job.salary?.max) {
      return `${formatter.format(job.salary.min)} - ${formatter.format(job.salary.max)}/${job.salary.period}`;
    } else if (job.salary?.min) {
      return `From ${formatter.format(job.salary.min)}/${job.salary.period}`;
    } else if (job.salary?.max) {
      return `Up to ${formatter.format(job.salary.max)}/${job.salary.period}`;
    }
    
    return 'Negotiable';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  const handleQuickApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      router.push('/login');
      return;
    }
    setShowApplicationForm(true);
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center">
            {job.company.logoUrl && (
              <img 
                src={job.company.logoUrl} 
                alt={job.company.name}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
              <p className="text-gray-600">{job.company.name}</p>
              {job.company.verified && (
                <span className="inline-flex items-center text-xs text-green-600 mt-1">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Company
                </span>
              )}
            </div>
          </div>
          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
            {formatDate(job.createdAt)}
          </span>
        </div>
        
        <div className="mb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
              {getJobTypeLabel(job.type)}
            </span>
            <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-1 rounded">
              {job.experienceLevel}
            </span>
            {job.remote && (
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded">
                Remote
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="w-4 h-4 mr-1" />
              <span>{job.location}</span>
            </div>
            
            <div className="text-md font-semibold text-gray-800">
              {formatSalary()}
            </div>
          </div>
        </div>

        {job.skills && job.skills.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-1">
              {job.skills.slice(0, 3).map((skill, index) => (
                <span key={index} className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
              {job.skills.length > 3 && (
                <span className="text-xs text-gray-500">
                  +{job.skills.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex space-x-2">
          <Link href={`/dashboard/candidate/jobs/${job._id}`} passHref className="flex-1">
            <button className="w-full bg-gray-100 text-gray-700 py-2 rounded-md hover:bg-gray-200 transition-colors text-sm font-medium">
              View Details
            </button>
          </Link>
          <button 
            onClick={handleQuickApply}
            className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Quick Apply
          </button>
        </div>
      </div>

      {/* Application Form Modal */}
      {showApplicationForm && (
        <ApplicationForm
          jobId={job._id}
          jobTitle={job.title}
          companyName={job.company.name}
          onClose={() => setShowApplicationForm(false)}
          onSuccess={() => setShowApplicationForm(false)}
        />
      )}
    </>
  );
};

export default CandidateJobCard;