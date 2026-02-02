// components/JobApplicationStatus.tsx
import React from 'react';
import { Job } from '@/services/jobService';
import { getJobApplicationDetails, getStatusColors, formatDeadline } from '@/utils/jobApplicationUtils';
import { colorClasses } from '@/utils/color';
import { CheckCircle, Clock, Lock, XCircle } from 'lucide-react';

interface JobApplicationStatusProps {
  job: Job;
  themeMode?: 'light' | 'dark';
  compact?: boolean;
}

const JobApplicationStatus: React.FC<JobApplicationStatusProps> = ({ 
  job, 
  themeMode = 'light',
  compact = false 
}) => {
  const applicationDetails = getJobApplicationDetails(job);
  const colors = getStatusColors(applicationDetails.statusKey, themeMode);
  
  // Get appropriate icon
  const getStatusIcon = () => {
    
    switch (applicationDetails.statusKey) {
      case 'closed': return <Lock className="w-5 h-5" />;
      case 'inactive': return <XCircle className="w-5 h-5" />;
      case 'expired': return <Clock className="w-5 h-5" />;
      case 'open': return <CheckCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  if (compact) {
    return (
      <div className={`inline-flex items-center rounded-lg px-3 py-2 border`}
        style={{
          backgroundColor: colors.bg,
          borderColor: colors.border,
          color: colors.text
        }}>
        <div className="flex-shrink-0 mr-2">
          {getStatusIcon()}
        </div>
        <div>
          <div className="text-sm font-medium">{applicationDetails.title}</div>
          <div className="text-xs opacity-90">{applicationDetails.description}</div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`rounded-lg border p-6`}
      style={{
        backgroundColor: colors.bg,
        borderColor: colors.border,
        color: colors.text
      }}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0 mr-4">
          {getStatusIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold mb-2">
            {applicationDetails.title}
          </h3>
          <p className={`mb-4 ${themeMode === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
            {applicationDetails.description}
          </p>
          
          {applicationDetails.deadline && (
            <div className={`text-sm ${themeMode === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              <span className="font-medium">Deadline: </span>
              {applicationDetails.deadline.toLocaleDateString()} at{' '}
              {applicationDetails.deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t" style={{ borderColor: colors.border }}>
            <div className="text-sm font-medium">Application Status:</div>
            <div className="text-xs mt-1">
              {applicationDetails.canApply ? (
                <span className={`inline-flex items-center ${colorClasses.text.green}`}>
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Ready to accept applications
                </span>
              ) : (
                <div>
                  <div className="mb-1">Cannot accept applications because:</div>
                  <ul className="list-disc list-inside text-xs space-y-1">
                    {job.isApplyEnabled === false && (
                      <li>Applications are disabled for this position</li>
                    )}
                    {job.status !== 'active' && (
                      <li>Position status is "{job.status}"</li>
                    )}
                    {job.applicationDeadline && new Date(job.applicationDeadline) < new Date() && (
                      <li>Application deadline has passed</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobApplicationStatus;