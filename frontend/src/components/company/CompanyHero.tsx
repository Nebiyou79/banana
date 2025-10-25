// components/company/CompanyHero.tsx - UPDATED WITH TOAST SYSTEM
import { CompanyProfile } from '@/services/companyService';
import { Building2, MapPin, Globe, Calendar, Pencil, Info, Star, Award } from 'lucide-react';
import Button from '../forms/Button';
import { useState } from 'react';
import { getSafeImageUrl } from '@/lib/image-utils';
import { toast } from '@/hooks/use-toast';

interface CompanyHeroProps {
  company: CompanyProfile;
  isOwner: boolean;
  onEdit: () => void;
}

export default function CompanyHero({ company, isOwner, onEdit }: CompanyHeroProps) {
  const bannerUrl = getSafeImageUrl(company.bannerUrl);
  const logoUrl = getSafeImageUrl(company.logoUrl);
  const [showBannerGuide, setShowBannerGuide] = useState(false);

  const handleEdit = () => {
    try {
      onEdit();
    } catch (error) {
      toast({
        title: 'Edit Error',
        description: 'Unable to open edit form',
        variant: 'destructive',
      });
    }
  };

  const handleBannerGuideOpen = () => {
    try {
      setShowBannerGuide(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to open banner guide',
        variant: 'destructive',
      });
    }
  };

  const handleBannerGuideClose = () => {
    try {
      setShowBannerGuide(false);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Unable to close banner guide',
        variant: 'destructive',
      });
    }
  };

  const handleImageError = (imageType: string) => {
    console.warn(`Failed to load ${imageType} for company: ${company.name}`);
    // Error is handled by handleImageError utility, no need for toast
  };

  const BannerGuideModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Banner Upload Guide
            </h2>
            <button
              onClick={handleBannerGuideClose}
              className="p-2 hover:bg-white rounded-xl transition-all duration-200 hover:scale-110"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Enhanced Banner Template */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl overflow-hidden border-2 border-dashed border-blue-300 relative shadow-lg">
            <div className="aspect-video bg-gradient-to-br from-blue-500 to-purple-500 relative">
              {/* Safe Area Guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-yellow-400 border-dashed w-[60%] h-[60%] flex items-center justify-center bg-yellow-400/10 backdrop-blur-sm">
                  <span className="text-yellow-400 font-bold text-lg bg-black/70 px-4 py-3 rounded-xl shadow-lg">
                    Safe Area (1546×423px)
                  </span>
                </div>
              </div>
              
              {/* Dimension Labels */}
              <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                📏 2560px
              </div>
              <div className="absolute top-3 right-3 bg-black/80 text-white px-3 py-1.5 rounded-lg text-sm font-medium shadow-lg">
                📐 1440px
              </div>
            </div>
          </div>

          {/* Enhanced Requirements Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-blue-100 rounded-lg">📐</span>
                Technical Requirements
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  { text: 'Dimensions: 2560 × 1440 pixels', icon: '📏' },
                  { text: 'Format: JPG, PNG, or WebP', icon: '🖼️' },
                  { text: 'Max Size: 5MB', icon: '💾' },
                  { text: 'Safe Area: Keep important content within 1546×423px center', icon: '🎯' }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <span className="p-2 bg-green-100 rounded-lg">💡</span>
                Best Practices
              </h3>
              <ul className="space-y-3 text-gray-700">
                {[
                  { text: 'Use high-quality, professional images', icon: '⭐' },
                  { text: 'Brand colors that match your logo', icon: '🎨' },
                  { text: 'Avoid important content near edges', icon: '⚠️' },
                  { text: 'Optimize for fast loading', icon: '⚡' }
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <span className="text-lg">{item.icon}</span>
                    <span className="text-sm font-medium">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Enhanced Device Preview */}
          <div className="border border-gray-200 rounded-xl p-6 bg-gradient-to-br from-gray-50 to-white">
            <h3 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-purple-100 rounded-lg">📱</span>
              How it appears on different devices
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { device: 'Mobile', width: 'w-20', height: 'h-40', top: '20%', bottom: '20%', left: '10%', right: '10%' },
                { device: 'Tablet', width: 'w-32', height: 'h-20', top: '25%', bottom: '25%', left: '15%', right: '15%' },
                { device: 'Desktop', width: 'w-40', height: 'h-24', top: '15%', bottom: '15%', left: '5%', right: '5%' }
              ].map((item, index) => (
                <div key={index} className="text-center group">
                  <div className="bg-gray-800 rounded-2xl p-3 inline-block shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <div className={`${item.width} ${item.height} bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg relative overflow-hidden`}>
                      <div className="absolute inset-0 border border-yellow-400/60" style={{
                        top: item.top,
                        bottom: item.bottom,
                        left: item.left,
                        right: item.right
                      }}></div>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-700 mt-3 group-hover:text-blue-600 transition-colors">
                    {item.device}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative bg-white rounded-2xl shadow-xl border border-gray-200/60 overflow-hidden backdrop-blur-sm">
      {/* Enhanced Banner with Gradient Overlay */}
      <div className="h-48 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
        {bannerUrl ? (
              <img
                src={bannerUrl}
                alt={`${company.name} banner`}
                className="absolute inset-0 w-full h-full object-cover object-center"
                onError={() => handleImageError('banner')}
                sizes="100vw"
              />
        ) : null}
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        
        {/* Enhanced Action Buttons */}
        {isOwner && (
          <div className="absolute top-4 right-4 flex gap-3">
            <Button
              onClick={handleBannerGuideOpen}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white border-blue-200 text-blue-700 hover:text-blue-800 hover:border-blue-300 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
            >
              <Info className="w-4 h-4" />
              Banner Guide
            </Button>
            <Button
              onClick={handleEdit}
              variant="outline"
              size="sm"
              className="bg-white/90 backdrop-blur-sm hover:bg-white border-purple-200 text-purple-700 hover:text-purple-800 hover:border-purple-300 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <Pencil className="w-4 h-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        )}
        
        {/* Enhanced Logo with Glow Effect */}
        <div className="absolute -bottom-6 left-8">
          <div className="bg-white rounded-2xl p-2 shadow-2xl border border-gray-200/60 backdrop-blur-sm">
            {logoUrl ? (
              <div className="relative">
                <img
                  src={logoUrl}
                  alt={`${company.name} logo`}
                  className="w-20 h-20 object-cover rounded-xl shadow-lg"
                  onError={() => handleImageError('logo')}
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-inner">
                <Building2 className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Enhanced Company Info */}
      <div className="pt-10 pb-8 px-8">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {company.name}
              </h1>
              {company.verified && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full text-sm font-semibold shadow-lg">
                  <Award className="w-4 h-4" />
                  <span>Verified</span>
                </div>
              )}
            </div>
            
            {/* Enhanced Info Grid */}
            <div className="flex flex-wrap items-center gap-4 text-gray-600 mb-6">
              {company.industry && (
                <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">{company.industry}</span>
                </div>
              )}
              
              {company.address && (
                <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg border border-red-100">
                  <MapPin className="w-4 h-4 text-red-600" />
                  <span className="font-medium text-red-700">{company.address}</span>
                </div>
              )}
              
              {company.website && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-100">
                  <Globe className="w-4 h-4 text-purple-600" />
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium text-purple-700 hover:text-purple-800 hover:underline transition-colors"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </div>
            
            {company.description && (
              <p className="text-gray-700 leading-relaxed text-lg max-w-4xl border-l-4 border-blue-500 pl-4 bg-blue-50/50 py-3 rounded-r-lg">
                {company.description}
              </p>
            )}
          </div>
          
          {/* Enhanced Side Info */}
          <div className="lg:text-right space-y-3">
            <div className="flex lg:flex-col items-center gap-4 lg:gap-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Joined {new Date(company.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</span>
              </div>
              
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold border shadow-sm ${
                company.verified 
                  ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-200' 
                  : 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border-yellow-200'
              }`}>
                <Star className="w-4 h-4 mr-2" />
                {company.verified ? 'Verified Company' : 'Verification Pending'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Banner Guide Modal */}
      {showBannerGuide && <BannerGuideModal />}
    </div>
  );
}