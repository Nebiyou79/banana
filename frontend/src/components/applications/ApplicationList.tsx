import React from 'react';
import ApplicationCard from './ApplicationCard';
import { Application } from '@/types/application';

interface Props {
  applications: Application[];
  onView?: (id: string) => void;
}

const ApplicationList: React.FC<Props> = ({ applications, onView }) => {
  if (!applications || applications.length === 0) {
    return <div className="text-gray-400">No applications found.</div>;
  }

  return (
    <div className="grid gap-4">
      {applications.map((a) => (
        <ApplicationCard key={a._id} application={a} onView={onView} />
      ))}
    </div>
  );
};

export default ApplicationList;
