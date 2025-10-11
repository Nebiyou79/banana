// components/Proposal/ProposalCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Proposal } from '@/services/proposalService';
import { Clock, DollarSign, FileText, Award, X, Check, Star, Calendar } from 'lucide-react';
import Image from 'next/image';

interface Props {
  proposal: Proposal;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  compact?: boolean;
  showActions?: boolean;
  showTenderInfo?: boolean;
}

const ProposalCard: React.FC<Props> = ({ 
  proposal, 
  onAccept, 
  onReject, 
  onView, 
  onEdit,
  compact = false,
  showActions = true,
  showTenderInfo = false
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejected': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'shortlisted': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'under_review': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <Check size={14} />;
      case 'rejected': return <X size={14} />;
      case 'shortlisted': return <Award size={14} />;
      case 'under_review': return <Clock size={14} />;
      default: return <FileText size={14} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
  currency: 'Birr',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/20 transition-all"
        onClick={() => onView?.(proposal._id)}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${getStatusColor(proposal.status)}`}>
                {getStatusIcon(proposal.status)}
                <span className="capitalize">{proposal.status.replace('_', ' ')}</span>
              </div>
            </div>
            
            <h4 className="font-semibold text-white truncate text-sm">
              {proposal.freelancerId.name}
            </h4>
            
            <p className="text-xs text-gray-300 mt-1 line-clamp-1">
              {proposal.proposalText}
            </p>
          </div>

          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-white">
              {formatCurrency(proposal.bidAmount)}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <Clock size={12} />
              {proposal.estimatedTimeline}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          {proposal.freelancerId.avatar ? (
            <Image
              src={proposal.freelancerId.avatar}
              alt={proposal.freelancerId.name}
              height={50}
              width={50}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
              {proposal.freelancerId.name.charAt(0)}
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-white">{proposal.freelancerId.name}</h3>
            {proposal.freelancerId.rating && (
              <div className="flex items-center gap-1 text-sm text-amber-400 mt-1">
                <Star size={14} fill="currentColor" />
                <span>{proposal.freelancerId.rating}</span>
                {proposal.freelancerId.experience && (
                  <span className="text-gray-400 ml-2">• {proposal.freelancerId.experience}</span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm border ${getStatusColor(proposal.status)}`}>
            {getStatusIcon(proposal.status)}
            <span className="capitalize">{proposal.status.replace('_', ' ')}</span>
          </div>
        </div>
      </div>

      {/* Tender Info (if shown) */}
      {showTenderInfo && proposal.tenderId && (
        <div className="mb-4 p-3 bg-white/5 rounded-lg">
          <h4 className="font-medium text-white text-sm mb-1">For: {proposal.tenderId.title}</h4>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span>Budget: {formatCurrency(proposal.tenderId.budget)}</span>
            <span>•</span>
            <span>Deadline: {formatDate(proposal.tenderId.deadline)}</span>
          </div>
        </div>
      )}

      {/* Proposal Content */}
      <div className="mb-4">
        <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">
          {proposal.proposalText}
        </p>
      </div>

      {/* Details Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <DollarSign size={16} className="text-emerald-400" />
          <span className="font-semibold text-white">{formatCurrency(proposal.bidAmount)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock size={16} className="text-amber-400" />
          <span>{proposal.estimatedTimeline}</span>
        </div>
        
        {proposal.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-gray-300 col-span-2">
            <FileText size={16} className="text-blue-400" />
            <span>{proposal.attachments.length} attachment(s)</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-300 col-span-2">
          <Calendar size={16} className="text-purple-400" />
          <span>Submitted {formatDate(proposal.createdAt)}</span>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="flex items-center gap-3 pt-4 border-t border-white/10">
          {onView && (
            <button
              onClick={() => onView(proposal._id)}
              className="px-4 py-2 rounded-lg bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition text-sm"
            >
              View Details
            </button>
          )}
          
          {onAccept && proposal.status === 'submitted' && (
            <button
              onClick={() => onAccept(proposal._id)}
              className="px-4 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-sm flex items-center gap-2"
            >
              <Check size={16} />
              Accept
            </button>
          )}
          
          {onReject && proposal.status === 'submitted' && (
            <button
              onClick={() => onReject(proposal._id)}
              className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition text-sm flex items-center gap-2"
            >
              <X size={16} />
              Reject
            </button>
          )}
          
          {onEdit && proposal.status === 'submitted' && (
            <button
              onClick={() => onEdit(proposal._id)}
              className="px-4 py-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition text-sm"
            >
              Edit
            </button>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProposalCard;