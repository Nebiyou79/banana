import React, { useEffect } from 'react';
import Image from 'next/image';
import { Users, Heart, Globe, Award, BarChart3, Target, ChevronRight, Shield, DollarSign } from 'lucide-react';
import { OrganizationAdData, trackImpression } from '@/data/ads';

interface OrganizationAdCardProps extends OrganizationAdData {
    className?: string;
}

const OrganizationAdCard: React.FC<OrganizationAdCardProps> = ({
    id,
    title,
    subtitle,
    link,
    image,
    cause,
    volunteers,
    impact,
    location,
    partners,
    cta,
    sponsored,
    verified,
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
                <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-emerald-600">
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
                        {verified && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-full text-xs font-semibold backdrop-blur-sm">
                                <Shield className="w-3 h-3" />
                                <span>Verified</span>
                            </div>
                        )}
                        {sponsored && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                                <Award className="w-3 h-3" />
                                <span>Sponsored</span>
                            </div>
                        )}
                    </div>

                    {/* Impact Badge */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                        <Heart className="w-4 h-4 text-white" />
                        <span className="text-white text-sm font-semibold">{impact}</span>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Cause Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center shadow-lg">
                            <Heart className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{cause}</h3>
                            <p className="text-gray-600 text-sm">Non-Profit Initiative</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Users className="w-4 h-4 text-emerald-500" />
                            <div>
                                <div className="text-sm font-semibold">{volunteers.toLocaleString()}+</div>
                                <div className="text-xs text-gray-500">Volunteers</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                            <Globe className="w-4 h-4 text-emerald-500" />
                            <div>
                                <div className="text-sm font-semibold">{location}</div>
                                <div className="text-xs text-gray-500">Location</div>
                            </div>
                        </div>
                    </div>

                    {/* Partners */}
                    {partners && partners.length > 0 && (
                        <div className="mb-4">
                            <div className="text-sm text-gray-600 mb-2">Trusted Partners:</div>
                            <div className="flex flex-wrap gap-2">
                                {partners.slice(0, 3).map((partner, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1.5 bg-gradient-to-r from-emerald-50 to-emerald-100 text-emerald-700 rounded-lg text-sm font-medium"
                                    >
                                        {partner}
                                    </span>
                                ))}
                                {partners.length > 3 && (
                                    <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                                        +{partners.length - 3} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Impact Metrics */}
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
                            <DollarSign className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <div className="text-xs text-gray-600">Funds Raised</div>
                            <div className="font-bold text-gray-900">{metrics.fundsRaised}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
                            <Target className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <div className="text-xs text-gray-600">Projects</div>
                            <div className="font-bold text-gray-900">{metrics.projects}</div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-3 text-center">
                            <Users className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                            <div className="text-xs text-gray-600">Communities</div>
                            <div className="font-bold text-gray-900">{metrics.communities}</div>
                        </div>
                    </div>

                    {/* Ad Content */}
                    <div className="space-y-3 mb-4">
                        <h4 className="font-bold text-gray-900 text-lg leading-snug">{title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{subtitle}</p>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-xl font-semibold hover:from-emerald-700 hover:to-emerald-800 transition-all duration-300 group"
                    >
                        {cta}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
                        Tax Deductible • 100% Transparent • Social Impact Ad
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrganizationAdCard;