/* eslint-disable @typescript-eslint/no-explicit-any */
// components/social/network/NetworkList.tsx
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Users2, 
  Loader2, 
  Search, 
  RefreshCw, 
  ChevronRight, 
  Users, 
  ChevronLeft, 
  ChevronsLeft, 
  ChevronsRight,
  Filter
} from 'lucide-react';
import { followService, Follow, FollowUser, FollowSuggestion, FollowStats } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import ConnectionItem from './ConnectionItem';
import { Button } from '@/components/social/ui/Button';
import { Input } from '@/components/social/ui/Input';
import { cn } from '@/lib/utils';

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
  compact?: boolean;
  gridLayout?: boolean;
}

const useDebounce = <T extends any[]>(callback: (...args: T) => void, delay: number) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback((...args: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);
};

const NetworkList: React.FC<NetworkListProps> = ({
  type,
  title,
  limit = 10,
  showSearch = true,
  showFilter = true,
  showRefresh = true,
  currentUserId,
  onConnectionCountChange,
  className = '',
  showPagination = true,
  compact = false,
  gridLayout = false
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
  const [stats, setStats] = useState<FollowStats>({ 
    followers: 0, 
    following: 0, 
    pendingRequests: 0, 
    totalConnections: 0 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await followService.getFollowStats();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  const fetchConnections = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      setIsLoading(true);

      if (type === 'suggestions') {
        const suggestionData = await followService.getFollowSuggestions({
          limit: limit
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
        setHasMore(false);
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
    } catch (error: any) {
      if (error.name === 'AbortError') {
        return;
      }
      
      console.error(`Error fetching ${type}:`, error);
      
      if (error.message?.includes('Too many requests')) {
        return;
      }
      
      toast({
        title: "Error",
        description: `Failed to load ${type}`,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [type, filter, limit, onConnectionCountChange, toast]);

  useEffect(() => {
    fetchConnections(1, false);
  }, [type, filter, fetchConnections]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const debouncedHandleSearch = useDebounce((query: string) => {
    // API search would go here
  }, 300);

  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    debouncedHandleSearch(query);
  }, [debouncedHandleSearch]);

  const filteredConnections = useMemo(() => {
    return connections.filter(user => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase().trim();
      return (
        user.name.toLowerCase().includes(query) ||
        user.headline?.toLowerCase().includes(query) ||
        user.role?.toLowerCase().includes(query)
      );
    });
  }, [connections, searchQuery]);

  const handlePageChange = useCallback((newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setPage(newPage);
    fetchConnections(newPage, false);
  }, [totalPages, fetchConnections]);

  const handleLoadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchConnections(nextPage, true);
  }, [page, fetchConnections]);

  const handleFollowChange = useCallback((userId: string, following: boolean) => {
    followService.clearCache();

    if (type === 'following') {
      setConnections(prev => prev.filter(u => u._id !== userId));
      setTotalCount(prev => prev - 1);
      setStats(prev => ({ ...prev, following: prev.following - 1 }));
    } else if (type === 'suggestions' && following) {
      setConnections(prev => prev.filter(u => u._id !== userId));
      setTotalCount(prev => prev - 1);
      setStats(prev => ({ ...prev, following: prev.following + 1 }));
    } else if (type === 'followers' && following) {
      setStats(prev => ({ ...prev, following: prev.following + 1 }));
    }

    onConnectionCountChange?.(type === 'following' ? totalCount - 1 : totalCount);
  }, [type, totalCount, onConnectionCountChange]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      followService.clearCache();
      await fetchConnections(1, false);
      await fetchStats();
      
      toast({
        title: "Refreshed",
        description: "List has been refreshed",
      });
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchConnections, fetchStats, toast]);

  const getTypeTitle = useCallback(() => {
    switch (type) {
      case 'followers': return 'Followers';
      case 'following': return 'Following';
      case 'suggestions': return 'Suggestions';
      case 'requests': return 'Requests';
      default: return 'Connections';
    }
  }, [type]);

  const getTypeDescription = useCallback(() => {
    const count = type === 'suggestions' ? totalCount : 
      stats[type === 'followers' ? 'followers' : 
        type === 'following' ? 'following' : 'pendingRequests'];

    switch (type) {
      case 'followers': return `${count} people follow you`;
      case 'following': return `You follow ${count} people`;
      case 'suggestions': return `${count} people you may know`;
      case 'requests': return `${count} pending requests`;
      default: return '';
    }
  }, [type, totalCount, stats]);

  const Pagination = useCallback(() => {
    if (!showPagination || totalPages <= 1) return null;

    const maxVisiblePages = 5;
    let startPage = Math.max(1, page - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    const pageNumbers = [];
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-0">
          Showing {(page - 1) * limit + 1} to {Math.min(page * limit, totalCount)} of {totalCount}
        </div>

        <div className="flex items-center gap-1">
          <Button
            onClick={() => handlePageChange(1)}
            disabled={page === 1}
            variant="ghost"
            size="sm"
            className="p-2"
            aria-label="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 1}
            variant="ghost"
            size="sm"
            className="p-2"
            aria-label="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {startPage > 1 && (
            <>
              <Button
                onClick={() => handlePageChange(1)}
                variant="ghost"
                size="sm"
                className="px-3 py-1"
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2 text-gray-400">...</span>}
            </>
          )}

          {pageNumbers.map(pageNum => (
            <Button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              variant={pageNum === page ? "default" : "ghost"}
              size="sm"
              className="px-3 py-1"
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === page ? 'page' : undefined}
            >
              {pageNum}
            </Button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2 text-gray-400">...</span>}
              <Button
                onClick={() => handlePageChange(totalPages)}
                variant="ghost"
                size="sm"
                className="px-3 py-1"
              >
                {totalPages}
              </Button>
            </>
          )}

          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={page === totalPages}
            variant="ghost"
            size="sm"
            className="p-2"
            aria-label="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>

          <Button
            onClick={() => handlePageChange(totalPages)}
            disabled={page === totalPages}
            variant="ghost"
            size="sm"
            className="p-2"
            aria-label="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }, [showPagination, totalPages, page, totalCount, limit, handlePageChange]);

  const EmptyState = useCallback(() => (
    <div className="text-center py-8 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50">
      <Users2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
        {searchQuery.trim() ? 'No matches found' : `No ${getTypeTitle().toLowerCase()}`}
      </h3>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 max-w-sm mx-auto">
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
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Find Suggestions
        </Button>
      )}
    </div>
  ), [searchQuery, getTypeTitle, type, handleRefresh, isRefreshing]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className={cn(
            "font-semibold text-gray-900 dark:text-white",
            compact ? "text-base" : "text-lg"
          )}>
            {title || getTypeTitle()}
          </h2>
          <p className="text-gray-600 dark:text-gray-300 text-sm mt-0.5">
            {getTypeDescription()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {showRefresh && type !== 'requests' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              className="gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className={compact ? "hidden sm:inline" : ""}>Refresh</span>
            </Button>
          )}

          {type === 'suggestions' && (
            <Button
              variant="default"
              size="sm"
              onClick={() => window.location.href = '/social/network?tab=suggestions'}
              className="gap-1.5"
            >
              <span className={compact ? "hidden sm:inline" : ""}>View All</span>
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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                placeholder={`Search ${getTypeTitle().toLowerCase()}...`}
                className="w-full pl-9 pr-3"
                disabled={isLoading}
                // size={compact ? "sm" : "default"}
              />
            </div>
          )}

          {showFilter && type !== 'suggestions' && type !== 'requests' && (
            <div className="flex gap-1">
              <Button
                onClick={() => setFilter('all')}
                disabled={isLoading}
                variant={filter === 'all' ? 'default' : 'outline'}
                size={compact ? "sm" : "default"}
                className="gap-1.5"
              >
                <Filter className="w-3.5 h-3.5" />
                <span className={compact ? "hidden sm:inline" : ""}>All</span>
              </Button>
              <Button
                onClick={() => setFilter('recent')}
                disabled={isLoading}
                variant={filter === 'recent' ? 'default' : 'outline'}
                size={compact ? "sm" : "default"}
                className="gap-1.5"
              >
                <span className={compact ? "hidden sm:inline" : ""}>Recent</span>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Connections List */}
      <div className="space-y-2">
        {isLoading && connections.length === 0 ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          </div>
        ) : filteredConnections.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className={cn(
              gridLayout 
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" 
                : "space-y-2"
            )}>
              {filteredConnections.map((user) => (
                <ConnectionItem
                  key={user._id}
                  user={user}
                  type={type === 'following' ? 'following' : type === 'requests' ? 'request' : 'follower'}
                  currentUserId={currentUserId}
                  onFollowChange={handleFollowChange}
                  showMessageButton={type !== 'suggestions'}
                  initialFollowing={type === 'following'}
                  compact={compact}
                  className={gridLayout ? "h-full" : ""}
                />
              ))}
            </div>

            {/* Pagination */}
            <Pagination />

            {/* Load More for suggestions */}
            {type === 'suggestions' && hasMore && !showPagination && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="gap-2"
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