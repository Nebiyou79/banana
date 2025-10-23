/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/tenders/TenderCard.tsx - FIXED VERSION
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tender } from '@/services/tenderService';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  ClockIcon, 
  BookmarkIcon,
  BuildingOfficeIcon,
  CheckBadgeIcon,
  BuildingLibraryIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolid } from '@heroicons/react/24/solid';

interface TenderCardProps {
  tender: Tender;
  onSaveToggle?: (tenderId: string, saved: boolean) => void;
  saved?: boolean;
  showOwner?: boolean;
  showStatus?: boolean;
  viewDetailsLink?: string;
}

// Simple organization data cache
const organizationCache = new Map();

const TenderCard: React.FC<TenderCardProps> = ({ 
  tender, 
  onSaveToggle, 
  saved = false,
  showOwner = true,
  showStatus = false,
  viewDetailsLink
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
  const tenderType = tender?.tenderType || 'company';
  const company = tender?.company;
  const organization = tender?.organization;
  const proposals = tender?.proposals || [];

  // State for organization data
  const [organizationData, setOrganizationData] = useState<any>(null);
  const [loadingOrg, setLoadingOrg] = useState(false);

  // Fetch organization data if needed
  useEffect(() => {
    if (tenderType === 'organization' && typeof organization === 'string' && organization && !organizationData) {
      fetchOrganizationData(organization);
    }
  }, [tenderType, organization, organizationData]);

  const fetchOrganizationData = async (orgId: string) => {
    // Check cache first
    if (organizationCache.has(orgId)) {
      setOrganizationData(organizationCache.get(orgId));
      return;
    }

    setLoadingOrg(true);
    try {
      // You'll need to implement this API call in your tenderService
      // For now, we'll use a placeholder
      const orgData = {
        name: 'Loading...',
        industry: '',
        verified: false
      };
      
      // Simulate API call
      setTimeout(() => {
        const fakeOrgData = {
          name: orgId === '68ed1c7723f8e65f3d4776c7' ? 'Lutheran World Federation' : 'Organization',
          industry: orgId === '68ed1c7723f8e65f3d4776c7' ? 'Humanitarian Aid' : 'Various Services',
          verified: true
        };
        organizationCache.set(orgId, fakeOrgData);
        setOrganizationData(fakeOrgData);
        setLoadingOrg(false);
      }, 100);
    } catch (error) {
      console.error('Error fetching organization data:', error);
      setLoadingOrg(false);
    }
  };

  // SAFELY determine owner info based on tender type
  const getOwnerInfo = () => {
    if (tenderType === 'organization') {
      if (typeof organization === 'object' && organization !== null) {
        // Organization data is already populated
        return {
          name: organization.name || 'Organization',
          verified: organization.verified || false,
          industry: organization.industry || '',
          type: 'organization'
        };
      } else if (typeof organization === 'string' && organizationData) {
        // We have fetched organization data
        return {
          name: organizationData.name || 'Organization',
          verified: organizationData.verified || false,
          industry: organizationData.industry || '',
          type: 'organization'
        };
      } else if (typeof organization === 'string') {
        // Still loading or no data
        return {
          name: loadingOrg ? 'Loading...' : 'Organization',
          verified: false,
          industry: '',
          type: 'organization'
        };
      }
      // Fallback
      return {
        name: 'Organization',
        verified: false,
        industry: '',
        type: 'organization'
      };
    } else {
      // Company tender
      return {
        name: company?.name || 'Company',
        verified: company?.verified || false,
        industry: company?.industry || '',
        type: 'company'
      };
    }
  };

  const ownerInfo = getOwnerInfo();

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
      case 'open':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTenderTypeColor = (type: string) => {
    return type === 'organization' 
      ? 'bg-purple-100 text-purple-800 border-purple-200' 
      : 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getTenderTypeIcon = (type: string) => {
    return type === 'organization' 
      ? <BuildingLibraryIcon className="h-3 w-3" />
      : <BuildingOfficeIcon className="h-3 w-3" />;
  };

  const getTenderTypeLabel = (type: string) => {
    return type === 'organization' ? 'Organization Project' : 'Company Project';
  };

  // Determine the appropriate details link
  const getDetailsLink = () => {
    if (viewDetailsLink) return viewDetailsLink;
    return `/tenders/${tenderId}`;
  };

  if (!tender) {
    return (
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="text-gray-500 text-center">Tender not available</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-200 overflow-hidden group">
      <div className="p-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-3">
              {showStatus && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              )}
              <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getTenderTypeColor(tenderType)}`}>
                {getTenderTypeIcon(tenderType)}
                {getTenderTypeLabel(tenderType)}
              </span>
              {visibility === 'invite_only' && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200">
                  Invite Only
                </span>
              )}
            </div>
            <Link href={getDetailsLink()}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 cursor-pointer line-clamp-2 mb-2 group-hover:translate-x-1 transition-transform">
                {title}
              </h3>
            </Link>
          </div>
          
          {onSaveToggle && (
            <button
              onClick={handleSaveClick}
              className="flex-shrink-0 p-2 text-gray-400 hover:text-blue-500 transition-colors hover:scale-110"
            >
              {saved ? (
                <BookmarkSolid className="h-5 w-5 text-blue-500" />
              ) : (
                <BookmarkIcon className="h-5 w-5" />
              )}
            </button>
          )}
        </div>

        {/* Owner Info */}
        {showOwner && (
          <div className="flex items-center gap-2 mb-3">
            {ownerInfo.type === 'organization' ? (
              <BuildingLibraryIcon className="h-4 w-4 text-purple-500" />
            ) : (
              <BuildingOfficeIcon className="h-4 w-4 text-blue-500" />
            )}
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 flex items-center gap-1">
                {ownerInfo.name}
                {ownerInfo.verified && (
                  <CheckBadgeIcon className="h-4 w-4 text-blue-500" />
                )}
              </span>
              {ownerInfo.industry && (
                <span className="text-xs text-gray-500 capitalize">{ownerInfo.industry}</span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {description}
        </p>

        {/* Skills */}
        {skillsRequired.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {skillsRequired.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                  ownerInfo.type === 'organization' 
                    ? 'bg-purple-100 text-purple-800' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {skill}
              </span>
            ))}
            {skillsRequired.length > 4 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{skillsRequired.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1">
            <UsersIcon className="h-3 w-3" />
            <span>{tender.proposals?.length || 0} proposals</span>
          </div>
          <div className="flex items-center gap-1">
            <BookmarkIcon className="h-3 w-3" />
            <span>{tender.metadata?.savedBy?.length || 0} saves</span>
          </div>
        </div>

        {/* Footer Info */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100">
          {/* Budget */}
          {budget && (budget.min > 0 || budget.max > 0) && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <CurrencyDollarIcon className="h-4 w-4" />
              <span className="font-semibold text-gray-900">
                {formatCurrency(budget.min, budget.currency)} - {formatCurrency(budget.max, budget.currency)}
                {budget.isNegotiable && (
                  <span className="text-xs text-gray-500 ml-1">(Negotiable)</span>
                )}
              </span>
            </div>
          )}

          {/* Deadline */}
          <div className="flex items-center gap-1 text-sm">
            <CalendarIcon className="h-4 w-4 text-gray-400" />
            <span className={isExpired ? "text-red-600 font-medium" : "text-gray-600"}>
              {isExpired ? 'Expired' : `${daysRemaining}d left`}
            </span>
          </div>

          {/* Duration */}
          {duration > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ClockIcon className="h-4 w-4" />
              <span>{duration}d</span>
            </div>
          )}
        </div>

        {/* View Details Button */}
        <div className="mt-4">
          <Link href={getDetailsLink()}>
            <button className={`w-full py-2.5 px-4 rounded-xl transition-all duration-300 font-medium text-sm ${
              ownerInfo.type === 'organization'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-sm hover:shadow-md'
                : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-sm hover:shadow-md'
            }`}>
              View Project Details
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TenderCard;