// src/components/organization/OrganizationCard.tsx - UPDATED
import React from 'react';
import { OrganizationProfile, organizationService } from '@/services/organizationService';
import Link from 'next/link';
import { 
  MapPin, 
  Globe, 
  Building2, 
  CheckCircle2
} from 'lucide-react';

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
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  const getTypeColor = (type: string) => {
    const colors = {
      'non-profit': 'bg-blue-100 text-blue-700 border-blue-200',
      'government': 'bg-green-100 text-green-700 border-green-200',
      'educational': 'bg-purple-100 text-purple-700 border-purple-200',
      'healthcare': 'bg-red-100 text-red-700 border-red-200',
      'other': 'bg-gray-100 text-gray-700 border-gray-200'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  // Compact variant for lists
  if (variant === 'compact') {
    return (
      <div 
        onClick={handleClick}
        className={`bg-white rounded-lg p-4 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
      >
        <div className="flex items-center space-x-3">
          {organization.logoFullUrl ? (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-10 h-10 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                // Silently handle image errors
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate group-hover:text-teal-600 transition-colors">
                {organization.name}
              </h3>
              {organization.verified && (
                <CheckCircle2 className="w-4 h-4 text-teal-500 flex-shrink-0" />
              )}
            </div>
            
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              {organization.industry && (
                <span className="truncate">{organization.industry}</span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end space-y-1">
            {organization.organizationType && (
              <span className={`px-2 py-1 text-xs rounded-full ${getTypeColor(organization.organizationType)}`}>
                {organizationService.getOrganizationTypeLabel(organization.organizationType)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Featured variant for highlights
  if (variant === 'featured') {
    return (
      <div 
        onClick={handleClick}
        className={`bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 border border-gray-200 hover:border-teal-300 hover:shadow-lg transition-all duration-300 cursor-pointer group ${className}`}
      >
        <div className="flex items-start space-x-4">
          {/* Logo */}
          {organization.logoFullUrl ? (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-16 h-16 rounded-xl object-cover border-4 border-white shadow-lg flex-shrink-0"
              onError={(e) => {
                // Silently handle image errors
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 border-4 border-white shadow-lg flex items-center justify-center flex-shrink-0">
              <Building2 className="w-8 h-8 text-white" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="font-bold text-lg text-gray-900 group-hover:text-teal-600 transition-colors">
                    {organization.name}
                  </h3>
                  {organization.verified && (
                    <div className="flex items-center space-x-1 px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Verified</span>
                    </div>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mb-3">
                  {organization.organizationType && (
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTypeColor(organization.organizationType)}`}>
                      {organizationService.getOrganizationTypeLabel(organization.organizationType)}
                    </span>
                  )}
                  {organization.industry && (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
                      {organization.industry}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {organization.description && (
              <p className="text-gray-700 line-clamp-2 mb-4 leading-relaxed text-sm">
                {organization.description}
              </p>
            )}
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4 text-gray-600">
                {organization.address && (
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-4 h-4" />
                    <span className="truncate max-w-[120px]">{organization.address}</span>
                  </div>
                )}
                {organization.website && (
                  <div className="flex items-center space-x-1">
                    <Globe className="w-4 h-4" />
                    <span>Website</span>
                  </div>
                )}
              </div>
              
              <span className="text-teal-600 font-semibold group-hover:text-teal-700 transition-colors">
                View Profile →
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
      onClick={handleClick}
      className={`bg-white rounded-lg p-6 border border-gray-200 hover:border-teal-300 hover:shadow-md transition-all duration-200 cursor-pointer group ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          {organization.logoFullUrl ? (
            <img 
              src={organization.logoFullUrl} 
              alt={organization.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200"
              onError={(e) => {
                // Silently handle image errors
                e.currentTarget.style.display = 'none';
                const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                if (fallback) fallback.style.display = 'flex';
              }}
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
          )}
          
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors">
                {organization.name}
              </h3>
              {organization.verified && (
                <CheckCircle2 className="w-4 h-4 text-teal-500" />
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              {organization.organizationType && (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(organization.organizationType)}`}>
                  {organizationService.getOrganizationTypeLabel(organization.organizationType)}
                </span>
              )}
              {organization.industry && (
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                  {organization.industry}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {organization.description && (
        <p className="text-gray-700 line-clamp-2 mb-4 leading-relaxed text-sm">
          {organization.description}
        </p>
      )}

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4 text-gray-600">
          {organization.address && (
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span className="truncate max-w-[100px]">{organization.address}</span>
            </div>
          )}
          
          {organization.website && (
            <div className="flex items-center space-x-1">
              <Globe className="w-4 h-4" />
              <span>Website</span>
            </div>
          )}
        </div>
        
        <span className="text-teal-600 font-medium group-hover:text-teal-700 transition-colors">
          Learn More
        </span>
      </div>
    </div>
  );
};