import React, { useEffect } from 'react';
import Image from 'next/image';
import { Sparkles, Clock, DollarSign, Zap, Star, ChevronRight, CheckCircle } from 'lucide-react';
import { FreelancerAdData, trackImpression } from '@/data/ads';

interface FreelancerAdCardProps extends FreelancerAdData {
    className?: string;
}

const FreelancerAdCard: React.FC<FreelancerAdCardProps> = ({
    id,
    title,
    subtitle,
    link,
    image,
    projectType,
    budget,
    duration,
    skills,
    rating,
    cta,
    sponsored,
    urgent,
    proposals,
    clientVerified,
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
                <div className="relative h-48 bg-gradient-to-r from-amber-500 to-amber-600">
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
                        {urgent && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-full text-xs font-semibold backdrop-blur-sm animate-pulse">
                                <Zap className="w-3 h-3" />
                                <span>URGENT</span>
                            </div>
                        )}
                        {sponsored && (
                            <div className="flex items-center gap-1 px-3 py-1.5 bg-amber-700/90 backdrop-blur-sm text-white rounded-full text-xs font-medium">
                                <Star className="w-3 h-3" fill="currentColor" />
                                <span>Sponsored</span>
                            </div>
                        )}
                    </div>

                    {/* Rating & Verified */}
                    <div className="absolute bottom-4 right-4 flex items-center gap-2">
                        {clientVerified && (
                            <div className="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                                <CheckCircle className="w-4 h-4 text-white" />
                                <span className="text-white text-sm font-medium">Verified</span>
                            </div>
                        )}
                        <div className="flex items-center gap-1 px-3 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                            <Star className="w-4 h-4 text-white" fill="white" />
                            <span className="text-white text-sm font-semibold">{rating} ★</span>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Project Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shadow-lg">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 text-lg">{projectType}</h3>
                            <p className="text-gray-600 text-sm">Freelance Project</p>
                        </div>
                    </div>

                    {/* Budget & Duration */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-700">
                                <DollarSign className="w-4 h-4 text-amber-500" />
                                <div>
                                    <div className="text-sm font-semibold">Budget</div>
                                    <div className="text-lg font-bold text-gray-900">{budget}</div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-3">
                            <div className="flex items-center gap-2 text-gray-700">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <div>
                                    <div className="text-sm font-semibold">Duration</div>
                                    <div className="text-lg font-bold text-gray-900">{duration}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    <div className="mb-4">
                        <div className="text-sm text-gray-600 mb-2">Required Skills:</div>
                        <div className="flex flex-wrap gap-2">
                            {skills.slice(0, 4).map((skill, index) => (
                                <span
                                    key={index}
                                    className="px-3 py-1.5 bg-gradient-to-r from-amber-50 to-amber-100 text-amber-700 rounded-lg text-sm font-medium"
                                >
                                    {skill}
                                </span>
                            ))}
                            {skills.length > 4 && (
                                <span className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                                    +{skills.length - 4} more
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Ad Content */}
                    <div className="space-y-3 mb-4">
                        <h4 className="font-bold text-gray-900 text-lg leading-snug">{title}</h4>
                        <p className="text-gray-600 text-sm leading-relaxed">{subtitle}</p>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        {proposals && (
                            <span>{proposals} proposals submitted</span>
                        )}
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Accepting proposals</span>
                        </div>
                    </div>

                    {/* CTA Button */}
                    <button
                        onClick={handleClick}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-600 to-amber-700 text-white rounded-xl font-semibold hover:from-amber-700 hover:to-amber-800 transition-all duration-300 group"
                    >
                        {cta}
                        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* Footer */}
                    <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-500 text-center">
                        Secure payments • Project management tools • Time tracking included
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FreelancerAdCard;