/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { followService, FollowSuggestion } from '@/services/followService';
import { useToast } from '@/hooks/use-toast';
import {
  Users2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Loader2,
  X,
  UserPlus,
  UserMinus,
  Check
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/Avatar';
import { Badge } from '../ui/Badge';

interface SuggestionListProps {
  title?: string;
  limit?: number;
  algorithm?: 'hybrid' | 'skills' | 'popular' | 'connections';
  showHeader?: boolean;
  showFilters?: boolean;
  showRefresh?: boolean;
  maxSuggestions?: number;
  currentUserId?: string;
  onSuggestionFollowed?: (userId: string) => void;
  onSuggestionDismissed?: (userId: string) => void;
  className?: string;
  variant?: 'default' | 'compact' | 'mini' | 'sidebar';
  showAllButton?: boolean;
  initialSuggestions?: FollowSuggestion[]; // Add this line
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  title = 'People You May Know',
  limit = 6,
  algorithm = 'hybrid',
  showHeader = true,
  showFilters = false,
  showRefresh = true,
  maxSuggestions = 50,
  currentUserId,
  onSuggestionFollowed,
  onSuggestionDismissed,
  className = '',
  variant = 'default',
  showAllButton = true,
  initialSuggestions, // Add this line
}) => {
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>(initialSuggestions || []);
  const [filteredSuggestions, setFilteredSuggestions] = useState<FollowSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(!initialSuggestions); // Only show loading if no initial suggestions
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithm);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followStatus, setFollowStatus] = useState<Record<string, { following: boolean; status?: string }>>({});
  const { toast } = useToast();

  const fetchSuggestions = useCallback(async () => {
    // Skip if we have initial suggestions and we're not refreshing
    if (initialSuggestions && suggestions.length > 0 && !isLoading) {
      return;
    }

    try {
      setIsLoading(true);
      const data = await followService.getFollowSuggestions({
        limit: maxSuggestions,
        algorithm: selectedAlgorithm
      });
      setSuggestions(data);

      const filtered = data.filter(s =>
        !dismissedIds.has(s._id) && !followedIds.has(s._id)
      ).slice(0, limit);
      setFilteredSuggestions(filtered);

      if (currentUserId) {
        const statuses = await followService.getBulkFollowStatus(data.map(s => s._id));
        setFollowStatus(statuses);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to load suggestions",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [selectedAlgorithm, limit, maxSuggestions, dismissedIds, followedIds, currentUserId, toast, initialSuggestions, suggestions.length, isLoading]);

  useEffect(() => {
    // Only fetch if we don't have initial suggestions
    if (!initialSuggestions) {
      fetchSuggestions();
    }
  }, [fetchSuggestions, initialSuggestions]);

  useEffect(() => {
    const filtered = suggestions.filter(s =>
      !dismissedIds.has(s._id) && !followedIds.has(s._id)
    ).slice(0, limit);
    setFilteredSuggestions(filtered);
  }, [dismissedIds, followedIds, suggestions, limit]);

  const handleFollow = useCallback(async (userId: string) => {
    try {
      await followService.toggleFollow(userId);
      setFollowedIds(prev => new Set([...prev, userId]));
      setFollowStatus(prev => ({ ...prev, [userId]: { following: true } }));
      onSuggestionFollowed?.(userId);

      toast({
        title: "Followed",
        description: "You are now following this user",
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive"
      });
    }
  }, [onSuggestionFollowed, toast]);

  const handleUnfollow = useCallback(async (userId: string) => {
    try {
      await followService.toggleFollow(userId);
      setFollowedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setFollowStatus(prev => ({ ...prev, [userId]: { following: false } }));

      toast({
        title: "Unfollowed",
        description: "You have unfollowed this user",
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDismiss = useCallback((userId: string) => {
    setDismissedIds(prev => new Set([...prev, userId]));
    onSuggestionDismissed?.(userId);

    toast({
      title: "Suggestion dismissed",
      description: "We'll show you better suggestions next time",
    });
  }, [onSuggestionDismissed, toast]);

  const handleRefresh = useCallback(() => {
    fetchSuggestions();
    toast({
      title: "Refreshing",
      description: "Finding new suggestions for you...",
    });
  }, [fetchSuggestions, toast]);

  const getAlgorithmIcon = useCallback((algo: string) => {
    switch (algo) {
      case 'skills': return <Target className="w-4 h-4" />;
      case 'popular': return <TrendingUp className="w-4 h-4" />;
      case 'connections': return <Users2 className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  }, []);

  const getAlgorithmLabel = useCallback((algo: string) => {
    switch (algo) {
      case 'skills': return 'Skills Match';
      case 'popular': return 'Popular';
      case 'connections': return 'Connections';
      default: return 'Smart';
    }
  }, []);

  const getReasonBadge = useCallback((reason: string) => {
    const reasonMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' }> = {
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

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }, []);

  const isFollowing = useCallback((userId: string) => {
    return followStatus[userId]?.following || false;
  }, [followStatus]);

  const loadingComponent = useMemo(() => (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
      variant === 'sidebar' ? "p-4" : "p-6"
    )}>
      <div className="flex flex-col items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400 mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Finding suggestions...</p>
      </div>
    </div>
  ), [variant]);

  const emptyComponent = useMemo(() => (
    <div className={cn(
      "bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700",
      variant === 'sidebar' ? "p-4" : "p-6"
    )}>
      <div className="text-center py-6">
        <Users2 className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
        <p className="text-sm text-gray-600 dark:text-gray-400">No suggestions available</p>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="mt-3"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-2" />
          Refresh
        </Button>
      </div>
    </div>
  ), [variant, handleRefresh]);

  // Rest of the component remains the same...
  // (Keep all the variant render logic exactly as is)

  // Sidebar variant (desktop sidebar)
  if (variant === 'sidebar') {
    if (isLoading) return loadingComponent;
    if (filteredSuggestions.length === 0) return emptyComponent;

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">
            {title}
          </h3>
          {showRefresh && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              className="h-7 w-7 p-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>

        <div className="space-y-3">
          {filteredSuggestions.map((suggestion) => {
            const following = isFollowing(suggestion._id);

            return (
              <div
                key={suggestion._id}
                className="group flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="h-9 w-9 ring-1 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage
                      src={suggestion.avatar}
                      alt={suggestion.name}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                      {getInitials(suggestion.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {suggestion.name}
                    </h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {suggestion.mutualConnections} mutual
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  variant={following ? "outline" : "default"}
                  onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                  className="shrink-0 ml-2"
                >
                  {following ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <UserPlus className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>

        {showAllButton && (
          <div className="pt-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300"
              onClick={() => window.location.href = '/social/network?tab=suggestions'}
            >
              Show all suggestions
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Compact variant
  if (variant === 'compact') {
    if (isLoading) return loadingComponent;
    if (filteredSuggestions.length === 0) return emptyComponent;

    return (
      <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
        {showHeader && (
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
              {showRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-7 w-7 p-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
            {showFilters && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1">
                  {['hybrid', 'skills', 'popular', 'connections'].map((algo) => (
                    <button
                      key={algo}
                      onClick={() => setSelectedAlgorithm(algo as any)}
                      className={cn(
                        "px-2 py-1 rounded-md text-xs transition-colors",
                        selectedAlgorithm === algo
                          ? "bg-blue-600 text-white"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                      )}
                    >
                      {getAlgorithmLabel(algo)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4">
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => {
              const following = isFollowing(suggestion._id);

              return (
                <div key={suggestion._id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar className="h-10 w-10 ring-1 ring-gray-200 dark:ring-gray-700">
                      <AvatarImage
                        src={suggestion.avatar}
                        alt={suggestion.name}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-sm font-semibold">
                        {getInitials(suggestion.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {suggestion.name}
                      </h4>
                      {suggestion.headline && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 truncate mt-0.5">
                          {suggestion.headline}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                        {getReasonBadge(suggestion.reason)}
                        {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            {suggestion.mutualConnections} mutual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant={following ? "outline" : "default"}
                      onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {following ? 'Following' : 'Follow'}
                    </Button>
                    <button
                      onClick={() => handleDismiss(suggestion._id)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Dismiss"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Mini variant
  if (variant === 'mini') {
    if (isLoading || filteredSuggestions.length === 0) return null;

    return (
      <div className={cn("space-y-3", className)}>
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h4>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        {filteredSuggestions.slice(0, 3).map((suggestion) => {
          const following = isFollowing(suggestion._id);

          return (
            <div key={suggestion._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <Avatar className="h-8 w-8 ring-1 ring-gray-200 dark:ring-gray-700">
                <AvatarImage
                  src={suggestion.avatar}
                  alt={suggestion.name}
                  className="object-cover"
                />
                <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white text-xs font-semibold">
                  {getInitials(suggestion.name)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                  {suggestion.name}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {getReasonBadge(suggestion.reason)}
                  {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {suggestion.mutualConnections} mutual
                    </span>
                  )}
                </div>
              </div>

              <Button
                size="sm"
                variant={following ? "outline" : "default"}
                onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                className="text-xs h-7 px-2"
              >
                {following ? 'Unfollow' : 'Follow'}
              </Button>
            </div>
          );
        })}
      </div>
    );
  }

  // Default variant (grid layout)
  if (isLoading) return loadingComponent;

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700", className)}>
      {showHeader && (
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-bold text-gray-900 dark:text-white truncate">{title}</h2>
              <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">
                {filteredSuggestions.length} suggestions
              </p>
            </div>

            {showRefresh && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="gap-1.5 shrink-0 h-8 px-3 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            )}
          </div>

          {showFilters && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {['hybrid', 'skills', 'popular', 'connections'].map((algo) => (
                <Button
                  key={algo}
                  variant={selectedAlgorithm === algo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAlgorithm(algo as any)}
                  className="gap-1.5 h-7 px-2.5 text-xs"
                >
                  {getAlgorithmIcon(algo)}
                  {getAlgorithmLabel(algo)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Users2 className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              No suggestions available
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Try refreshing or check back later for new suggestions
            </p>
            <Button
              onClick={handleRefresh}
              variant="default"
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Suggestions
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-700 -mx-6 sm:mx-0 sm:divide-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-3">
            {filteredSuggestions.map((suggestion) => {
              const following = isFollowing(suggestion._id);

              return (
                <div
                  key={suggestion._id}
                  className="group flex items-center gap-3 px-6 py-3 sm:px-4 sm:py-4 sm:rounded-lg sm:border sm:border-gray-200 dark:sm:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 sm:hover:shadow-sm transition-all duration-200"
                >
                  {/* Avatar */}
                  <Avatar className="h-10 w-10 shrink-0 ring-1 ring-gray-200 dark:ring-gray-700">
                    <AvatarImage src={suggestion.avatar} alt={suggestion.name} className="object-cover" />
                    <AvatarFallback className="bg-linear-to-br from-blue-500 to-indigo-600 text-white font-semibold text-sm">
                      {getInitials(suggestion.name)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate leading-tight">
                        {suggestion.name}
                      </h3>
                      {suggestion.verificationStatus === 'verified' && (
                        <Badge variant="success" size="sm" className="shrink-0">
                          <Check className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    {suggestion.headline && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs truncate mt-0.5 leading-tight">
                        {suggestion.headline}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      {getReasonBadge(suggestion.reason)}
                      {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                        <span className="text-xs text-blue-600 dark:text-blue-400">
                          {suggestion.mutualConnections} mutual
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleDismiss(suggestion._id)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-all"
                      title="Dismiss"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <Button
                      variant={following ? "outline" : "default"}
                      size="sm"
                      onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                      className="gap-1 h-7 px-2.5 text-xs"
                    >
                      {following ? (
                        <>
                          <UserMinus className="w-3 h-3" />
                          <span className="hidden sm:inline">Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3" />
                          <span>Follow</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {showAllButton && suggestions.length > filteredSuggestions.length && (
          <div className="text-center mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <Button
              variant="outline"
              onClick={() => window.location.href = '/social/network?tab=suggestions'}
              className="gap-2"
            >
              View all suggestions
              <Users2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export variants
export const CompactSuggestionList: React.FC<Omit<SuggestionListProps, 'showHeader' | 'showFilters' | 'variant'>> = (props) => (
  <SuggestionList
    {...props}
    variant="compact"
    showHeader={false}
    showFilters={false}
    limit={4}
    maxSuggestions={4}
  />
);

export const MiniSuggestionList: React.FC<Omit<SuggestionListProps, 'showHeader' | 'showFilters' | 'variant'>> = (props) => (
  <SuggestionList
    {...props}
    variant="mini"
    showHeader={false}
    showFilters={false}
    limit={3}
    maxSuggestions={3}
  />
);

export const SidebarSuggestionList: React.FC<Omit<SuggestionListProps, 'showHeader' | 'showFilters' | 'variant'>> = (props) => (
  <SuggestionList
    {...props}
    variant="sidebar"
    showHeader={false}
    showFilters={false}
    limit={5}
    maxSuggestions={5}
  />
);