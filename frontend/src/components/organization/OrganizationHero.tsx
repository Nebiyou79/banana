// src/components/organization/OrganizationHero.tsx
import React from 'react';
import { OrganizationProfile } from '@/services/organizationService';
import { colors, colorClasses } from '@/utils/color';

interface OrganizationHeroProps {
  organization: OrganizationProfile;
  onEdit?: () => void;
  showEditButton?: boolean;
}

export const OrganizationHero: React.FC<OrganizationHeroProps> = ({
  organization,
  onEdit,
  showEditButton = false
}) => {
  const getOrganizationTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      'non-profit': 'Non-Profit Organization',
      'government': 'Government Agency',
      'educational': 'Educational Institution',
      'healthcare': 'Healthcare Organization',
      'other': 'Organization'
    };
    return types[type] || 'Organization';
  };

  return (
    <div className="relative">
      {/* Banner Section */}
      <div className="relative h-64 md:h-80 bg-gradient-to-r from-blue-600 to-purple-700">
        {organization.bannerFullUrl ? (
          <img 
            src={organization.bannerFullUrl} 
            alt={`${organization.name} banner`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-blue-600 to-purple-700 flex items-center justify-center">
            <div className="text-center text-white">
              <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
              </svg>
              <p className="text-xl font-semibold">{organization.name}</p>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
        
        {/* Edit Button */}
        {showEditButton && onEdit && (
          <div className="absolute top-4 right-4">
            <button
              onClick={onEdit}
              className={`px-4 py-2 rounded-lg font-semibold text-white transition-all duration-200 ${colorClasses.bg.goldenMustard} hover:${colorClasses.bg.gold} transform hover:scale-105 flex items-center space-x-2`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit Profile</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Info Section */}
      <div className="relative -mt-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className={`${colorClasses.bg.white} rounded-2xl shadow-2xl p-8`}>
            <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
              {/* Logo */}
              <div className="flex-shrink-0">
                {organization.logoFullUrl ? (
                  <img 
                    src={organization.logoFullUrl} 
                    alt={organization.name}
                    className="w-32 h-32 rounded-2xl object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className={`w-32 h-32 rounded-2xl ${colorClasses.bg.gray100} border-4 border-white shadow-lg flex items-center justify-center`}>
                    <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Organization Details */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                  <div>
                    <h1 className={`text-3xl font-bold ${colorClasses.text.darkNavy} mb-2`}>
                      {organization.name}
                    </h1>
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses.bg.blue} text-white`}>
                        {getOrganizationTypeLabel(organization.organizationType || 'other')}
                      </span>
                      {organization.verified && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses.bg.teal} text-white flex items-center`}>
                          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          Verified Organization
                        </span>
                      )}
                      {organization.industry && (
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${colorClasses.bg.gray100} ${colorClasses.text.gray800}`}>
                          {organization.industry}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Mission Statement */}
                {organization.mission && (
                  <div className="mb-6">
                    <p className={`text-lg italic ${colorClasses.text.gray800} border-l-4 ${colorClasses.border.goldenMustard} pl-4 py-1`}>
                      `{organization.mission}``
                    </p>
                  </div>
                )}

                {/* Contact & Location Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {organization.address && (
                    <div className="flex items-center space-x-2">
                      <svg className={`w-5 h-5 ${colorClasses.text.goldenMustard}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span className={`text-sm ${colorClasses.text.gray800}`}>{organization.address}</span>
                    </div>
                  )}
                  
                  {organization.phone && (
                    <div className="flex items-center space-x-2">
                      <svg className={`w-5 h-5 ${colorClasses.text.goldenMustard}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      <span className={`text-sm ${colorClasses.text.gray800}`}>{organization.phone}</span>
                    </div>
                  )}
                  
                  {organization.website && (
                    <div className="flex items-center space-x-2">
                      <svg className={`w-5 h-5 ${colorClasses.text.goldenMustard}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9" />
                      </svg>
                      <a 
                        href={organization.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={`text-sm ${colorClasses.text.blue} hover:underline`}
                      >
                        Visit Website
                      </a>
                    </div>
                  )}
                  
                  {organization.registrationNumber && (
                    <div className="flex items-center space-x-2">
                      <svg className={`w-5 h-5 ${colorClasses.text.goldenMustard}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className={`text-sm ${colorClasses.text.gray800}`}>Reg: {organization.registrationNumber}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            {organization.description && (
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className={`text-lg font-semibold ${colorClasses.text.darkNavy} mb-3`}>About Us</h3>
                <p className={`${colorClasses.text.gray800} leading-relaxed`}>
                  {organization.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};