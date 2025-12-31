'use client';

import React from 'react';
import { SearchProfile } from '@/services/socialSearchService';
import UserCardSmall from './UserCardSmall';
import { cn } from '@/lib/utils';
import {
    Users,
    Building2,
    Briefcase,
    User,
    Loader2,
    AlertCircle,
    Search,
    Grid,
    List,
    Sparkles,
    TrendingUp,
    Filter,
    BarChart3
} from 'lucide-react';

interface SearchResultListProps {
    results: SearchProfile[];
    loading?: boolean;
    error?: string;
    emptyMessage?: string;
    layout?: 'grid' | 'list';
    onLayoutChange?: (layout: 'grid' | 'list') => void;
    onProfileClick?: (profile: SearchProfile) => void;
    className?: string;
    totalResults?: number;
    currentPage?: number;
    totalPages?: number;
    showStats?: boolean;
    searchQuery?: string;
}

const SearchResultList: React.FC<SearchResultListProps> = ({
    results,
    loading = false,
    error,
    emptyMessage = 'No results found',
    layout = 'grid',
    onLayoutChange,
    onProfileClick,
    className = '',
    totalResults = 0,
    currentPage = 1,
    totalPages = 1,
    showStats = true,
    searchQuery = ''
}) => {
    const getTypeStats = () => {
        const stats = {
            candidates: 0,
            freelancers: 0,
            companies: 0,
            organizations: 0,
            users: 0
        };

        results.forEach(profile => {
            switch (profile.type) {
                case 'candidate': stats.candidates++; break;
                case 'freelancer': stats.freelancers++; break;
                case 'company': stats.companies++; break;
                case 'organization': stats.organizations++; break;
                case 'user': stats.users++; break;
            }
        });

        return stats;
    };

    const stats = getTypeStats();

    const getTypeIcon = (type: SearchProfile['type']) => {
        switch (type) {
            case 'candidate': return <Briefcase className="w-4 h-4" />;
            case 'freelancer': return <User className="w-4 h-4" />;
            case 'company': return <Building2 className="w-4 h-4" />;
            case 'organization': return <Building2 className="w-4 h-4" />;
            default: return <Users className="w-4 h-4" />;
        }
    };

    const getTypeLabel = (type: SearchProfile['type']) => {
        switch (type) {
            case 'candidate': return 'Candidates';
            case 'freelancer': return 'Freelancers';
            case 'company': return 'Companies';
            case 'organization': return 'Organizations';
            case 'user': return 'Users';
            default: return type;
        }
    };

    const getTypeColor = (type: string) => {
        const colors: Record<string, string> = {
            'candidate': 'bg-gradient-to-r from-orange-100 to-orange-50 text-orange-800 border border-orange-200',
            'freelancer': 'bg-gradient-to-r from-green-100 to-green-50 text-green-800 border border-green-200',
            'company': 'bg-gradient-to-r from-purple-100 to-purple-50 text-purple-800 border border-purple-200',
            'organization': 'bg-gradient-to-r from-indigo-100 to-indigo-50 text-indigo-800 border border-indigo-200',
            'user': 'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-800 border border-blue-200'
        };
        return colors[type] || 'bg-gradient-to-r from-gray-100 to-gray-50 text-gray-800 border border-gray-200';
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative">
                    <Loader2 className="w-16 h-16 text-blue-500 animate-spin mb-6" />
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl rounded-full"></div>
                </div>
                <p className="text-gray-600 text-lg font-medium mt-4">Searching the network...</p>
                <p className="text-gray-400 text-sm mt-2">Finding the best matches for you</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                    <AlertCircle className="w-16 h-16 text-red-500 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-pink-500/20 blur-xl rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Search Error</h3>
                <p className="text-gray-600 text-center max-w-md">{error}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                >
                    Try Again
                </button>
            </div>
        );
    }

    if (results.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="relative mb-6">
                    <Search className="w-20 h-20 text-gray-300 relative z-10" />
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-200/20 to-gray-300/20 blur-xl rounded-full"></div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {searchQuery ? `No results found for "${searchQuery}"` : emptyMessage}
                </h3>
                <p className="text-gray-600 text-center max-w-md text-lg">
                    {searchQuery
                        ? "Try different keywords or adjust your filters"
                        : "Start by searching for people, companies, or skills"
                    }
                </p>
                <div className="mt-8 flex items-center gap-2 text-gray-500">
                    <Sparkles className="w-4 h-4" />
                    <span className="text-sm">Pro tip: Try searching by skill, location, or role</span>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('w-full space-y-8', className)}>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-white/50 p-6 shadow-lg">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                            {searchQuery && (
                                <span className="text-gray-600 font-normal">Results for </span>
                            )}
                            {searchQuery && <span className="font-bold">"{searchQuery}"</span>}
                            {!searchQuery && (
                                <>{totalResults > 0 ? totalResults.toLocaleString() : results.length} Results Found</>
                            )}
                        </h2>
                        <p className="text-gray-600 mt-2">
                            Showing {results.length} of {totalResults > 0 ? totalResults.toLocaleString() : results.length} profiles
                            {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
                        </p>
                    </div>

                    {onLayoutChange && (
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-700 mr-2">View:</span>
                            <div className="flex items-center gap-1 bg-gray-100/50 backdrop-blur-sm p-1 rounded-xl">
                                <button
                                    onClick={() => onLayoutChange('grid')}
                                    className={cn(
                                        'p-2.5 rounded-lg transition-all duration-300',
                                        layout === 'grid'
                                            ? 'bg-white shadow-lg text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    )}
                                    aria-label="Grid view"
                                >
                                    <Grid className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => onLayoutChange('list')}
                                    className={cn(
                                        'p-2.5 rounded-lg transition-all duration-300',
                                        layout === 'list'
                                            ? 'bg-white shadow-lg text-blue-600'
                                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    )}
                                    aria-label="List view"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {showStats && (
                    <div className="border-t border-gray-100 pt-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Results Breakdown
                            </h3>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            {Object.entries(stats).map(([key, count]) => {
                                if (count === 0) return null;

                                const typeKey = key as keyof typeof stats;
                                const typeMap: Record<string, string> = {
                                    'candidates': 'candidate',
                                    'freelancers': 'freelancer',
                                    'companies': 'company',
                                    'organizations': 'organization',
                                    'users': 'user'
                                };

                                const type = typeMap[typeKey];

                                return (
                                    <div
                                        key={typeKey}
                                        className={cn(
                                            'px-4 py-2.5 rounded-xl flex items-center gap-3',
                                            getTypeColor(type)
                                        )}
                                    >
                                        {getTypeIcon(type as any)}
                                        <div>
                                            <div className="text-sm font-semibold">{count}</div>
                                            <div className="text-xs opacity-90">{getTypeLabel(type as any)}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <div className={cn(
                'transition-all duration-500',
                layout === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
                    : 'space-y-4'
            )}>
                {results.map((profile) => (
                    <UserCardSmall
                        key={profile._id}
                        profile={profile}
                        compact={layout === 'grid'}
                        onClick={onProfileClick}
                    />
                ))}
            </div>

            {totalPages > 1 && currentPage < totalPages && (
                <div className="text-center pt-8 border-t border-gray-200">
                    <p className="text-gray-600 mb-4">
                        Showing page {currentPage} of {totalPages}
                    </p>
                    <div className="flex items-center justify-center gap-3">
                        {[...Array(Math.min(5, totalPages))].map((_, i) => {
                            const pageNum = i + 1;
                            return (
                                <button
                                    key={pageNum}
                                    className={cn(
                                        'w-10 h-10 rounded-lg font-medium transition-all duration-300',
                                        currentPage === pageNum
                                            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                                            : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                                    )}
                                >
                                    {pageNum}
                                </button>
                            );
                        })}
                        {totalPages > 5 && (
                            <>
                                <span className="text-gray-400">...</span>
                                <button className="w-10 h-10 rounded-lg bg-white text-gray-700 hover:bg-gray-100 border border-gray-200 hover:border-gray-300">
                                    {totalPages}
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchResultList;