import React, { useEffect } from 'react';
import Image from 'next/image';
import { Briefcase, MapPin, DollarSign, Clock, TrendingUp, Star, ChevronRight } from 'lucide-react';
import { CandidateAdData, trackImpression } from '@/data/ads';

interface CandidateAdCardProps extends CandidateAdData {
  className?: string;
}

const CandidateAdCard: React.FC<CandidateAdCardProps> = ({
  id,
  title,
  subtitle,
  link,
  image,
  jobTitle,
  company,
  salary,
  location,
  cta,
  sponsored,
  featured,
  jobMatch,
  applicants,
  experienceLevel,
  employmentType,
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
        <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-600">
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
            {featured && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                <Star className="w-3 h-3" fill="currentColor" />
                <span>Featured</span>
              </div>
            )}
            {sponsored && (
              <div className="flex items-center gap-1 px-3 py-1.5 bg-blue-700/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                <TrendingUp className="w-3 h-3" />
                <span>Sponsored</span>
              </div>
            )}
          </div>

          {/* Quick Info Overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-lg">{jobTitle}</h3>
                <p className="text-white/90 text-sm">{company}</p>
              </div>
              {jobMatch && (
                <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                  <span className="text-white text-sm font-semibold">{jobMatch}% Match</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta Information */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <DollarSign className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{salary}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{location}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{experienceLevel}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">{employmentType}</span>
            </div>
          </div>

          {/* Ad Content */}
          <div className="space-y-3 mb-4">
            <h4 className="font-bold text-gray-900 text-lg leading-snug">{title}</h4>
            <p className="text-gray-600 text-sm leading-relaxed">{subtitle}</p>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-4">
              {applicants && (
                <span>{applicants}+ applicants</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span>Active now</span>
            </div>
          </div>

          {/* CTA Button */}
          <button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 group"
          >
            {cta}
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CandidateAdCard;