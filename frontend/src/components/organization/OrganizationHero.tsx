// src/components/organization/OrganizationHero.tsx - UPDATED
import { OrganizationProfile } from '@/services/organizationService';
import { Building2, MapPin, Globe, Calendar, Target, Pencil, CheckCircle2, Info } from 'lucide-react';
import Button from '../forms/Button';
import { organizationService } from '@/services/organizationService';
import { useState } from 'react';
import Image from 'next/image';

interface OrganizationHeroProps {
  organization: OrganizationProfile;
  isOwner: boolean;
  onEdit: () => void;
}

export default function OrganizationHero({ organization, isOwner, onEdit }: OrganizationHeroProps) {
  const bannerUrl = organizationService.getFullImageUrl(organization.bannerUrl);
  const logoUrl = organizationService.getFullImageUrl(organization.logoUrl);
  const [showBannerGuide, setShowBannerGuide] = useState(false);

  const BannerGuideModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Banner Upload Guide</h2>
            <button
              onClick={() => setShowBannerGuide(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Banner Template */}
          <div className="bg-gradient-to-r from-teal-600 to-teal-800 rounded-lg overflow-hidden border-2 border-dashed border-teal-300 relative">
            <div className="aspect-video bg-teal-500 relative">
              {/* Safe Area Guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-yellow-400 border-dashed w-[60%] h-[60%] flex items-center justify-center">
                  <span className="text-yellow-400 font-semibold text-lg bg-black/50 px-4 py-2 rounded-lg">
                    Safe Area (1546×423px)
                  </span>
                </div>
              </div>
              
              {/* Dimension Labels */}
              <div className="absolute top-2 left-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                2560px
              </div>
              <div className="absolute top-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                1440px
              </div>
            </div>
          </div>

          {/* Requirements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">📐 Technical Requirements</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Dimensions:</strong> 2560 × 1440 pixels</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Format:</strong> JPG, PNG, or WebP</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Max Size:</strong> 5MB</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-teal-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span><strong>Safe Area:</strong> Keep important content within 1546×423px center</span>
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">💡 Best Practices</h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Use professional, organization-appropriate imagery</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Reflect your organization`s mission and values</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Avoid text and logos near the edges</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-1.5 flex-shrink-0"></div>
                  <span>Use colors that represent your cause</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Device Preview */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-4">📱 How it appears on different devices</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="bg-gray-800 rounded-lg p-2 inline-block">
                  <div className="w-20 h-40 bg-gradient-to-r from-teal-600 to-teal-800 rounded relative overflow-hidden">
                    <div className="absolute inset-0 border border-yellow-400/50" style={{
                      top: '20%',
                      bottom: '20%',
                      left: '10%',
                      right: '10%'
                    }}></div>
                  </div>
                </div>
                <p className="text-xs mt-2 text-gray-600">Mobile</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 rounded-lg p-2 inline-block">
                  <div className="w-32 h-20 bg-gradient-to-r from-teal-600 to-teal-800 rounded relative overflow-hidden">
                    <div className="absolute inset-0 border border-yellow-400/50" style={{
                      top: '25%',
                      bottom: '25%',
                      left: '15%',
                      right: '15%'
                    }}></div>
                  </div>
                </div>
                <p className="text-xs mt-2 text-gray-600">Tablet</p>
              </div>
              <div className="text-center">
                <div className="bg-gray-800 rounded-lg p-2 inline-block">
                  <div className="w-40 h-24 bg-gradient-to-r from-teal-600 to-teal-800 rounded relative overflow-hidden">
                    <div className="absolute inset-0 border border-yellow-400/50" style={{
                      top: '15%',
                      bottom: '15%',
                      left: '5%',
                      right: '5%'
                    }}></div>
                  </div>
                </div>
                <p className="text-xs mt-2 text-gray-600">Desktop</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-teal-600 to-teal-800 relative">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${organization.name} banner`}
            className="absolute inset-0 w-full h-full object-cover object-center"
            sizes="100vw"
            onError={(e) => {
              // Silently handle image errors - fallback to gradient background
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Edit Button & Banner Guide */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              onClick={() => setShowBannerGuide(true)}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Banner Guide
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        )}
        
        {/* Logo */}
        <div className="absolute -bottom-8 left-8">
          <div className="bg-white rounded-xl p-2 shadow-lg border">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt={`${organization.name} logo`}
                className="w-16 h-16 object-cover rounded-lg"
                width={64}
                height={64}
                onError={(e) => {
                  // Silently handle image errors
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            {(!logoUrl || !organization.logoUrl) && (
              <div className="w-16 h-16 bg-teal-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-teal-600" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Organization Info */}
      <div className="pt-12 pb-6 px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
              {organization.verified && (
                <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium border border-green-200">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              {organization.organizationType && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{organizationService.getOrganizationTypeLabel(organization.organizationType)}</span>
                </div>
              )}
              
              {organization.industry && (
                <div className="flex items-center gap-1">
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded-full">
                    {organization.industry}
                  </span>
                </div>
              )}
              
              {organization.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{organization.address}</span>
                </div>
              )}
              
              {organization.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={organization.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-teal-600 hover:text-teal-700 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>

            {/* Mission Statement */}
            {organization.mission && (
              <div className="mb-4 p-4 bg-teal-50 rounded-lg border border-teal-100">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-4 h-4 text-teal-600" />
                  <span className="text-sm font-medium text-teal-900">Our Mission</span>
                </div>
                <p className="text-gray-700 leading-relaxed italic">
                  {organization.mission}
                </p>
              </div>
            )}
            
            {organization.description && (
              <p className="text-gray-700 leading-relaxed max-w-3xl">
                {organization.description}
              </p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(organization.createdAt).toLocaleDateString()}</span>
              </div>
              {organization.registrationNumber && (
                <div className="text-sm text-gray-500 mt-1">
                  Reg: {organization.registrationNumber}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Banner Guide Modal */}
      {showBannerGuide && <BannerGuideModal />}
    </div>
  );
}