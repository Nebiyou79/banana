'use client';

import React, { useState, useEffect } from 'react';
import { followService, FollowSuggestion } from '@/services/followService';
import { searchService } from '@/services/socialSearchService';
import { useToast } from '@/hooks/use-toast';
import {
  Users2,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  Loader2,
  X,
  Users,
  Zap,
  Briefcase,
  UserPlus,
  Building2,
  MapPin,
  Star
} from 'lucide-react';
import { Button } from '@/components/social/ui/Button';
import { cn } from '@/lib/utils';
import FollowButton from '@/components/social/network/FollowButton';

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
  variant?: 'default' | 'compact' | 'mini';
}

export const SuggestionList: React.FC<SuggestionListProps> = ({
  title = 'People You May Know',
  limit = 12,
  algorithm = 'hybrid',
  showHeader = true,
  showFilters = true,
  showRefresh = true,
  maxSuggestions = 50,
  currentUserId,
  onSuggestionFollowed,
  onSuggestionDismissed,
  className = '',
  variant = 'default'
}) => {
  const [suggestions, setSuggestions] = useState<FollowSuggestion[]>([]);
  const [filteredSuggestions, setFilteredSuggestions] = useState<FollowSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState(algorithm);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [followedIds, setFollowedIds] = useState<Set<string>>(new Set());
  const [followStatus, setFollowStatus] = useState<Record<string, { following: boolean; status?: string }>>({});
  const { toast } = useToast();

  const fetchSuggestions = async () => {
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

      // Check follow status for all suggestions
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
  };

  useEffect(() => {
    fetchSuggestions();
  }, [selectedAlgorithm, limit, currentUserId]);

  useEffect(() => {
    const filtered = suggestions.filter(s =>
      !dismissedIds.has(s._id) && !followedIds.has(s._id)
    ).slice(0, limit);
    setFilteredSuggestions(filtered);
  }, [dismissedIds, followedIds, suggestions]);

  const handleFollow = async (userId: string) => {
    try {
      const result = await followService.toggleFollow(userId);
      setFollowedIds(prev => new Set([...prev, userId]));
      setFollowStatus(prev => ({ ...prev, [userId]: { following: true } }));
      onSuggestionFollowed?.(userId);

      toast({
        title: "Followed",
        description: "You are now following this user",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error following user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to follow user",
        variant: "destructive"
      });
    }
  };

  const handleUnfollow = async (userId: string) => {
    try {
      const result = await followService.toggleFollow(userId);
      setFollowedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
      setFollowStatus(prev => ({ ...prev, [userId]: { following: false } }));

      toast({
        title: "Unfollowed",
        description: "You have unfollowed this user",
        variant: "default"
      });
    } catch (error: any) {
      console.error('Error unfollowing user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to unfollow user",
        variant: "destructive"
      });
    }
  };

  const handleDismiss = (userId: string) => {
    setDismissedIds(prev => new Set([...prev, userId]));
    onSuggestionDismissed?.(userId);

    toast({
      title: "Suggestion dismissed",
      description: "We'll show you better suggestions next time",
      variant: "default"
    });
  };

  const handleRefresh = () => {
    fetchSuggestions();
    toast({
      title: "Refreshing",
      description: "Finding new suggestions for you...",
      variant: "default"
    });
  };

  const getAlgorithmIcon = (algo: string) => {
    switch (algo) {
      case 'skills': return <Target className="w-4 h-4" />;
      case 'popular': return <TrendingUp className="w-4 h-4" />;
      case 'connections': return <Users2 className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getAlgorithmLabel = (algo: string) => {
    switch (algo) {
      case 'skills': return 'Skills Match';
      case 'popular': return 'Popular';
      case 'connections': return 'Connections';
      default: return 'Smart';
    }
  };

  const getAlgorithmDescription = (algo: string) => {
    switch (algo) {
      case 'skills': return 'Based on your skills';
      case 'popular': return 'Popular in your network';
      case 'connections': return 'Connected to people you know';
      default: return 'Our smart algorithm';
    }
  };

  const getReasonBadge = (reason: string) => {
    const reasonMap: Record<string, { label: string; color: string; bg: string }> = {
      'mutual_connections': { label: 'Mutual', color: 'text-blue-700', bg: 'bg-blue-50' },
      'skills_match': { label: 'Skills', color: 'text-green-700', bg: 'bg-green-50' },
      'industry': { label: 'Industry', color: 'text-purple-700', bg: 'bg-purple-50' },
      'location': { label: 'Nearby', color: 'text-amber-700', bg: 'bg-amber-50' },
      'popular': { label: 'Popular', color: 'text-pink-700', bg: 'bg-pink-50' },
      'education': { label: 'Education', color: 'text-indigo-700', bg: 'bg-indigo-50' },
    };

    const config = reasonMap[reason] || { label: reason, color: 'text-gray-700', bg: 'bg-gray-50' };

    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getDisplayRole = (role?: string) => {
    if (!role) return '';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  const isFollowing = (userId: string) => {
    return followStatus[userId]?.following || false;
  };

  // Compact variant
  if (variant === 'compact') {
    if (isLoading) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-sm text-gray-600">Finding suggestions...</p>
          </div>
        </div>
      );
    }

    if (filteredSuggestions.length === 0) {
      return (
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-center py-6">
            <Users2 className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">No suggestions available</p>
          </div>
        </div>
      );
    }

    return (
      <div className={cn(`bg-white rounded-xl border border-gray-200 ${className}`)}>
        {showHeader && (
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-900">{title}</h3>
              {showRefresh && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRefresh}
                  className="h-8 w-8 p-0"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="space-y-3">
            {filteredSuggestions.map((suggestion) => {
              const following = isFollowing(suggestion._id);

              return (
                <div key={suggestion._id} className="flex items-center justify-between group">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                      {suggestion.avatar ? (
                        <img
                          src={suggestion.avatar}
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{getInitials(suggestion.name)}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900 truncate">{suggestion.name}</h4>
                      <p className="text-xs text-gray-500 truncate">{suggestion.headline}</p>
                      {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                        <p className="text-xs text-blue-600 mt-1">
                          {suggestion.mutualConnections} mutual connections
                        </p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={following ? "outline" : "default"}
                    onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {following ? 'Unfollow' : 'Follow'}
                  </Button>
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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">{title}</h4>
          <Sparkles className="w-4 h-4 text-amber-500" />
        </div>

        {filteredSuggestions.slice(0, 3).map((suggestion) => {
          const following = isFollowing(suggestion._id);

          return (
            <div key={suggestion._id} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                {suggestion.avatar ? (
                  <img
                    src={suggestion.avatar}
                    alt={suggestion.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{getInitials(suggestion.name)}</span>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{suggestion.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getReasonBadge(suggestion.reason)}
                  {suggestion.mutualConnections !== undefined && suggestion.mutualConnections > 0 && (
                    <span className="text-xs text-gray-500">
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

  // Default variant
  if (isLoading) {
    return (
      <div className={cn(`bg-white rounded-xl border border-gray-200 p-8 ${className}`)}>
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
          <p className="text-gray-600">Finding suggestions for you...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(`bg-white rounded-xl border border-gray-200 ${className}`)}>
      {/* Header */}
      {showHeader && (
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-gray-600 mt-1">
                {getAlgorithmDescription(selectedAlgorithm)} • {filteredSuggestions.length} suggestions
              </p>
            </div>

            {showRefresh && (
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            )}
          </div>

          {/* Algorithm Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-2">
              {['hybrid', 'skills', 'popular', 'connections'].map((algo) => (
                <Button
                  key={algo}
                  variant={selectedAlgorithm === algo ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedAlgorithm(algo as any)}
                  className="flex items-center gap-2"
                >
                  {getAlgorithmIcon(algo)}
                  {getAlgorithmLabel(algo)}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Suggestions Grid */}
      <div className="p-6">
        {filteredSuggestions.length === 0 ? (
          <div className="text-center py-12">
            <Users2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No suggestions available
            </h3>
            <p className="text-gray-500 mb-6">
              Try refreshing or check back later for new suggestions
            </p>
            <Button
              onClick={handleRefresh}
              variant="default"
              className="flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh Suggestions
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuggestions.map((suggestion) => {
              const following = isFollowing(suggestion._id);

              return (
                <div
                  key={suggestion._id}
                  className="group bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-all duration-300 hover:border-gray-300 relative"
                >
                  {/* Dismiss Button */}
                  <button
                    onClick={() => handleDismiss(suggestion._id)}
                    className="absolute top-2 right-2 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
                    title="Dismiss suggestion"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* User Info */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold overflow-hidden bg-gradient-to-br from-blue-500 to-indigo-600">
                      {suggestion.avatar ? (
                        <img
                          src={suggestion.avatar}
                          alt={suggestion.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm">{getInitials(suggestion.name)}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-800 truncate">{suggestion.name}</h3>
                      <p className="text-gray-600 text-sm truncate">{suggestion.headline}</p>
                      {suggestion.role && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {getDisplayRole(suggestion.role)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Reason & Stats */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-600">Suggested because:</div>
                      {getReasonBadge(suggestion.reason)}
                    </div>

                    <div className="flex gap-4 text-sm">
                      {suggestion.mutualConnections !== undefined && (
                        <div className="text-center">
                          <div className="font-bold text-gray-800">
                            {suggestion.mutualConnections}
                          </div>
                          <div className="text-gray-500 text-xs">Mutual</div>
                        </div>
                      )}
                      {suggestion.followerCount !== undefined && (
                        <div className="text-center">
                          <div className="font-bold text-gray-800">
                            {searchService.formatFollowerCount(suggestion.followerCount)}
                          </div>
                          <div className="text-gray-500 text-xs">Followers</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      variant={following ? "outline" : "default"}
                      size="sm"
                      onClick={() => following ? handleUnfollow(suggestion._id) : handleFollow(suggestion._id)}
                      className="flex-1 flex items-center justify-center gap-2"
                    >
                      {following ? (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDismiss(suggestion._id)}
                      className="px-3"
                      title="Not interested"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Show More */}
        {suggestions.length > filteredSuggestions.length && (
          <div className="text-center mt-8 pt-6 border-t border-gray-100">
            <p className="text-gray-600 mb-4">
              Showing {filteredSuggestions.length} of {suggestions.length} suggestions
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setDismissedIds(new Set());
                setFollowedIds(new Set());
              }}
            >
              Show dismissed suggestions
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Export variants
export const CompactSuggestionList: React.FC<Omit<SuggestionListProps, 'showHeader' | 'showFilters' | 'variant'>> = (props) => {
  return (
    <SuggestionList
      {...props}
      variant="compact"
      showHeader={false}
      showFilters={false}
      limit={4}
      maxSuggestions={4}
    />
  );
};

export const MiniSuggestionList: React.FC<Omit<SuggestionListProps, 'showHeader' | 'showFilters' | 'variant'>> = (props) => {
  return (
    <SuggestionList
      {...props}
      variant="mini"
      showHeader={false}
      showFilters={false}
      limit={3}
      maxSuggestions={3}
    />
  );
};