// src/components/organization/OrganizationCard.tsx
import React from 'react';
import { OrganizationProfile } from '@/services/organizationService';
import { colors, colorClasses } from '@/utils/color';

interface OrganizationCardProps {
  organization: OrganizationProfile;
  onClick?: () => void;
  variant?: 'default' | 'compact' | 'featured';
  className?: string;
}

export const OrganizationCard: React.FC<OrganizationCardProps> = ({
  organization,
  onClick,
  variant = 'default',
  className = ''
}) => {
  const getOrganizationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'non-profit': 'Non-Profit',
      'government': 'Government',
      'educational': 'Education',
      'healthcare': 'Healthcare',
      'other': 'Other'
    };
    return types[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      'non-profit': 'bg-blue-100 text-blue-800',
      'government': 'bg-green-100 text-green-800',
      'educational': 'bg-purple-100 text-purple-800',
      'healthcare': 'bg-red-100 text-red-800',
      'other': 'bg-gray-100 text-gray-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (variant === 'compact') {
    return (
      <div 
        onClick={onClick}
        className={`${colorClasses.bg.white} rounded-lg shadow-md p-4 border ${colorClasses.border.gray100} hover:shadow-lg transition-all duration-200 cursor-pointer ${className}`}
      >
        <div className="flex items-center space-x-3">
          {organization.logoFullUrl && (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold ${colorClasses.text.darkNavy} truncate`}>
              {organization.name}
            </h3>
            <p className={`text-sm ${colorClasses.text.gray400} truncate`}>
              {organization.industry}
            </p>
          </div>
          {organization.verified && (
            <span className={`px-2 py-1 text-xs rounded-full ${colorClasses.bg.teal} text-white`}>
              Verified
            </span>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div 
        onClick={onClick}
        className={`${colorClasses.bg.white} rounded-xl shadow-lg p-6 border ${colorClasses.border.gray100} hover:shadow-xl transition-all duration-300 cursor-pointer group ${className}`}
      >
        {/* Banner Image */}
        {organization.bannerFullUrl && (
          <div className="mb-4 -mx-6 -mt-6 rounded-t-xl overflow-hidden">
            <img 
              src={organization.bannerFullUrl} 
              alt={`${organization.name} banner`}
              className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}
        
        <div className="flex items-start space-x-4">
          {/* Logo */}
          {organization.logoFullUrl && (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-16 h-16 rounded-xl object-cover border-2 border-white shadow-md"
            />
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h3 className={`font-bold text-lg ${colorClasses.text.darkNavy} group-hover:${colorClasses.text.goldenMustard} transition-colors`}>
                {organization.name}
              </h3>
              {organization.verified && (
                <span className={`px-2 py-1 text-xs rounded-full ${colorClasses.bg.teal} text-white flex items-center`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-3">
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(organization.organizationType || 'other')}`}>
                {getOrganizationTypeLabel(organization.organizationType || 'other')}
              </span>
              {organization.industry && (
                <span className={`px-2 py-1 text-xs rounded-full ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                  {organization.industry}
                </span>
              )}
            </div>
            
            {organization.mission && (
              <p className={`text-sm ${colorClasses.text.gray800} line-clamp-2 mb-3`}>
                {organization.mission}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <span className={`${colorClasses.text.gray400}`}>
                {organization.address && `${organization.address.split(',')[0]}`}
              </span>
              <span className={`font-medium ${colorClasses.text.goldenMustard}`}>
                Learn More →
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div 
      onClick={onClick}
      className={`${colorClasses.bg.white} rounded-lg shadow-md p-6 border ${colorClasses.border.gray100} hover:shadow-lg transition-all duration-200 cursor-pointer group ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {organization.logoFullUrl && (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className={`font-semibold ${colorClasses.text.darkNavy} group-hover:${colorClasses.text.goldenMustard} transition-colors`}>
              {organization.name}
            </h3>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(organization.organizationType || 'other')}`}>
                {getOrganizationTypeLabel(organization.organizationType || 'other')}
              </span>
              {organization.verified && (
                <span className={`px-2 py-1 text-xs rounded-full ${colorClasses.bg.teal} text-white flex items-center`}>
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {organization.industry && (
        <p className={`text-sm ${colorClasses.text.gray800} mb-3`}>
          <strong>Industry:</strong> {organization.industry}
        </p>
      )}

      {organization.description && (
        <p className={`text-sm ${colorClasses.text.gray800} mb-4 line-clamp-2`}>
          {organization.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          {organization.address && (
            <span className={`flex items-center ${colorClasses.text.gray400}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
              {organization.address.split(',')[0]}
            </span>
          )}
          {organization.website && (
            <span className={`flex items-center ${colorClasses.text.gray400}`}>
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
              </svg>
              Website
            </span>
          )}
        </div>
        <span className={`font-medium ${colorClasses.text.goldenMustard} group-hover:${colorClasses.text.gold} transition-colors`}>
          View Details
        </span>
      </div>
    </div>
  );
};