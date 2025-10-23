/* eslint-disable @typescript-eslint/no-unused-vars */
// components/tenders/CompanyTenderCard.tsx - UPDATED VERSION
import React from 'react';
import Link from 'next/link';
import { Tender } from '@/services/tenderService';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  BookmarkIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface CompanyTenderCardProps {
  tender: Tender;
  onSaveToggle?: (tenderId: string, saved: boolean) => void;
  onEdit?: (tenderId: string) => void;
  onDelete?: (tenderId: string) => void;
  saved?: boolean;
  showActions?: boolean;
  showStatus?: boolean;
}

const CompanyTenderCard: React.FC<CompanyTenderCardProps> = ({ 
  tender, 
  onSaveToggle, 
  onEdit,
  onDelete,
  saved = false,
  showActions = true,
  showStatus = true
}) => {
  // Safe access to tender properties
  const tenderId = tender?._id || '';
  const title = tender?.title || 'Untitled Tender';
  const description = tender?.description || 'No description available';
  const skillsRequired = tender?.skillsRequired || [];
  const budget = tender?.budget || { min: 0, max: 0, currency: 'USD' };
  const deadline = tender?.deadline || new Date().toISOString();
  const duration = tender?.duration || 0;
  const status = tender?.status || 'draft';
  const visibility = tender?.visibility || 'public';
  const company = tender?.company;
  const proposals = tender?.proposals || [];
  const metadata = tender?.metadata || { views: 0, proposalCount: 0, savedBy: [] };

  const formatCurrency = (amount: number, currency: string) => {
    const validCurrency = currency && currency.trim() ? currency : 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDaysRemaining = (deadline: string) => {
    try {
      const now = new Date();
      const deadlineDate = new Date(deadline);
      const diffTime = deadlineDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch (error) {
      return 0;
    }
  };

  const daysRemaining = getDaysRemaining(deadline);
  const isExpired = daysRemaining < 0;

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSaveToggle && tenderId) {
      onSaveToggle(tenderId, !saved);
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onEdit && tenderId) {
      onEdit(tenderId);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete && tenderId) {
      onDelete(tenderId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
        return '🟢';
      case 'draft':
        return '⚫';
      case 'completed':
        return '🔵';
      case 'cancelled':
        return '🔴';
      case 'in_progress':
        return '🟡';
      default:
        return '⚫';
    }
  };

  if (!tender) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-gray-500 text-center">Tender not available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden">
      <div className="p-6">
        {/* Header with Status and Actions */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showStatus && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                  <span className="mr-1">{getStatusIcon(status)}</span>
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                </span>
              )}
              {visibility === 'invite_only' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                  Invite Only
                </span>
              )}
            </div>
            <Link href={`/dashboard/company/tenders/${tenderId}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                {title}
              </h3>
            </Link>
          </div>
          
          <div className="flex items-center gap-1">
            {onSaveToggle && (
              <button
                onClick={handleSaveClick}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {saved ? (
                  <BookmarkSolid className="h-5 w-5 text-blue-500" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </button>
            )}
            
            {showActions && (
              <>
                {onEdit && (
                  <button
                    onClick={handleEditClick}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500 transition-colors"
                    title="Edit Tender"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                )}
                {onDelete && status === 'draft' && (
                  <button
                    onClick={handleDeleteClick}
                    className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete Tender"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {description}
        </p>

        {/* Skills */}
        {skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {skillsRequired.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {skill}
              </span>
            ))}
            {skillsRequired.length > 4 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{skillsRequired.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <EyeIcon className="h-4 w-4" />
            <span>{metadata.views || 0} views</span>
          </div>
          {/* <div className="flex items-center gap-1">
            <DocumentTextIcon className="h-4 w-4" />
            <span>{metadata.proposalCount || 0} proposals</span>
          </div> */}
          <div className="flex items-center gap-1">
            <BookmarkIcon className="h-4 w-4" />
            <span>{metadata.savedBy?.length || 0} saves</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
          {/* Budget */}
          {budget && (budget.min > 0 || budget.max > 0) && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="font-medium text-gray-900">
                {formatCurrency(budget.min, budget.currency)} - {formatCurrency(budget.max, budget.currency)}
                {budget.isNegotiable && ' (Negotiable)'}
              </span>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center gap-1 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span className={isExpired ? "text-red-600 font-medium" : "text-gray-600"}>
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </span>
          </div>

          {/* Duration */}
          {duration > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>{duration} days</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2">
          <Link href={`/dashboard/company/tenders/${tenderId}`} className="flex-1">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium">
              View Details
            </button>
          </Link>
          
          {status === 'draft' && onEdit && (
            <button
              onClick={handleEditClick}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Add missing icons
const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

export default CompanyTenderCard;