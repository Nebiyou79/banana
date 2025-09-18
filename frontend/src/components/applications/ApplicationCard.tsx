import React from 'react';
import { Application } from '@/types/application';
import { motion } from 'framer-motion';

interface Props {
  application: Application;
  onView?: (id: string) => void;
  compact?: boolean;
}

const ApplicationCard: React.FC<Props> = ({ application, onView, compact }) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white/5 rounded-xl border border-white/8 p-4"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="text-white font-semibold">{application.jobId?.title ?? 'Job'}</h4>
          <p className="text-sm text-gray-300 mt-1 line-clamp-2">{application.coverLetter}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-400">Status</div>
          <div className="font-bold text-white">{application.status}</div>
          {!compact && onView && (
            <button onClick={() => onView(application._id)} className="mt-3 px-3 py-1 bg-blue-600 rounded text-white text-sm">
              View
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ApplicationCard;
