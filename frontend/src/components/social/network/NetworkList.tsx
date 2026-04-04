/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { followService, Follow, FollowSuggestion } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import {
  Users2,
  UserPlus,
  RefreshCw,
  Loader2,
  Search,
  Check,
  AlertCircle,
  UserMinus,
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/social/ui/Avatar';
import { Badge } from '@/components/social/ui/Badge';

interface NetworkListProps {
  type: 'followers' | 'following' | 'suggestions'; // Removed 'requests'
  title?: string;
  limit?: number;
  showSearch?: boolean;
  showFilter?: boolean;
  showRefresh?: boolean;
  currentUserId?: string;
  onConnectionCountChange?: (count: number) => void;
  className?: string;
  showPagination?: boolean;
  algorithm?: 'hybrid' | 'skills' | 'popular' | 'connections';
}

// Stable default props to prevent unnecessary re-renders
const DEFAULT_PROPS = {
  limit: 10,
  showSearch: false,
  showFilter: false,
  showRefresh: true,
  showPagination: true,
  algorithm: 'hybrid' as const,
};

export const NetworkList: React.FC<NetworkListProps> = (props) => {
  // Merge props with defaults
  const {
    type,
    title,
    limit = DEFAULT_PROPS.limit,
    showSearch = DEFAULT_PROPS.showSearch,
    showFilter = DEFAULT_PROPS.showFilter,
    showRefresh = DEFAULT_PROPS.showRefresh,
    currentUserId,
    onConnectionCountChange,
    className = '',
    showPagination = DEFAULT_PROPS.showPagination,
    algorithm = DEFAULT_PROPS.algorithm,
  } = props;

  const [connections, setConnections] = useState<Follow[]>([]);
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);
  const [followStatus, setFollowStatus] = useState<Record<string, { following: boolean; status?: string }>>({});
  
  const { toast } = useToast();
  
  // Use refs to prevent dependency changes from triggering effects
  const abortControllerRef = useRef<AbortController | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const typeRef = useRef(type);
  const limitRef = useRef(limit);
  const algorithmRef = useRef(algorithm);
  const onConnectionCountChangeRef = useRef(onConnectionCountChange);

  // Update refs when props change (but won't trigger re-renders)
  useEffect(() => {
    typeRef.current = type;
    limitRef.current = limit;
    algorithmRef.current = algorithm;
    onConnectionCountChangeRef.current = onConnectionCountChange;
  }, [type, limit, algorithm, onConnectionCountChange]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
    };
  }, []);

  const getTitle = useCallback(() => {
    if (title) return title;
    switch (typeRef.current) {
      case 'followers': return 'Followers';
      case 'following': return 'Following';
      case 'suggestions': return 'Suggestions for You';
      default: return 'Connections';
    }
  }, [title]);

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  // Fetch follow status for suggestions
  const fetchFollowStatusForSuggestions = useCallback(async (suggestionsList: FollowSuggestion[]) => {
    if (!suggestionsList.length || !currentUserId) return;
    
    try {
      const userIds = suggestionsList.map(s => s._id);
      const statuses = await followService.getBulkFollowStatus(userIds);
      setFollowStatus(statuses);
    } catch (error) {
      console.error('Error fetching follow statuses:', error);
    }
  }, [currentUserId]);

  // Fetch suggestions
  const fetchSuggestions = useCallback(async (isRefresh: boolean = false) => {
    if (!mountedRef.current) return;

    if (isRateLimited) {
      console.log('⏳ Rate limited, skipping fetch');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      setError(null);

      const data = await followService.getFollowSuggestions({
        limit: limitRef.current * 2, // Get more suggestions
        algorithm: algorithmRef.current
      });

      if (!mountedRef.current || abortController.signal.aborted) return;

      setSuggestions(data);
      await fetchFollowStatusForSuggestions(data);
      
    } catch (error: any) {
      if (!mountedRef.current || abortController.signal.aborted) return;
      
      console.error('Error fetching suggestions:', error);
      
      if (error.response?.status === 429 || error.message?.includes('rate limit')) {
        setIsRateLimited(true);
        setError('Too many requests. Please wait a moment.');
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setHasFetched(true);
      }
    }
  }, [isRateLimited, fetchFollowStatusForSuggestions]);

  // Fetch connections (followers/following)
  const fetchConnections = useCallback(async (pageNum: number, isRefresh: boolean = false) => {
    if (!mountedRef.current) return;

    if (isRateLimited) {
      console.log('⏳ Rate limited, skipping fetch');
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else if (pageNum === 1) {
        setIsLoading(true);
      }
      
      setError(null);

      let response;
      const params = {
        page: pageNum,
        limit: limitRef.current,
        status: 'accepted'
      };

      switch (typeRef.current) {
        case 'followers':
          response = await followService.getFollowers(params);
          break;
        case 'following':
          response = await followService.getFollowing(params);
          break;
        default:
          return;
      }

      if (!mountedRef.current || abortController.signal.aborted) return;

      if (response.success && response.data) {
        setConnections(prev => {
          if (pageNum === 1) {
            return response.data;
          }
          const existingIds = new Set(prev.map(c => c._id));
          const newConnections = response.data.filter(c => !existingIds.has(c._id));
          return [...prev, ...newConnections];
        });
        
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setTotalCount(response.pagination.total);
          if (onConnectionCountChangeRef.current) {
            onConnectionCountChangeRef.current(response.pagination.total);
          }
        }
        setIsRateLimited(false);
      }
    } catch (error: any) {
      if (!mountedRef.current || abortController.signal.aborted) return;
      
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        return;
      }

      console.error(`Error fetching ${typeRef.current}:`, error);
      
      if (error.response?.status === 429 || error.message?.includes('rate limit')) {
        setIsRateLimited(true);
        setError('Too many requests. Please wait a moment.');
      } else {
        setError(`Failed to load ${getTitle().toLowerCase()}`);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
        setHasFetched(true);
      }
    }
  }, [isRateLimited, getTitle]);

  // Initial fetch based on type
  useEffect(() => {
    const timer = setTimeout(() => {
      if (typeRef.current === 'suggestions') {
        fetchSuggestions(false);
      } else {
        fetchConnections(1, false);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []); // Empty dependency array - runs only once

  // Handle page changes for connections
  useEffect(() => {
    if (typeRef.current === 'suggestions') return;
    if (page === 1 && !hasFetched) return;
    
    const timer = setTimeout(() => {
      if (page > 1) {
        fetchConnections(page, false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [page, hasFetched, fetchConnections]);

  const handleRefresh = useCallback(() => {
    if (isRateLimited) {
      toast({
        title: "Rate Limited",
        description: "Please wait a moment before refreshing",
        variant: "warning"
      });
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    setPage(1);
    setConnections([]);
    setSuggestions([]);
    
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    
    fetchTimeoutRef.current = setTimeout(() => {
      if (typeRef.current === 'suggestions') {
        fetchSuggestions(true);
      } else {
        fetchConnections(1, true);
      }
    }, 100);

    toast({
      title: "Refreshing",
      description: `Updating ${getTitle().toLowerCase()}...`,
    });
  }, [isRateLimited, fetchConnections, fetchSuggestions, getTitle, toast]);

  const handleLoadMore = useCallback(() => {
    if (typeRef.current === 'suggestions') return;
    if (page < totalPages && !isLoading && !isRefreshing && !isRateLimited) {
      setPage(prev => prev + 1);
    }
  }, [page, totalPages, isLoading, isRefreshing, isRateLimited]);

  const handleFollow = useCallback(async (userId: string, userName: string) => {
    try {
      await followService.toggleFollow(userId);
      
      // Update follow status
      setFollowStatus(prev => ({
        ...prev,
        [userId]: { following: true, status: 'accepted' }
      }));

      // Remove from suggestions if in suggestions tab
      if (typeRef.current === 'suggestions') {
        setSuggestions(prev => prev.filter(s => s._id !== userId));
      }

      toast({
        title: "Followed",
        description: `You are now following ${userName}`,
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUnfollow = useCallback(async (userId: string, userName: string) => {
    try {
      await followService.toggleFollow(userId);
      
      // Update follow status
      setFollowStatus(prev => ({
        ...prev,
        [userId]: { following: false, status: 'none' }
      }));

      // If in following tab, remove from list
      if (typeRef.current === 'following') {
        setConnections(prev => prev.filter(conn => 
          (conn.targetId as any)._id !== userId && 
          (conn.follower as any)._id !== userId
        ));
        setTotalCount(prev => prev - 1);
        if (onConnectionCountChangeRef.current) {
          onConnectionCountChangeRef.current(totalCount - 1);
        }
      }

      toast({
        title: "Unfollowed",
        description: `You have unfollowed ${userName}`,
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive"
      });
    }
  }, [toast, totalCount]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    toast({
      title: "Search",
      description: `Searching for "${searchQuery}"`,
    });
  }, [searchQuery, toast]);

  const getReasonBadge = useCallback((reason: string) => {
    const reasonMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'success' }> = {
      'mutual_connections': { label: 'Mutual', variant: 'default' },
      'skills_match': { label: 'Skills', variant: 'success' },
      'industry': { label: 'Industry', variant: 'outline' },
      'location': { label: 'Nearby', variant: 'secondary' },
      'popular': { label: 'Popular', variant: 'default' },
      'education': { label: 'Education', variant: 'outline' },
    };

    const config = reasonMap[reason] || { label: reason, variant: 'outline' };

    return (
      <Badge variant={config.variant} size="sm">
        {config.label}
      </Badge>
    );
  }, []);

  // Memoized empty state
  const emptyState = useMemo(() => (
    <div className="p-8 text-center">
      {typeRef.current === 'suggestions' ? (
        <Sparkles className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      ) : (
        <Users2 className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      )}
      <p className="text-gray-500 dark:text-gray-400">
        No {getTitle().toLowerCase()} found
      </p>
      {typeRef.current === 'suggestions' && (
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
          Check back later for more suggestions
        </p>
      )}
    </div>
  ), [getTitle]);

  // Rate limit warning
  if (isRateLimited) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg border p-8 text-center", className)}>
        <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Rate Limit Reached</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Too many requests. Please wait a moment before trying again.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsRateLimited(false);
            handleRefresh();
          }}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Try Again
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading && ((type === 'suggestions' && suggestions.length === 0) || (type !== 'suggestions' && connections.length === 0))) {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg border p-8", className)}>
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Loading {getTitle().toLowerCase()}...</p>
        </div>
      </div>
    );
  }

  // Render suggestions
  if (type === 'suggestions') {
    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-lg border", className)}>
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {getTitle()}
                {suggestions.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                    ({suggestions.length})
                  </span>
                )}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {showRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={isRefreshing || isRateLimited}
                  className="gap-2"
                >
                  <RefreshCw className={cn("w-4 h-4", isRefreshing && "animate-spin")} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {suggestions.length === 0 ? (
            emptyState
          ) : (
            suggestions.map((suggestion) => {
              const isFollowing = followStatus[suggestion._id]?.following || false;

              return (
                <div
                  key={suggestion._id}
                  className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar className="h-12 w-12 ring-1 ring-gray-200 dark:ring-gray-700">
                        <AvatarImage
                          src={suggestion.avatar}
                          alt={suggestion.name}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                          {getInitials(suggestion.name)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {suggestion.name}
                          </h4>
                          {suggestion.verificationStatus === 'verified' && (
                            <Badge variant="success" size="sm" className="shrink-0">
                              <Check className="w-3 h-3" />
                            </Badge>
                          )}
                        </div>
                        
                        {suggestion.headline && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {suggestion.headline}
                          </p>
                        )}

                        <div className="flex items-center gap-2 mt-2">
                          {getReasonBadge(suggestion.reason)}
                          {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              {suggestion.mutualConnections} mutual
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0">
                      <Button
                        size="sm"
                        variant={isFollowing ? "outline" : "default"}
                        onClick={() => isFollowing 
                          ? handleUnfollow(suggestion._id, suggestion.name)
                          : handleFollow(suggestion._id, suggestion.name)
                        }
                        className={cn(
                          "gap-2 min-w-[90px]",
                          isFollowing 
                            ? "border-gray-300 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700"
                            : "bg-blue-600 hover:bg-blue-700 text-white"
                        )}
                      >
                        {isFollowing ? (
                          <>
                            <UserMinus className="w-4 h-4" />
                            <span>Unfollow</span>
                          </>
                        ) : (
                          <>
                            <UserPlus className="w-4 h-4" />
                            <span>Follow</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // Render followers/following
  const dataToRender = connections;
  const isEmpty = dataToRender.length === 0;

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg border", className)}>
      {/* Header */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
            {getTitle()}
            {totalCount > 0 && (
              <span className="ml-1.5 text-xs font-normal text-gray-500 dark:text-gray-400">
                ({totalCount})
              </span>
            )}
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            {showSearch && (
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="pl-8 pr-3 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white w-32 sm:w-40"
                />
              </form>
            )}

            {showRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isRateLimited}
                className="p-1.5 h-auto"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {isEmpty ? (
          emptyState
        ) : (
          dataToRender.map((connection) => {
            const user = typeRef.current === 'followers' ? connection.follower : connection.targetId;
            const isFollowing = typeRef.current === 'following';

            return (
              <div
                key={connection._id}
                className="px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage
                      src={user.avatar}
                      alt={user.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h4 className="font-medium text-gray-900 dark:text-white text-sm truncate leading-tight">
                        {user.name}
                      </h4>
                      {user.verificationStatus === 'verified' && (
                        <Badge variant="success" size="sm" className="shrink-0">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    
                    {user.headline && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate leading-tight mt-0.5">
                        {user.headline}
                      </p>
                    )}

                    {user.mutualConnections > 0 && (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                        {user.mutualConnections} mutual
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {typeRef.current === 'followers' ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleFollow(user._id, user.name)}
                        className="gap-1 h-7 px-2.5 text-xs border-gray-300 dark:border-gray-600"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span className="hidden xs:inline">Follow</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUnfollow(user._id, user.name)}
                        className="gap-1 h-7 px-2.5 text-xs border-gray-300 dark:border-gray-600"
                      >
                        <UserMinus className="w-3 h-3" />
                        <span className="hidden xs:inline">Unfollow</span>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination */}
      {showPagination && page < totalPages && !isEmpty && (
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoading || isRefreshing}
            className="w-full gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More'
            )}
          </Button>
        </div>
      )}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default React.memo(NetworkList);