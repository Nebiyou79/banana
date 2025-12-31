import React, { useEffect } from 'react';
import Image from 'next/image';
import { Building, Users, TrendingUp, Target, Award, BarChart3, DollarSign, ChevronRight } from 'lucide-react';
import { CompanyAdData, trackImpression } from '@/data/ads';

interface CompanyAdCardProps extends CompanyAdData {
  className?: string;
}

const CompanyAdCard: React.FC<CompanyAdCardProps> = ({
  id,
  title,
  subtitle,
  link,
  image,
  service,
  company,
  clients,
  rating,
  industry,
  cta,
  sponsored,
  enterprise,
  metrics,
  className = ''
}) => {
  useEffect(() => {
    trackImpression(id);
  }, [id]);

  const handleClick = () => {
    window.open(link, '_blank');
  };

  return (
    <div className={`group relative ${className}`}>
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
        {/* Header */}
        <div className="relative h-48 bg-gradient-to-r from-purple-500 to-purple-600">
          <div className="absolute inset-0 bg-black/20" />
          <Image
            src={image || '/ads/default.jpg'}
            alt={title}
            fill
            className="object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {enterprise && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                <Building className="w-3 h-3" />
                <span>Enterprise</span>
              </div>
            )}
            {sponsored && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-purple-700/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Sponsored</span>
              </div>
            )}
          </div>

          {/* Rating Badge */}
          <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
            <Award className="w-4 h-4 text-white" />
            <span className="text-white text-sm font-semibold">{rating} ★</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Company Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Building className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{company}</h3>
              <p className="text-gray-600 text-sm">{service}</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-sm font-semibold">{clients.toLocaleString()}+</div>
                <div className="text-xs text-gray-500">Clients</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-sm font-semibold">{industry}</div>
                <div className="text-xs text-gray-500">Industry</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <BarChart3 className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-sm font-semibold">{metrics.roi}</div>
                <div className="text-xs text-gray-500">Avg ROI</div>
              </div>
            </div>
          </div>

          {/* Ad Content */}
          <div className="space-y-3 mb-4">
            <h4 className="font-bold text-gray-900 text-lg leading-snug">{title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{subtitle}</p>
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
              <DollarSign className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Savings</div>
              <div className="font-bold text-gray-900">{metrics.savings}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
              <Users className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">Support</div>
              <div className="font-bold text-gray-900">{metrics.support}</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-3 text-center">
              <BarChart3 className="w-4 h-4 text-purple-600 mx-auto mb-1" />
              <div className="text-xs text-gray-600">ROI</div>
              <div className="font-bold text-gray-900">{metrics.roi}</div>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-purple-800 transition-all duration-300 group"
          >
            {cta}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Footer */}
          <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
            Trusted by Fortune 500 companies • ISO Certified • Business Ad
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyAdCard;