// components/company/CompanyHero.tsx - UPDATED WITH IMAGE HANDLING
import { CompanyProfile } from '@/services/companyService';
import { Building2, MapPin, Globe, Calendar, Pencil } from 'lucide-react';
import Button from '../forms/Button';
import { companyService } from '@/services/companyService';

interface CompanyHeroProps {
  company: CompanyProfile;
  isOwner: boolean;
  onEdit: () => void;
}

export default function CompanyHero({ company, isOwner, onEdit }: CompanyHeroProps) {
  const bannerUrl = companyService.getFullImageUrl(company.bannerUrl);
  const logoUrl = companyService.getFullImageUrl(company.logoUrl);

  return (
    <div className="relative bg-white rounded-xl shadow-sm border overflow-hidden">
      {/* Banner */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-blue-800 relative">
        {bannerUrl ? (
          <img
            src={bannerUrl}
            alt={`${company.name} banner`}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Hide the image and let the gradient show through
              e.currentTarget.style.display = 'none';
            }}
          />
        ) : null}
        
        {/* Edit Button */}
        {isOwner && (
          <div className="absolute top-4 right-4">
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
              <img
                src={logoUrl}
                alt={`${company.name} logo`}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  // Fallback to building icon
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
            ) : null}
            {(!logoUrl || !company.logoUrl) && (
              <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Company Info */}
      <div className="pt-12 pb-6 px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{company.name}</h1>
            
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-4">
              {company.industry && (
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" />
                  <span>{company.industry}</span>
                </div>
              )}
              
              {company.address && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>{company.address}</span>
                </div>
              )}
              
              {company.website && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Website
                  </a>
                </div>
              )}
            </div>
            
            {company.description && (
              <p className="text-gray-700 leading-relaxed max-w-3xl">
                {company.description}
              </p>
            )}
          </div>
          
          <div className="mt-4 md:mt-0 flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Joined {new Date(company.createdAt).toLocaleDateString()}</span>
              </div>
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium mt-2 ${
                company.verified 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
              }`}>
                {company.verified ? 'Verified Company' : 'Verification Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}