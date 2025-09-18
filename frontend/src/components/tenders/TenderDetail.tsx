/* eslint-disable @typescript-eslint/no-explicit-any */
// components/Tender/TenderDetail.tsx
import React from 'react';
import { Tender } from '@/services/tenderService';
import { Proposal } from '@/types/proposal';
import { Clock, DollarSign, MapPin, Calendar, User } from 'lucide-react';
import Image from 'next/image';

// Extended interface for proposals with correct freelancerId type
interface ProposalWithFreelancer extends Proposal {
  freelancer?: {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  freelancerId: string | { _id: string; name?: string; portfolio?: any[] };
  coverLetter: string;
  createdAt: string;
}

interface Props {
  tender: Tender;
  proposals?: ProposalWithFreelancer[];
  onApply?: () => void;
  children?: React.ReactNode;
  showCompanyInfo?: boolean;
}

const TenderDetail: React.FC<Props> = ({ 
  tender, 
  proposals, 
  onApply, 
  children,
  showCompanyInfo = true 
}) => {
  // Format currency function
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Safe date formatting function
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Calculate days remaining until deadline
  const getDaysRemaining = (deadline: string) => {
    try {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      
      if (isNaN(deadlineDate.getTime())) {
        return { text: 'Invalid date', color: 'text-rose-400' };
      }
      
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return { text: 'Expired', color: 'text-rose-400' };
      if (diffDays === 0) return { text: 'Due today', color: 'text-amber-400' };
      if (diffDays === 1) return { text: '1 day left', color: 'text-amber-400' };
      if (diffDays <= 7) return { text: `${diffDays} days left`, color: 'text-amber-400' };
      return { text: `${diffDays} days left`, color: 'text-emerald-400' };
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return { text: 'Date error', color: 'text-rose-400' };
    }
  };

  // Safe date formatting for proposals
  const safeFormatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'Date not available';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  // Get freelancer display name safely
  const getFreelancerName = (proposal: ProposalWithFreelancer): string => {
    // First try to get name from populated freelancer object
    if (proposal.freelancer?.name) {
      return proposal.freelancer.name;
    }
    
    // Handle case where freelancerId might be an object
    if (proposal.freelancerId && typeof proposal.freelancerId === 'object') {
      // Check if the object has a name property
      if (proposal.freelancerId.name) {
        return proposal.freelancerId.name;
      }
      // If no name, use the _id with substring
      if (proposal.freelancerId._id) {
        return `Freelancer #${proposal.freelancerId._id.substring(0, 8)}`;
      }
    }
    
    // Handle case where freelancerId is a string
    if (typeof proposal.freelancerId === 'string') {
      return `Freelancer #${proposal.freelancerId.substring(0, 8)}`;
    }
    
    // Final fallback
    return 'Unknown Freelancer';
  };

  const daysRemaining = getDaysRemaining(tender.deadline);

  return (
    <div className="space-y-6">
      <section className="p-6 bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${
                tender.status === 'open' ? 'from-green-500 to-emerald-400' :
                tender.status === 'closed' ? 'from-gray-500 to-gray-400' :
                'from-purple-500 to-indigo-400'
              } text-white text-sm font-semibold`}>
                {tender.status.toUpperCase()}
              </span>
              <span className="text-sm text-gray-400 capitalize">{tender.category}</span>
            </div>
            
            <h1 className="text-3xl font-bold text-white mb-4">{tender.title}</h1>
            
            <div className="prose prose-invert max-w-none mb-6">
              <p className="text-gray-300 leading-relaxed">{tender.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <DollarSign className="text-emerald-400" size={20} />
                <div>
                  <div className="text-sm text-gray-400">Budget</div>
                  <div className="font-bold text-white">{formatCurrency(tender.budget)}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Clock className="text-amber-400" size={20} />
                <div>
                  <div className="text-sm text-gray-400">Deadline</div>
                  <div className="font-bold text-white">{formatDate(tender.deadline)}</div>
                  <div className={`text-xs ${daysRemaining.color}`}>{daysRemaining.text}</div>
                </div>
              </div>
              
              {tender.location && (
                <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                  <MapPin className="text-rose-400" size={20} />
                  <div>
                    <div className="text-sm text-gray-400">Location</div>
                    <div className="font-bold text-white">{tender.location}</div>
                  </div>
                </div>
              )}
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Calendar className="text-blue-400" size={20} />
                <div>
                  <div className="text-sm text-gray-400">Posted</div>
                  <div className="font-bold text-white">{formatDate(tender.createdAt)}</div>
                </div>
              </div>
            </div>
          </div>

          {showCompanyInfo && (
            <div className="lg:w-80 flex-shrink-0">
              <div className="sticky top-6 space-y-6">
                <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-3">Company</h3>
                  <div className="flex items-center gap-3 mb-4">
                    {tender.company.logo ? (
                      <Image 
                        src={tender.company.logo} 
                        alt={tender.company.name}
                        height={50}
                        width={50}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                        {tender.company.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-semibold text-white">{tender.company.name}</div>
                      {tender.company.industry && (
                        <div className="text-sm text-gray-400">{tender.company.industry}</div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                    <User size={16} />
                    <span>Posted by {tender.createdBy.name}</span>
                  </div>
                  
                  {tender.company.description && (
                    <p className="text-sm text-gray-400 mb-4">{tender.company.description}</p>
                  )}
                  
                  {tender.company.website && (
                    <a 
                      href={tender.company.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Visit website
                    </a>
                  )}
                </div>
                
                {onApply && (
                  <button
                    onClick={onApply}
                    disabled={tender.status !== 'open'}
                    className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-teal-400 text-white font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {tender.status === 'open' ? 'Submit Proposal' : 'Tender Closed'}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {children}

      {proposals && proposals.length > 0 && (
        <section className="p-6 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-xl font-semibold text-white mb-4">Proposals ({proposals.length})</h3>
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <div key={proposal._id} className="p-4 bg-white/5 rounded-lg border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-white">
                    {getFreelancerName(proposal)}
                  </div>
                  <div className="text-emerald-400 font-semibold">
                    {formatCurrency(proposal.bidAmount)}
                  </div>
                </div>
                <p className="text-gray-300 text-sm mb-3">
                  {proposal.coverLetter || 'No cover letter provided.'}
                </p>
                <div className="text-xs text-gray-400">
                  Submitted {safeFormatDate(proposal.createdAt)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default TenderDetail;