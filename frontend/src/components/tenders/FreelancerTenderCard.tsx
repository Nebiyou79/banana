// components/tenders/FreelancerTenderCard.tsx
import React from 'react';
import Link from 'next/link';
import { Tender } from '@/services/tenderService';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  BookmarkIcon,
  BuildingOfficeIcon,
  BuildingLibraryIcon,
  CheckBadgeIcon,
  EyeIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface FreelancerTenderCardProps {
  tender: Tender;
  onSaveToggle?: (tenderId: string, saved: boolean) => void;
  saved?: boolean;
  showActions?: boolean;
  compact?: boolean;
}

const FreelancerTenderCard: React.FC<FreelancerTenderCardProps> = ({ 
  tender, 
  onSaveToggle, 
  saved = false,
  showActions = true,
  compact = false
}) => {
  // Safe access to tender properties
  const tenderId = tender?._id || '';
  const title = tender?.title || 'Untitled Tender';
  const description = tender?.description || 'No description available';
  const skillsRequired = tender?.skillsRequired || [];
  const budget = tender?.budget || { min: 0, max: 0, currency: 'USD', isNegotiable: false };
  const deadline = tender?.deadline || new Date().toISOString();
  const duration = tender?.duration || 0;
  const status = tender?.status || 'draft';
  const tenderType = tender?.tenderType || 'company';
  const company = tender?.company;
  const organization = tender?.organization;
  const metadata = tender?.metadata || { views: 0, proposalCount: 0, savedBy: [] };
  const isSaved = tender?.isSaved || saved;

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
  const isUrgent = daysRemaining <= 3 && daysRemaining >= 0;
  const isNew = () => {
    const created = new Date(tender.createdAt);
    const now = new Date();
    const diffDays = Math.ceil((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 2;
  };

  const handleSaveClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onSaveToggle && tenderId) {
      onSaveToggle(tenderId, !isSaved);
    }
  };

// Replace your getOwnerInfo function with this:
const getOwnerInfo = () => {
  console.log('🔍 Tender data for owner info:', {
    tenderType,
    organization,
    company,
    hasOrganization: !!organization,
    hasCompany: !!company
  });

  // Handle organization tenders
  if (tenderType === 'organization') {
    if (organization) {
      return {
        type: 'organization',
        name: organization.name || 'Organization',
        verified: organization.verified || false,
        logo: organization.logo || '',
        industry: organization.industry || 'Various Services',
        description: organization.description || ''
      };
    }
    // Fallback for organization tenders without organization data
    return {
      type: 'organization',
      name: 'Organization',
      verified: false,
      logo: '',
      industry: 'Various Services',
      description: ''
    };
  } 
  // Handle company tenders
  else {
    if (company) {
      return {
        type: 'company',
        name: company.name || 'Company',
        verified: company.verified || false,
        logo: company.logo || '',
        industry: company.industry || 'Business Services',
        description: company.description || ''
      };
    }
    // Fallback for company tenders without company data
    return {
      type: 'company',
      name: 'Company',
      verified: false,
      logo: '',
      industry: 'Business Services',
      description: ''
    };
  }
};

  const ownerInfo = getOwnerInfo();

  if (!tender) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 animate-pulse">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-12 w-12 bg-gray-200 rounded-xl"></div>
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
        <div className="h-5 bg-gray-200 rounded mb-3"></div>
        <div className="h-3 bg-gray-200 rounded mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-3/4 mb-4"></div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-200 overflow-hidden group">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                {isNew() && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                    <SparklesIcon className="h-3 w-3 mr-1" />
                    New
                  </span>
                )}
                {isUrgent && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white">
                    Urgent
                  </span>
                )}
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  tenderType === 'organization' 
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : 'bg-blue-100 text-blue-800 border border-blue-200'
                }`}>
                  {tenderType === 'organization' ? 'Organization' : 'Company'}
                </span>
              </div>
              
              <Link href={`/dashboard/freelancer/tenders/${tenderId}`}>
                <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 group-hover:underline">
                  {title}
                </h3>
              </Link>
            </div>
            
            {showActions && onSaveToggle && (
              <button
                onClick={handleSaveClick}
                className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500 transition-colors"
              >
                {isSaved ? (
                  <BookmarkSolid className="h-5 w-5 text-blue-500" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>

          {/* Owner Info */}
          {ownerInfo && (
            <div className="flex items-center gap-2 mb-3">
              {ownerInfo.type === 'organization' ? (
                <BuildingLibraryIcon className="h-4 w-4 text-purple-500" />
              ) : (
                <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
              )}
              <span className="text-sm text-gray-600 flex items-center gap-1">
                {ownerInfo.name}
                {ownerInfo.verified && (
                  <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                )}
              </span>
            </div>
          )}

          {/* Description */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2">
            {description}
          </p>

          {/* Skills */}
          {skillsRequired.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {skillsRequired.slice(0, 3).map((skill, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    tenderType === 'organization'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {skill}
                </span>
              ))}
              {skillsRequired.length > 3 && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  +{skillsRequired.length - 3} more
                </span>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            {/* Budget */}
            {budget && (budget.min > 0 || budget.max > 0) && (
              <div className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                <CurrencyDollarIcon className="h-4 w-4 text-green-500" />
                {formatCurrency(budget.min, budget.currency)}
                {budget.max > budget.min && ` - ${formatCurrency(budget.max, budget.currency)}`}
              </div>
            )}

            {/* Deadline */}
            <div className="flex items-center gap-1 text-sm">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <span className={isExpired ? "text-red-600 font-medium" : isUrgent ? "text-orange-600 font-medium" : "text-gray-600"}>
                {isExpired ? 'Expired' : `${daysRemaining}d left`}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
      <div className="p-6">
        {/* Header with Status and Actions */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {isNew() && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-sm">
                  <SparklesIcon className="h-3 w-3 mr-1" />
                  New
                </span>
              )}
              {isUrgent && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-sm">
                  Urgent
                </span>
              )}
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                tenderType === 'organization' 
                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                  : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {tenderType === 'organization' ? 'Organization Project' : 'Company Project'}
              </span>
              {tender.visibility === 'invite_only' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Invite Only
                </span>
              )}
            </div>
            
            <Link href={`/dashboard/freelancer/tenders/${tenderId}`}>
              <h3 className="text-xl font-bold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 group-hover:underline mb-2">
                {title}
              </h3>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            {showActions && onSaveToggle && (
              <button
                onClick={handleSaveClick}
                className={`flex-shrink-0 p-3 rounded-xl transition-all duration-300 ${
                  isSaved 
                    ? 'bg-blue-50 text-blue-500 hover:bg-blue-100' 
                    : 'text-gray-400 hover:text-blue-500 hover:bg-gray-50'
                }`}
                title={isSaved ? 'Remove from saved' : 'Save tender'}
              >
                {isSaved ? (
                  <BookmarkSolid className="h-5 w-5" />
                ) : (
                  <BookmarkIcon className="h-5 w-5" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* Owner Info */}
        {ownerInfo && (
          <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-xl">
            {ownerInfo.type === 'organization' ? (
              <BuildingLibraryIcon className="h-5 w-5 text-purple-500" />
            ) : (
              <BuildingOfficeIcon className="h-5 w-5 text-blue-500" />
            )}
            <div className="flex-1">
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                {ownerInfo.name}
                {ownerInfo.verified && (
                  <CheckBadgeIcon className="h-4 w-4 text-green-500" />
                )}
              </span>
              <span className="text-xs text-gray-600 capitalize">{ownerInfo.industry}</span>
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {description}
        </p>

        {/* Skills */}
        {skillsRequired.length > 0 && (
          <div className="mb-4">
            <div className="flex flex-wrap gap-2">
              {skillsRequired.slice(0, 6).map((skill, index) => (
                <span
                  key={index}
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${
                    tenderType === 'organization'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : 'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}
                >
                  {skill}
                </span>
              ))}
              {skillsRequired.length > 6 && (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                  +{skillsRequired.length - 6} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center gap-1">
            <EyeIcon className="h-4 w-4" />
            <span>{metadata.views || 0} views</span>
          </div>
          {/* <div className="flex items-center gap-1">
            <UserGroupIcon className="h-4 w-4" />
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
            <div className="flex items-center gap-2">
              <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
              <div>
                <div className="font-semibold text-gray-900 text-lg">
                  {formatCurrency(budget.min, budget.currency)} - {formatCurrency(budget.max, budget.currency)}
                </div>
                {budget.isNegotiable && (
                  <div className="text-xs text-gray-500">Budget is negotiable</div>
                )}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="flex items-center gap-4">
            {/* Deadline */}
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4 text-gray-400" />
              <div className="text-right">
                <div className={`text-sm font-semibold ${isExpired ? "text-red-600" : isUrgent ? "text-orange-600" : "text-gray-900"}`}>
                  {isExpired ? 'Expired' : `${daysRemaining} days left`}
                </div>
                <div className="text-xs text-gray-500">Deadline</div>
              </div>
            </div>

            {/* Duration */}
            {duration > 0 && (
              <div className="flex items-center gap-2">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-900">{duration} days</div>
                  <div className="text-xs text-gray-500">Duration</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex gap-3">
          <Link href={`/dashboard/freelancer/tenders/${tenderId}`} className="flex-1">
            <button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-sm hover:shadow-md">
              View Details
            </button>
          </Link>
          
          {!isExpired && status === 'published' && (
            <Link href={`/dashboard/freelancer/proposals/create?tender=${tenderId}`} className="flex-1">
              <button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 px-4 rounded-xl transition-all duration-300 font-semibold shadow-sm hover:shadow-md">
                Apply Now
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default FreelancerTenderCard;