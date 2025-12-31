'use client';

import React, { useState, useEffect } from 'react';
import {
    Filter,
    X,
    Users,
    Building2,
    Briefcase,
    MapPin,
    Star,
    Check,
    ChevronDown,
    Hash,
    Sparkles,
    User,
    TrendingUp,
    Shield,
    Target
} from 'lucide-react';
import { searchService, SearchParams } from '@/services/socialSearchService';
import { cn } from '@/lib/utils';

interface SearchFiltersProps {
    filters: SearchParams;
    onFiltersChange: (filters: SearchParams) => void;
    onClearFilters?: () => void;
    className?: string;
    showAdvanced?: boolean;
    compact?: boolean;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
    filters,
    onFiltersChange,
    onClearFilters,
    className = '',
    showAdvanced = true,
    compact = false
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [popularSkills, setPopularSkills] = useState<{ value: string, label: string, icon?: string }[]>([]);
    const [popularLocations, setPopularLocations] = useState<{ value: string, label: string, icon?: string }[]>([]);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(
        filters.skills ? (Array.isArray(filters.skills) ? filters.skills : [filters.skills]) : []
    );

    // Load popular filters from service
    useEffect(() => {
        setPopularSkills(searchService.getPopularSearchCategories().map(cat => ({
            value: cat.value,
            label: cat.label,
            icon: cat.icon
        })));

        // Get locations from service or use default
        const locations = [
            { value: 'Addis Ababa', label: 'Addis Ababa', icon: '📍' },
            { value: 'Dire Dawa', label: 'Dire Dawa', icon: '📍' },
            { value: 'Hawassa', label: 'Hawassa', icon: '📍' },
            { value: 'Bahir Dar', label: 'Bahir Dar', icon: '📍' },
            { value: 'Adama', label: 'Adama', icon: '📍' },
            { value: 'Mekele', label: 'Mekele', icon: '📍' },
        ];
        setPopularLocations(locations);
    }, []);

    const searchTypes = [
        { value: 'all', label: 'All', icon: Users, description: 'Search everything' },
        { value: 'candidate', label: 'Candidates', icon: Briefcase, description: 'Job seekers' },
        { value: 'freelancer', label: 'Freelancers', icon: User, description: 'Independent professionals' },
        { value: 'company', label: 'Companies', icon: Building2, description: 'Businesses' },
        { value: 'organization', label: 'Organizations', icon: Building2, description: 'Non-profits' },
    ];

    const sortOptions = [
        { value: 'relevance', label: 'Relevance', icon: Target },
        { value: 'followers', label: 'Most Followers', icon: TrendingUp },
        { value: 'recent', label: 'Most Recent', icon: Sparkles },
        { value: 'alphabetical', label: 'Alphabetical', icon: Users },
    ];

    const verificationOptions = [
        { value: 'verified', label: 'Verified Only', icon: Shield },
        { value: 'unverified', label: 'All Users', icon: Users },
    ];

    const followerRanges = [
        { label: 'Any', min: undefined, max: undefined },
        { label: '100+', min: 100 },
        { label: '1K+', min: 1000 },
        { label: '5K+', min: 5000 },
        { label: '10K+', min: 10000 },
    ];

    const handleTypeChange = (type: SearchParams['type']) => {
        onFiltersChange({ ...filters, type, page: 1 });
    };

    const handleSortChange = (sortBy: SearchParams['sortBy']) => {
        onFiltersChange({ ...filters, sortBy, page: 1 });
    };

    const handleLocationChange = (location?: string) => {
        onFiltersChange({ ...filters, location: location || undefined, page: 1 });
    };

    const handleVerificationChange = (verificationStatus?: string) => {
        onFiltersChange({ ...filters, verificationStatus, page: 1 });
    };

    const handleFollowerRangeChange = (min?: number, max?: number) => {
        onFiltersChange({
            ...filters,
            minFollowers: min,
            maxFollowers: max,
            page: 1
        });
    };

    const handleSkillToggle = (skill: string) => {
        const newSkills = selectedSkills.includes(skill)
            ? selectedSkills.filter(s => s !== skill)
            : [...selectedSkills, skill];

        setSelectedSkills(newSkills);
        onFiltersChange({
            ...filters,
            skills: newSkills.length > 0 ? newSkills : undefined,
            page: 1
        });
    };

    const clearAllFilters = () => {
        setSelectedSkills([]);
        onFiltersChange({
            q: filters.q,
            page: 1,
            limit: filters.limit || 20,
            sortBy: 'relevance'
        });
        onClearFilters?.();
    };

    const hasActiveFilters = () => {
        return (
            filters.type !== 'all' ||
            filters.location ||
            filters.industry ||
            filters.skills ||
            filters.minFollowers ||
            filters.maxFollowers ||
            filters.verificationStatus
        );
    };

