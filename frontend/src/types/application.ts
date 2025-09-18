/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Application {
  _id: string;
  jobId?: { _id: string; title?: string; company?: any; location?: string };
  candidate?: { _id: string; name?: string; email?: string; profileCompleted?: boolean };
  coverLetter?: string;
  resumeSnapshot?: string;
  status?: 'applied' | 'reviewed' | 'shortlisted' | 'interview' | 'accepted' | 'rejected';
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}
