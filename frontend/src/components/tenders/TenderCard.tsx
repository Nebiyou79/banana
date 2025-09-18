// components/Tender/TenderCard.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { Tender } from '@/services/tenderService';
import { Clock, DollarSign, MapPin, Building2 } from 'lucide-react';
import Image from 'next/image';

interface Props {
  tender: Tender;
  onClick?: () => void;
  compact?: boolean;
  showStatus?: boolean;
}

const TenderCard: React.FC<Props> = ({ tender, onClick, compact = false, showStatus = true }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return 'Expired';
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return '1 day left';
    return `${diffDays} days left`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'from-green-500 to-emerald-400';
      case 'closed': return 'from-gray-500 to-gray-400';
      case 'awarded': return 'from-purple-500 to-indigo-400';
      default: return 'from-blue-500 to-cyan-400';
    }
  };

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.02 }}
        className="group bg-gradient-to-br from-white/5 to-white/2 backdrop-blur-md border border-white/10 rounded-xl p-4 shadow-lg transition cursor-pointer hover:border-white/20"
        onClick={onClick}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">
              {tender.title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-300">
              <Building2 size={12} />
              <span className="truncate">{tender.company.name}</span>
            </div>
          </div>
          
          <div className="text-right flex-shrink-0">
            <div className="text-xs font-bold text-white">
              {formatCurrency(tender.budget)}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {getDaysRemaining(tender.deadline)}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      className="group bg-gradient-to-br from-white/6 to-white/3 backdrop-blur-md border border-white/10 rounded-2xl p-6 shadow-xl transition cursor-pointer hover:border-white/20 hover:shadow-2xl"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white truncate mb-2">
            {tender.title}
          </h3>
          <p className="text-sm text-gray-300 line-clamp-2 mb-3">
            {tender.description}
          </p>
        </div>

        {showStatus && (
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getStatusColor(tender.status)} text-white text-xs font-semibold`}>
            {tender.status.toUpperCase()}
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <DollarSign size={16} className="text-emerald-400" />
          <span className="font-semibold text-white">{formatCurrency(tender.budget)}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Clock size={16} className="text-amber-400" />
          <span>{formatDate(tender.deadline)}</span>
          <span className="text-amber-400">({getDaysRemaining(tender.deadline)})</span>
        </div>
        
        {tender.location && (
          <div className="flex items-center gap-2 text-sm text-gray-300">
            <MapPin size={16} className="text-rose-400" />
            <span>{tender.location}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Building2 size={16} className="text-blue-400" />
          <span>{tender.company.name}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          {tender.company.logo ? (
            <Image 
              src={tender.company.logo} 
              alt={tender.company.name}
              height={50}
              width={50}
              className="w-8 h-8 rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              {tender.company.name.charAt(0)}
            </div>
          )}
          <span className="text-xs text-gray-400">{tender.company.name}</span>
        </div>
        
        <div className="text-xs text-gray-400">
          Posted {new Date(tender.createdAt).toLocaleDateString()}
        </div>
      </div>
    </motion.article>
  );
};

export default TenderCard;