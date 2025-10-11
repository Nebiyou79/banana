// /src/components/tenders/ProposalCard.tsx
import React from 'react';
import { Proposal } from '@/services/proposalService';
import { BudgetDisplay } from './BudgetDisplay';
import { StatusBadge } from './TenderForm';
import Image from 'next/image';

interface ProposalCardProps {
  proposal: Proposal;
  onStatusUpdate?: (proposalId: string, status: string, notes?: string) => void;
  showActions?: boolean;
}

export const ProposalCard: React.FC<ProposalCardProps> = ({
  proposal,
  onStatusUpdate,
  showActions = false
}) => {
  const statusOptions = [
    'submitted',
    'under_review',
    'shortlisted',
    'accepted',
    'rejected'
  ];

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-semibold text-gray-900 mb-2">
            Proposal for: {proposal.tenderId.title}
          </h4>
          
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-gray-300 rounded-full mr-3 flex items-center justify-center">
              {proposal.freelancerId.avatar ? (
                <Image
                  src={proposal.freelancerId.avatar}
                  alt={proposal.freelancerId.name}
                  height={50}
                  width={50}
                  className="w-6 h-6 rounded-full"
                />
              ) : (
                <span className="text-sm font-medium">
                  {proposal.freelancerId.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {proposal.freelancerId.name}
              </p>
              {proposal.freelancerId.rating && (
                <p className="text-xs text-yellow-600">
                  ★ {proposal.freelancerId.rating}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <StatusBadge status={proposal.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <span className="text-sm text-gray-500 block">Bid Amount</span>
          <BudgetDisplay budget={proposal.bidAmount} />
        </div>
        <div>
          <span className="text-sm text-gray-500 block">Timeline</span>
          <span className="text-sm font-medium text-gray-900">
            {proposal.estimatedTimeline}
          </span>
        </div>
      </div>

      <div className="mb-4">
        <span className="text-sm text-gray-500 block mb-1">Proposal</span>
        <p className="text-gray-700 text-sm line-clamp-3">
          {proposal.proposalText}
        </p>
      </div>

      {proposal.attachments && proposal.attachments.length > 0 && (
        <div className="mb-4">
          <span className="text-sm text-gray-500 block mb-2">Attachments</span>
          <div className="flex flex-wrap gap-2">
            {proposal.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Attachment {index + 1}
              </a>
            ))}
          </div>
        </div>
      )}

      {showActions && onStatusUpdate && (
        <div className="flex flex-wrap gap-2 mt-4">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={() => onStatusUpdate(proposal._id, status)}
              className={`px-3 py-1 text-xs rounded-md ${
                proposal.status === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      )}

      <div className="text-xs text-gray-500 mt-4">
        Submitted: {new Date(proposal.createdAt).toLocaleDateString()}
      </div>
    </div>
  );
};