    const getFilterCount = () => {
        let count = 0;
        if (filters.type !== 'all') count++;
        if (filters.location) count++;
        if (filters.industry) count++;
        if (filters.skills) count++;
        if (filters.minFollowers || filters.maxFollowers) count++;
        if (filters.verificationStatus) count++;
        return count;
    };

    const getProfileTypeColor = (type: string) => {
        switch (type) {
            case 'candidate': return 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border-orange-200';
            case 'freelancer': return 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border-green-200';
            case 'company': return 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border-purple-200';
            case 'organization': return 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border-indigo-200';
            default: return 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border-blue-200';
        }
    };

    if (compact) {
        return (
            <div className={cn('w-full', className)}>
                <div className="flex flex-wrap items-center gap-3 mb-6 p-4 bg-white/80 backdrop-blur-sm rounded-xl border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Filter className="w-5 h-5" />
                        <span className="font-medium text-sm">Filter by:</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {searchTypes.map((type) => {
                            const Icon = type.icon;
                            const isActive = filters.type === type.value;

                            return (
                                <button
                                    key={type.value}
                                    onClick={() => handleTypeChange(type.value as SearchParams['type'])}
                                    className={cn(
                                        'px-3 py-1.5 rounded-lg flex items-center gap-2 transition-all text-sm',
                                        isActive
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                                            : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                    )}
                                >
                                    <Icon className="w-3.5 h-3.5" />
                                    <span className="font-medium">{type.label}</span>
                                </button>
                            );
                        })}
                    </div>

                    {hasActiveFilters() && (
                        <button
                            onClick={clearAllFilters}
                            className="ml-auto px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2"
                        >
                            <X className="w-4 h-4" />
                            Clear
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={cn('w-full', className)}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 p-6 bg-white/90 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-700">
                        <Filter className="w-5 h-5 text-blue-600" />
                        <span className="font-semibold">Filters</span>
                        {hasActiveFilters() && (
                            <span className="px-2.5 py-1 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full">
                                {getFilterCount()} active
                            </span>
                        )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {searchTypes.map((type) => {
                            const Icon = type.icon;
                            const isActive = filters.type === type.value;

                            return (
                                <button
                                    key={type.value}
                                    onClick={() => handleTypeChange(type.value as SearchParams['type'])}
                                    className={cn(
                                        'group px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-300',
                                        isActive
                                            ? `${getProfileTypeColor(type.value)} border-2 shadow-md`
                                            : 'bg-white/50 text-gray-600 hover:bg-white border border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                    )}
                                >
                                    <Icon className="w-4 h-4" />
                                    <div className="text-left">
                                        <span className="text-sm font-semibold block">{type.label}</span>
                                        <span className="text-xs text-gray-500 group-hover:text-gray-600">
                                            {type.description}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <select
                            value={filters.sortBy || 'relevance'}
                            onChange={(e) => handleSortChange(e.target.value as SearchParams['sortBy'])}
                            className="appearance-none bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl px-4 py-2.5 pl-10 pr-8 text-sm font-medium text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        >
                            {sortOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    Sort by: {option.label}
                                </option>
                            ))}
                        </select>
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                            {sortOptions.find(o => o.value === (filters.sortBy || 'relevance'))?.icon &&
                                React.createElement(sortOptions.find(o => o.value === (filters.sortBy || 'relevance'))!.icon, {
                                    className: "w-4 h-4 text-blue-600"
                                })
                            }
                        </div>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>

                    {hasActiveFilters() && (
                        <button
                            onClick={clearAllFilters}
                            className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-2 hover:bg-gray-50 rounded-xl transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Clear all
                        </button>
                    )}

                    {showAdvanced && (
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="px-4 py-2.5 text-sm font-medium text-blue-600 hover:text-blue-800 flex items-center gap-2 hover:bg-blue-50 rounded-xl transition-colors"
                        >
                            {isExpanded ? (
                                <>
                                    <X className="w-4 h-4" />
                                    Hide advanced
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Advanced filters
                                </>
                            )}
                            <ChevronDown className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-180')} />
                        </button>
                    )}
                </div>
            </div>

            {!isExpanded && (
                <div className="flex flex-wrap gap-3 mb-8 p-5 bg-gradient-to-r from-blue-50/50 to-purple-50/50 rounded-2xl border border-blue-100">
                    <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-700 mr-2">Location:</span>
                        {popularLocations.slice(0, 6).map((location) => (
                            <button
                                key={location.value}
                                onClick={() => handleLocationChange(
                                    filters.location === location.value ? undefined : location.value
                                )}
                                className={cn(
                                    'px-3 py-1.5 text-sm rounded-lg transition-all duration-200',
                                    filters.location === location.value
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-sm'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                )}
                            >
                                {location.icon && <span className="mr-1">{location.icon}</span>}
                                {location.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isExpanded && (
                <div className="mb-8 p-8 bg-gradient-to-br from-white to-gray-50/50 rounded-2xl border border-gray-200 shadow-xl">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-600" />
                                Search Categories
                            </h4>
                            <div className="flex flex-wrap gap-3">
                                {popularSkills.map((skill) => (
                                    <button
                                        key={skill.value}
                                        onClick={() => handleTypeChange(skill.value as SearchParams['type'])}
                                        className={cn(
                                            'px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-300',
                                            filters.type === skill.value
                                                ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-2 border-blue-200'
                                                : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                        )}
                                    >
                                        <span className="text-lg">{skill.icon}</span>
                                        <div className="text-left">
                                            <span className={cn(
                                                'text-sm font-medium block',
                                                filters.type === skill.value ? 'text-blue-700' : 'text-gray-700'
                                            )}>
                                                {skill.label}
                                            </span>
                                        </div>
                                        {filters.type === skill.value && (
                                            <Check className="w-4 h-4 text-blue-600 ml-2" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-blue-600" />
                                    Verification
                                </h4>
                                <div className="space-y-3">
                                    {verificationOptions.map((option) => (
                                        <button
                                            key={option.value}
                                            onClick={() => handleVerificationChange(
                                                filters.verificationStatus === option.value ? undefined : option.value
                                            )}
                                            className={cn(
                                                'w-full flex items-center justify-between p-3 rounded-xl transition-all duration-300',
                                                filters.verificationStatus === option.value
                                                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 border-2 border-blue-200'
                                                    : 'bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            <div className="flex items-center gap-3">
                                                {React.createElement(option.icon, {
                                                    className: cn(
                                                        'w-4 h-4',
                                                        filters.verificationStatus === option.value
                                                            ? 'text-blue-600'
                                                            : 'text-gray-400'
                                                    )
                                                })}
                                                <span className={cn(
                                                    'text-sm font-medium',
                                                    filters.verificationStatus === option.value
                                                        ? 'text-blue-700'
                                                        : 'text-gray-700'
                                                )}>
                                                    {option.label}
                                                </span>
                                            </div>
                                            {filters.verificationStatus === option.value && (
                                                <Check className="w-4 h-4 text-blue-600" />
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-purple-600" />
                                    Followers
                                </h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {followerRanges.map((range) => (
                                        <button
                                            key={range.label}
                                            onClick={() => handleFollowerRangeChange(range.min, range.max)}
                                            className={cn(
                                                'p-3 rounded-xl text-sm font-medium transition-all duration-300',
                                                filters.minFollowers === range.min && filters.maxFollowers === range.max
                                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-sm'
                                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
                                            )}
                                        >
                                            {range.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {hasActiveFilters() && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h4 className="text-lg font-semibold text-gray-900 mb-4">Active Filters</h4>
                            <div className="flex flex-wrap gap-3">
                                {filters.type !== 'all' && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 rounded-xl flex items-center gap-2 text-sm font-medium border border-blue-200">
                                        <span>Type: {searchTypes.find(t => t.value === filters.type)?.label}</span>
                                        <button
                                            onClick={() => handleTypeChange('all')}
                                            className="hover:text-blue-900 p-1 hover:bg-blue-200 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {filters.location && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-50 text-green-800 rounded-xl flex items-center gap-2 text-sm font-medium border border-green-200">
                                        <span>Location: {filters.location}</span>
                                        <button
                                            onClick={() => handleLocationChange(undefined)}
                                            className="hover:text-green-900 p-1 hover:bg-green-200 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {selectedSkills.length > 0 && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 rounded-xl flex items-center gap-2 text-sm font-medium border border-purple-200">
                                        <span>Skills: {selectedSkills.length}</span>
                                        <button
                                            onClick={() => setSelectedSkills([])}
                                            className="hover:text-purple-900 p-1 hover:bg-purple-200 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}

                                {(filters.minFollowers || filters.maxFollowers) && (
                                    <div className="px-4 py-2 bg-gradient-to-r from-pink-100 to-pink-50 text-pink-800 rounded-xl flex items-center gap-2 text-sm font-medium border border-pink-200">
                                        <span>Followers: {filters.minFollowers || 'Any'}-{filters.maxFollowers || 'Any'}</span>
                                        <button
                                            onClick={() => handleFollowerRangeChange(undefined, undefined)}
                                            className="hover:text-pink-900 p-1 hover:bg-pink-200 rounded-full"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchFilters;