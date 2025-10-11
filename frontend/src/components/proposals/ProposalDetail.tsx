// components/Proposal/ProposalDetail.tsx
import React, { useState } from 'react';
import { Proposal } from '@/services/proposalService';
import { DollarSign, Clock, FileText, Calendar, User, Building, Award, Star, MessageSquare } from 'lucide-react';
import Image from 'next/image';

interface Props {
  proposal: Proposal;
  onAccept?: (id: string, notes?: string) => void;
  onReject?: (id: string, notes?: string) => void;
  onShortlist?: (id: string, notes?: string) => void;
  onSendMessage?: (freelancerId: string) => void;
  showCompanyActions?: boolean;
}

const ProposalDetail: React.FC<Props> = ({ 
  proposal, 
  onAccept, 
  onReject, 
  onShortlist,
  onSendMessage,
  showCompanyActions = false 
}) => {
  const [companyNotes, setCompanyNotes] = useState(proposal.companyNotes || '');
  const [showNotesInput, setShowNotesInput] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
  currency: 'Birr',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'shortlisted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleAction = (action: 'accept' | 'reject' | 'shortlist') => {
    const actionMap = {
      accept: onAccept,
      reject: onReject,
      shortlist: onShortlist
    };

    const actionFn = actionMap[action];
    if (actionFn) {
      if (showNotesInput && companyNotes.trim()) {
        actionFn(proposal._id, companyNotes);
      } else {
        actionFn(proposal._id);
      }
      setShowNotesInput(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {proposal.freelancerId.avatar ? (
              <Image
                src={proposal.freelancerId.avatar}
                alt={proposal.freelancerId.name}
                height={50}
                width={50}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-2xl">
                {proposal.freelancerId.name.charAt(0)}
              </div>
            )}
            
            <div>
              <h1 className="text-2xl font-bold text-white">{proposal.freelancerId.name}</h1>
              <p className="text-gray-400">{proposal.freelancerId.email}</p>
              
              {proposal.freelancerId.rating && (
                <div className="flex items-center gap-2 mt-2">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star size={16} fill="currentColor" />
                    <span className="font-semibold">{proposal.freelancerId.rating}</span>
                  </div>
                  {proposal.freelancerId.experience && (
                    <span className="text-gray-400 text-sm">• {proposal.freelancerId.experience}</span>
                  )}
                  {proposal.freelancerId.skills && (
                    <span className="text-gray-400 text-sm">• {proposal.freelancerId.skills.join(', ')}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${getStatusColor(proposal.status)}`}>
            <span className="capitalize font-semibold">{proposal.status.replace('_', ' ')}</span>
          </div>
        </div>

        {/* Tender Info */}
        {proposal.tenderId && (
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-white mb-2 flex items-center gap-2">
              <Building size={18} />
              Proposal for: {proposal.tenderId.title}
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
              <div className="flex items-center gap-2">
                <DollarSign size={16} />
                <span>Budget: {formatCurrency(proposal.tenderId.budget)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>Deadline: {formatDate(proposal.tenderId.deadline)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Award size={16} />
                <span>Status: {proposal.tenderId.status}</span>
              </div>
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>Company: {proposal.tenderId.company.name}</span>
              </div>
            </div>
          </div>
        )}

        {/* Proposal Details */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <DollarSign className="text-emerald-400" size={24} />
            <div>
              <div className="text-sm text-gray-400">Bid Amount</div>
              <div className="font-bold text-white text-xl">{formatCurrency(proposal.bidAmount)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Clock className="text-amber-400" size={24} />
            <div>
              <div className="text-sm text-gray-400">Estimated Timeline</div>
              <div className="font-bold text-white">{proposal.estimatedTimeline}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <Calendar className="text-blue-400" size={24} />
            <div>
              <div className="text-sm text-gray-400">Submitted</div>
              <div className="font-bold text-white">{formatDate(proposal.createdAt)}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <FileText className="text-purple-400" size={24} />
            <div>
              <div className="text-sm text-gray-400">Attachments</div>
              <div className="font-bold text-white">{proposal.attachments.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Proposal Text */}
      <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Proposal Details</h3>
        <div className="prose prose-invert max-w-none">
          <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
            {proposal.proposalText}
          </p>
        </div>
      </div>

      {/* Attachments */}
      {proposal.attachments.length > 0 && (
        <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <FileText size={20} />
            Attachments ({proposal.attachments.length})
          </h3>
          <div className="grid gap-2">
            {proposal.attachments.map((attachment, index) => (
              <a
                key={index}
                href={attachment}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg hover:bg-white/10 transition group"
              >
                <FileText size={18} className="text-blue-400" />
                <span className="text-gray-300 group-hover:text-white transition flex-1 truncate">
                  {attachment}
                </span>
                <span className="text-xs text-gray-400">Open</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Company Notes */}
      {proposal.companyNotes && (
        <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Company Notes</h3>
          <p className="text-gray-300 bg-white/5 p-4 rounded-lg">
            {proposal.companyNotes}
          </p>
        </div>
      )}

      {/* Actions */}
      {showCompanyActions && (
        <div className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md rounded-2xl border border-white/10 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Manage Proposal</h3>
          
          {showNotesInput && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Notes (Optional)
              </label>
              <textarea
                value={companyNotes}
                onChange={(e) => setCompanyNotes(e.target.value)}
                placeholder="Add any notes or feedback for this proposal..."
                className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            {onSendMessage && (
              <button
                onClick={() => onSendMessage(proposal.freelancerId._id)}
                className="px-6 py-3 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition flex items-center gap-2"
              >
                <MessageSquare size={18} />
                Send Message
              </button>
            )}

            {onShortlist && proposal.status === 'submitted' && (
              <button
                onClick={() => {
                  if (!showNotesInput) setShowNotesInput(true);
                  else handleAction('shortlist');
                }}
                className="px-6 py-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-2"
              >
                <Award size={18} />
                {showNotesInput ? 'Confirm Shortlist' : 'Shortlist'}
              </button>
            )}

            {onAccept && proposal.status === 'submitted' && (
              <button
                onClick={() => {
                  if (!showNotesInput) setShowNotesInput(true);
                  else handleAction('accept');
                }}
                className="px-6 py-3 rounded-xl bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-2"
              >
                <span>✓</span>
                {showNotesInput ? 'Confirm Acceptance' : 'Accept Proposal'}
              </button>
            )}

            {onReject && proposal.status === 'submitted' && (
              <button
                onClick={() => {
                  if (!showNotesInput) setShowNotesInput(true);
                  else handleAction('reject');
                }}
                className="px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 transition flex items-center gap-2"
              >
                <span>✗</span>
                {showNotesInput ? 'Confirm Rejection' : 'Reject Proposal'}
              </button>
            )}

            {showNotesInput && (
              <button
                onClick={() => setShowNotesInput(false)}
                className="px-6 py-3 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProposalDetail;