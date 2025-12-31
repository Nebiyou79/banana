// components/social/network/NetworkList.tsx
import React, { useState, useEffect } from 'react';
import { Users2, UserPlus, Loader2, Search, Filter, RefreshCw, ChevronRight, Users, ChevronLeft, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { followService, Follow, FollowUser, FollowSuggestion, FollowStats } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import ConnectionItem from './ConnectionItem';
import { Button } from '@/components/social/ui/Button';

interface NetworkListProps {
    type: 'followers' | 'following' | 'suggestions' | 'requests';
    title?: string;
    limit?: number;
    showSearch?: boolean;
    showFilter?: boolean;
    showRefresh?: boolean;
    currentUserId?: string;
    onConnectionCountChange?: (count: number) => void;
    className?: string;
    showPagination?: boolean;
}

const NetworkList: React.FC<NetworkListProps> = ({
    type,
    title,
    limit = 5, // Default to 5 for pagination
    showSearch = true,
    showFilter = true,
    showRefresh = true,
    currentUserId,
    onConnectionCountChange,
    className = '',
    showPagination = true
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState<'all' | 'recent'>('all');
    const [connections, setConnections] = useState<FollowUser[]>([]);
    const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [totalPages, setTotalPages] = useState(1);
    const [stats, setStats] = useState<FollowStats>({ followers: 0, following: 0, pendingRequests: 0, totalConnections: 0 });
    const { toast } = useToast();

    // Fetch network stats
    const fetchStats = async () => {
        try {
            const statsData = await followService.getFollowStats();
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchConnections = async (pageNum: number = 1, append: boolean = false) => {
        try {
            setIsLoading(true);

            if (type === 'suggestions') {
                const suggestionData = await followService.getFollowSuggestions({
                    limit: pageNum * limit
                });

                const suggestionUsers: FollowUser[] = suggestionData.map(s => ({
                    _id: s._id,
                    name: s.name,
                    avatar: s.avatar,
                    headline: s.headline,
                    role: s.role,
                    verificationStatus: s.verificationStatus,
                    mutualConnections: s.mutualConnections || 0,
                    followerCount: s.followerCount || 0
                }));

                if (append) {
                    setConnections(prev => [...prev, ...suggestionUsers]);
                } else {
                    setConnections(suggestionUsers);
                }

                setTotalCount(suggestionData.length);
                setTotalPages(Math.ceil(suggestionData.length / limit));
                setHasMore(suggestionData.length >= pageNum * limit);
            } else {
                let response;
                const params = {
                    page: pageNum,
                    limit,
                    status: type === 'requests' ? 'pending' : 'accepted'
                };

                switch (type) {
                    case 'followers':
                        response = await followService.getFollowers(params);
                        break;
                    case 'following':
                        response = await followService.getFollowing(params);
                        break;
                    case 'requests':
                        response = await followService.getPendingRequests(params);
                        break;
                }

                if (response) {
                    const users = response.data.map((follow: Follow) =>
                        type === 'followers' || type === 'requests' ? follow.follower : follow.targetId
                    );

                    if (append) {
                        setConnections(prev => [...prev, ...users]);
                    } else {
                        setConnections(users);
                    }

                    const total = response.pagination?.total || users.length;
                    setTotalCount(total);
                    setTotalPages(response.pagination?.pages || Math.ceil(total / limit));
                    setHasMore(pageNum < (response.pagination?.pages || 1));
                    onConnectionCountChange?.(total);
                }
            }

            // Fetch updated stats
            await fetchStats();

        } catch (error) {
            console.error(`Error fetching ${type}:`, error);
            toast({
                title: "Error",
                description: `Failed to load ${type}`,
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConnections(1, false);
    }, [type, filter]);

    useEffect(() => {
        fetchStats();
    }, []);

    const filteredConnections = connections.filter(user => {
        if (!searchQuery.trim()) return true;
        const query = searchQuery.toLowerCase().trim();
        return (
            user.name.toLowerCase().includes(query) ||
            user.headline?.toLowerCase().includes(query) ||
            user.role?.toLowerCase().includes(query)
        );
    });

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages) return;
        setPage(newPage);
        fetchConnections(newPage, false);
    };

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchConnections(nextPage, true);
    };

    const handleFollowChange = (userId: string, following: boolean) => {
        if (type === 'following') {
            // Remove from list when unfollowing
            setConnections(prev => prev.filter(u => u._id !== userId));
            setTotalCount(prev => prev - 1);
            setStats(prev => ({ ...prev, following: prev.following - 1 }));
        } else if (type === 'suggestions' && following) {
            // Remove from suggestions when followed
            setConnections(prev => prev.filter(u => u._id !== userId));
            setTotalCount(prev => prev - 1);
            setStats(prev => ({ ...prev, following: prev.following + 1 }));
        } else if (type === 'followers' && following) {
            // User followed back - update stats
            setStats(prev => ({ ...prev, following: prev.following + 1 }));
        }

        onConnectionCountChange?.(type === 'following' ? totalCount - 1 : totalCount);
    };

    const handleRefresh = async () => {
        await fetchConnections(1, false);
        toast({
            title: "Refreshed",
            description: "List has been refreshed",
            variant: "default"
        });
    };

    const getTypeTitle = () => {
        switch (type) {
            case 'followers': return 'Followers';
            case 'following': return 'Following';
            case 'suggestions': return 'Suggestions';
            case 'requests': return 'Requests';
            default: return 'Connections';
        }
    };

    const getTypeDescription = () => {
        const count = type === 'suggestions' ? totalCount : stats[type === 'followers' ? 'followers' : type === 'following' ? 'following' : 'pendingRequests'];

        switch (type) {
            case 'followers': return `${count} people follow you`;
            case 'following': return `You follow ${count} people`;
            case 'suggestions': return `${count} people you may know`;
            case 'requests': return `${count} pending requests`;
            default: return '';
        }
    };

    // Pagination component
    const Pagination = () => {
        if (!showPagination || totalPages <= 1) return null;

        const maxVisiblePages = 5;
        let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        const pageNumbers = [];
        for (let i = startPage; i <= endPage; i++) {
            pageNumbers.push(i);
        }

        return (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
                </div>

                <div className="flex items-center gap-1">
                    <button
                        onClick={() => handlePageChange(1)}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handlePageChange(page - 1)}
                        disabled={page === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>

                    {startPage > 1 && (
                        <>
                            <button
                                onClick={() => handlePageChange(1)}
                                className="px-3 py-1 rounded-lg text-sm hover:bg-gray-100"
                            >
                                1
                            </button>
                            {startPage > 2 && <span className="px-2">...</span>}
                        </>
                    )}

                    {pageNumbers.map(pageNum => (
                        <button
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${pageNum === page
                                ? 'bg-blue-600 text-white'
                                : 'hover:bg-gray-100'
                                }`}
                        >
                            {pageNum}
                        </button>
                    ))}

                    {endPage < totalPages && (
                        <>
                            {endPage < totalPages - 1 && <span className="px-2">...</span>}
                            <button
                                onClick={() => handlePageChange(totalPages)}
                                className="px-3 py-1 rounded-lg text-sm hover:bg-gray-100"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}

                    <button
                        onClick={() => handlePageChange(page + 1)}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                        onClick={() => handlePageChange(totalPages)}
                        disabled={page === totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">
                        {title || getTypeTitle()}
                    </h2>
                    <p className="text-gray-600 text-sm mt-0.5">
                        {getTypeDescription()}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    {showRefresh && type !== 'requests' && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRefresh}
                            disabled={isLoading}
                            className="flex items-center gap-1.5"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Refresh</span>
                        </Button>
                    )}

                    {type === 'suggestions' && (
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => window.location.href = '/social/network?tab=suggestions'}
                            className="flex items-center gap-1.5"
                        >
                            <span>View All</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Search & Filter */}
            {(showSearch || showFilter) && (
                <div className="flex flex-col sm:flex-row gap-2">
                    {showSearch && (
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="search"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder={`Search ${getTypeTitle().toLowerCase()}...`}
                                className="w-full pl-10 pr-3 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                    )}

                    {showFilter && type !== 'suggestions' && type !== 'requests' && (
                        <div className="flex gap-1">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'all'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('recent')}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${filter === 'recent'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Recent
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Connections List */}
            <div className="space-y-2">
                {isLoading && connections.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                    </div>
                ) : filteredConnections.length === 0 ? (
                    <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                        <Users2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <h3 className="text-sm font-semibold text-gray-700 mb-1">
                            {searchQuery.trim() ? 'No matches found' : `No ${getTypeTitle().toLowerCase()}`}
                        </h3>
                        <p className="text-gray-500 text-sm mb-4">
                            {type === 'suggestions'
                                ? 'Follow more people to get suggestions'
                                : type === 'requests'
                                    ? 'You have no pending follow requests'
                                    : `You don't have any ${getTypeTitle().toLowerCase()} yet`}
                        </p>
                        {type === 'suggestions' && (
                            <Button
                                variant="default"
                                size="sm"
                                onClick={handleRefresh}
                            >
                                <RefreshCw className="w-3.5 h-3.5 mr-2" />
                                Find Suggestions
                            </Button>
                        )}
                    </div>
                ) : (
                    <>
                        {filteredConnections.map((user) => (
                            <ConnectionItem
                                key={user._id}
                                user={user}
                                type={type === 'following' ? 'following' : type === 'requests' ? 'request' : 'follower'}
                                currentUserId={currentUserId}
                                onFollowChange={handleFollowChange}
                                showMessageButton={type !== 'suggestions'}
                                initialFollowing={type === 'following'}
                            />
                        ))}

                        {/* Pagination */}
                        <Pagination />

                        {/* Load More for suggestions (alternative to pagination) */}
                        {type === 'suggestions' && hasMore && !showPagination && (
                            <div className="flex justify-center pt-4">
                                <Button
                                    variant="outline"
                                    onClick={handleLoadMore}
                                    disabled={isLoading}
                                    className="flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Loading...
                                        </>
                                    ) : (
                                        <>
                                            <Users className="w-4 h-4" />
                                            Load More
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default NetworkList;