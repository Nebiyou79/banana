// types/proposal.ts
export interface Proposal {
  _id: string;
  tenderId: string;
  freelancerId: string;
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