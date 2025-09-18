import React, { useState } from 'react';

interface Props {
  jobId: string;
  initial?: { coverLetter?: string; resumeSnapshot?: string };
  onSubmit: (payload: { jobId: string; coverLetter?: string; resumeSnapshot?: string }) => Promise<void>;
  submitLabel?: string;
}

const ApplicationForm: React.FC<Props> = ({ jobId, initial = {}, onSubmit, submitLabel = 'Apply' }) => {
  const [coverLetter, setCoverLetter] = useState(initial.coverLetter ?? '');
  const [resumeSnapshot, setResumeSnapshot] = useState(initial.resumeSnapshot ?? '');
  const [loading, setLoading] = useState(false);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit({ jobId, coverLetter, resumeSnapshot });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="space-y-3 bg-white/5 p-5 rounded-xl border border-white/10">
      <textarea
        placeholder="Write a short cover letter..."
        rows={6}
        value={coverLetter}
        onChange={(e) => setCoverLetter(e.target.value)}
        className="w-full p-3 rounded-lg bg-black/20 text-white"
        required
      />
      <input
        placeholder="Link to resume (optional)"
        value={resumeSnapshot}
        onChange={(e) => setResumeSnapshot(e.target.value)}
        className="w-full p-3 rounded-lg bg-black/20 text-white"
      />
      <div className="text-right">
        <button className="px-4 py-2 rounded-lg bg-gradient-to-r from-teal-500 to-green-400 text-white">
          {loading ? 'Applying...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default ApplicationForm;
