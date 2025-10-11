/* eslint-disable @typescript-eslint/no-unused-vars */
// components/tenders/TenderCard.tsx - FIXED VERSION
import React from 'react';
import Link from 'next/link';
import { Tender } from '@/services/tenderService';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  BookmarkIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface TenderCardProps {
  tender: Tender;
  onSaveToggle?: (tenderId: string, saved: boolean) => void;
  saved?: boolean;
  showCompany?: boolean;
  showStatus?: boolean;
}

const TenderCard: React.FC<TenderCardProps> = ({ 
  tender, 
  onSaveToggle, 
  saved = false,
  showCompany = true,
  showStatus = false
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

  const formatCurrency = (amount: number, currency: string) => {
    // Ensure currency is valid, fallback to USD
    const validCurrency = currency && currency.trim() ? currency : 'USD';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: validCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'open':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              {showStatus && (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )}
              {visibility === 'invite_only' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Invite Only
                </span>
              )}
            </div>
            <Link href={`/tenders/${tenderId}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2">
                {title}
              </h3>
            </Link>
          </div>
          
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
        </div>

        {/* Company Info */}
        {showCompany && company && (
          <div className="flex items-center gap-2 mb-3">
            <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-600 flex items-center gap-1">
              {company.name || 'Unknown Company'}
              {company.verified && (
                <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
              )}
            </span>
          </div>
        )}

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

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-gray-100">
          {/* Budget */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <CurrencyDollarIcon className="h-4 w-4" />
            <span className="font-medium text-gray-900">
              {formatCurrency(budget.min, budget.currency)} - {formatCurrency(budget.max, budget.currency)}
            </span>
          </div>

          {/* Deadline */}
          <div className="flex items-center gap-1 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span className={isExpired ? "text-red-600" : "text-gray-600"}>
              {isExpired ? 'Expired' : `${daysRemaining} days left`}
            </span>
          </div>

          {/* Duration */}
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>{duration} days</span>
          </div>
        </div>

        {/* View Details Button */}
        <div className="mt-4">
          <Link href={`/dashboard/company/tenders/${tenderId}`}>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md transition-colors text-sm font-medium">
              View Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;