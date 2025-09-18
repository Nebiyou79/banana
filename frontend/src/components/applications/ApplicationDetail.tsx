import React from 'react';
import { Application } from '@/types/application';

interface Props {
  application: Application;
  onUpdateStatus?: (id: string, status: string, notes?: string) => void;
}

const ApplicationDetail: React.FC<Props> = ({ application, onUpdateStatus }) => {
  return (
    <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
      <h3 className="text-xl font-semibold text-white">{application.jobId?.title}</h3>
      <p className="text-gray-300 mt-2">{application.coverLetter}</p>

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-gray-400">Candidate: {application.candidate?.name}</div>
        <div className="text-sm">Status: <span className="font-semibold text-white">{application.status}</span></div>
      </div>

      {onUpdateStatus && (
        <div className="mt-4 flex gap-3">
          <button onClick={() => onUpdateStatus(application._id, 'shortlisted')} className="px-3 py-2 rounded-lg bg-yellow-500 text-white">
            Shortlist
          </button>
          <button onClick={() => onUpdateStatus(application._id, 'interview')} className="px-3 py-2 rounded-lg bg-blue-600 text-white">
            Interview
          </button>
          <button onClick={() => onUpdateStatus(application._id, 'rejected')} className="px-3 py-2 rounded-lg bg-red-600 text-white">
            Reject
          </button>
        </div>
      )}
    </div>
  );
};

export default ApplicationDetail;
