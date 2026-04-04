/* eslint-disable @typescript-eslint/no-explicit-any */
// types/proposal.ts
export interface FreelancerReference {
  _id: string;
  name?: string;
  portfolio?: any[];
}

export interface Proposal {
  _id: string;
  tenderId: string;
  freelancerId: string | FreelancerReference;
  freelancer?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  bidAmount: number;
  coverLetter: string;
  status: 'pending' | 'accepted' | 'rejected';
  attachments?: string[];
  createdAt: string;
  updatedAt?: string;
}