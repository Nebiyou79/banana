'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, Clock, ChevronRight, Hash, Sparkles, Loader2 } from 'lucide-react';
import { searchService, SearchSuggestion } from '@/services/socialSearchService';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface SearchBarProps {
    placeholder?: string;
    defaultValue?: string;
    autoFocus?: boolean;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'default' | 'filled' | 'outline';
    className?: string;
    showSuggestions?: boolean;
    onSearch?: (query: string, filters?: any) => void;
    showHistory?: boolean;
    showTrending?: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({
    placeholder = 'Search people, companies, hashtags...',
    defaultValue = '',
    autoFocus = false,
    size = 'md',
    variant = 'default',
    className = '',
    showSuggestions = true,
    onSearch,
    showHistory = true,
    showTrending = true
}) => {
    const [query, setQuery] = useState(defaultValue);
    const [isFocused, setIsFocused] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestionsDropdown, setShowSuggestionsDropdown] = useState(false);
    const [recentSearches, setRecentSearches] = useState<string[]>([]);
    const [trendingHashtags, setTrendingHashtags] = useState<{ hashtag: string, count: number }[]>([]);

    const router = useRouter();
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const debouncedSuggestions = searchService.createDebouncedSuggestions(300);

    // Size classes
    const sizeClasses = {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-5 text-base',
        lg: 'h-14 px-6 text-lg'
    };

    // Variant classes
    const variantClasses = {
        default: 'bg-white border border-gray-200 shadow-sm hover:border-gray-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20',
        filled: 'bg-white/90 backdrop-blur-sm border border-white/50 shadow-lg hover:shadow-xl focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30',
        outline: 'bg-transparent border-2 border-gray-300 hover:border-gray-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
    };

    // Load recent searches and trending hashtags
    useEffect(() => {
        setRecentSearches(searchService.getRecentSearchesByType());

        if (showTrending) {
            searchService.getTrendingHashtags({ limit: 5, refresh: false })
                .then(trending => {
                    setTrendingHashtags(trending.map(t => ({ hashtag: t.hashtag, count: t.count })));
                })
                .catch(console.error);
        }
    }, [showTrending]);

    // Fetch suggestions
    useEffect(() => {
        if (query.trim().length >= 2 && showSuggestions) {
            setIsLoading(true);
            debouncedSuggestions(query)
                .then(setSuggestions)
                .catch(error => {
                    console.error('Failed to fetch suggestions:', error);
                    setSuggestions([]);
                })
                .finally(() => setIsLoading(false));
        } else {
            setSuggestions([]);
        }
    }, [query, showSuggestions]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestionsDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearch = (searchQuery: string = query, type?: string) => {
        const trimmedQuery = searchQuery.trim();
        if (!trimmedQuery) return;

        // Add to search history
        searchService.addToSearchHistory(trimmedQuery, type);

        // Update recent searches
        setRecentSearches(searchService.getRecentSearchesByType());

        // Call onSearch callback
        onSearch?.(trimmedQuery, { type });

        // Navigate to search results
        router.push(`/dashboard/social/search?q=${encodeURIComponent(trimmedQuery)}${type ? `&type=${type}` : ''}`);

        // Close suggestions
        setShowSuggestionsDropdown(false);
        inputRef.current?.blur();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSearch();
        } else if (e.key === 'Escape') {
            setShowSuggestionsDropdown(false);
            inputRef.current?.blur();
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        let searchQuery = suggestion.name;
        let type = suggestion.type;

        if (suggestion.type === 'hashtag') {
            searchQuery = `#${suggestion.name.replace('#', '')}`;
            type = 'hashtag';
        }

        setQuery(searchQuery);
        handleSearch(searchQuery, type);
    };

    const handleTrendingClick = (hashtag: string) => {
        const searchQuery = `#${hashtag}`;
        setQuery(searchQuery);
        handleSearch(searchQuery, 'hashtag');
    };

    const handleRecentSearchClick = (search: string) => {
        setQuery(search);
        handleSearch(search);
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        inputRef.current?.focus();
    };

    const getSuggestionIcon = (type: SearchSuggestion['type']) => {
        switch (type) {
            case 'user': return '👤';
            case 'company': return '🏢';
            case 'organization': return '🏛️';
            case 'hashtag': return '#';
            default: return '🔍';
        }
    };

    const getSuggestionColor = (type: SearchSuggestion['type']) => {
        switch (type) {
            case 'user': return 'bg-blue-100 text-blue-800';
            case 'company': return 'bg-purple-100 text-purple-800';
            case 'organization': return 'bg-indigo-100 text-indigo-800';
            case 'hashtag': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className={cn('relative w-full', className)} ref={containerRef}>
            <div className={cn(
                'relative flex items-center rounded-2xl transition-all duration-300',
                sizeClasses[size],
                variantClasses[variant],
                isFocused && 'ring-2 ring-blue-500 ring-opacity-30',
                className
            )}>
                <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />

                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        setIsFocused(true);
                        setShowSuggestionsDropdown(true);
                    }}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoFocus={autoFocus}
                    className="w-full pl-3 pr-10 bg-transparent border-0 outline-none placeholder:text-gray-400 text-gray-900 font-medium"
                />

                {query && (
                    <button
                        onClick={clearSearch}
                        className="absolute right-3 p-1.5 rounded-full hover:bg-gray-100/50 transition-colors backdrop-blur-sm"
                        aria-label="Clear search"
                    >
                        <X className="w-4 h-4 text-gray-400" />
                    </button>
                )}

                {!query && (
                    <div className="absolute right-3 hidden md:flex items-center gap-2">
                        <kbd className="px-2 py-1 text-xs font-medium text-gray-500 bg-gray-100/50 backdrop-blur-sm rounded-lg border border-white/30">
                            ⌘K
                        </kbd>
                    </div>
                )}
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestionsDropdown && (suggestions.length > 0 || recentSearches.length > 0 || trendingHashtags.length > 0) && (
                <div className="absolute top-full mt-2 w-full bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 overflow-hidden z-50">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="p-4 flex items-center justify-center">
                            <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                            <span className="ml-2 text-sm text-gray-600">Searching...</span>
                        </div>
                    )}

                    {/* Search Suggestions */}
                    {!isLoading && suggestions.length > 0 && (
                        <div className="p-4 border-b border-gray-100/50">
                            <div className="flex items-center gap-2 mb-3">
                                <Sparkles className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">Suggestions</span>
                            </div>
                            <div className="space-y-2">
                                {suggestions.map((suggestion) => (
                                    <button
                                        key={`${suggestion.type}-${suggestion.id}`}
                                        onClick={() => handleSuggestionClick(suggestion)}
                                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50/50 transition-colors group"
                                    >
                                        <div className={cn(
                                            'flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg',
                                            getSuggestionColor(suggestion.type)
                                        )}>
                                            {suggestion.avatar ? (
                                                <img
                                                    src={suggestion.avatar}
                                                    alt={suggestion.name}
                                                    className="w-8 h-8 rounded-lg"
                                                />
                                            ) : (
                                                <span>{getSuggestionIcon(suggestion.type)}</span>
                                            )}
                                        </div>
                                        <div className="flex-1 text-left min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-900 truncate">
                                                    {suggestion.name}
                                                </span>
                                                {suggestion.verificationStatus === 'verified' && (
                                                    <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                        ✓
                                                    </span>
                                                )}
                                            </div>
                                            {suggestion.subtitle && (
                                                <p className="text-xs text-gray-500 truncate">{suggestion.subtitle}</p>
                                            )}
                                            {suggestion.meta?.skills && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {suggestion.meta.skills.slice(0, 2).map((skill) => (
                                                        <span key={skill} className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={cn(
                                                'px-2.5 py-1 text-xs font-medium rounded-full',
                                                getSuggestionColor(suggestion.type)
                                            )}>
                                                {searchService.getSearchResultTypeLabel(suggestion.type)}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Recent Searches */}
                    {!isLoading && recentSearches.length > 0 && suggestions.length === 0 && (
                        <div className="p-4 border-b border-gray-100/50">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-gray-400" />
                                    <span className="text-sm font-semibold text-gray-700">Recent searches</span>
                                </div>
                                <button
                                    onClick={() => {
                                        searchService.clearSearchHistory();
                                        setRecentSearches([]);
                                    }}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Clear
                                </button>
                            </div>
                            <div className="space-y-2">
                                {recentSearches.map((search, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleRecentSearchClick(search)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-gray-50/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                                                <Clock className="w-4 h-4 text-gray-400" />
                                            </div>
                                            <span className="text-sm text-gray-700">{search}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-400" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Trending Hashtags */}
                    {showTrending && trendingHashtags.length > 0 && !isLoading && (
                        <div className="p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <TrendingUp className="w-4 h-4 text-gray-400" />
                                <span className="text-sm font-semibold text-gray-700">Trending now</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {trendingHashtags.map((tag) => (
                                    <button
                                        key={tag.hashtag}
                                        onClick={() => handleTrendingClick(tag.hashtag)}
                                        className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                                    >
                                        <Hash className="w-3.5 h-3.5 text-blue-600" />
                                        <span className="text-sm font-medium text-gray-700">#{tag.hashtag}</span>
                                        <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {tag.count}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="p-3 bg-gray-50/50 border-t border-gray-100/50">
                        <div className="text-xs text-gray-500 text-center">
                            Press <kbd className="px-2 py-1 bg-white border border-gray-200 rounded-lg mx-1">Enter</kbd> to search
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchBar;