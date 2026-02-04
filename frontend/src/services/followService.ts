/* eslint-disable @typescript-eslint/no-explicit-any */
// services/followService.ts
import api from '@/lib/axios';
import { handleError, handleSuccess } from '@/lib/error-handler';

export interface FollowUser {
  followerCount: any;
  mutualConnections: number;
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: string;
  verificationStatus?: string;
}

export interface Follow {
  _id: string;
  follower: FollowUser;
  targetType: 'User' | 'Company' | 'Organization';
  targetId: FollowUser;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  notifications: boolean;
  requestedAt: string;
  acceptedAt?: string;
  lastInteracted?: string;
  followSource?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowResponse {
  success: boolean;
  data: {
    following: boolean;
    status?: string;
    follow?: Follow;
  };
  message?: string;
}

export interface FollowsResponse {
  success: boolean;
  data: Follow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface FollowSuggestion {
  _id: string;
  name: string;
  avatar?: string;
  headline?: string;
  role?: string;
  verificationStatus?: string;
  reason: string;
  mutualConnections?: number;
  followerCount?: number;
}

export interface FollowStats {
  followers: number;
  following: number;
  pendingRequests: number;
  totalConnections: number;
}

export interface FollowStatsResponse {
  message: string;
  success: boolean;
  data: FollowStats;
}

class FollowService {
  // Cache for follow status to reduce API calls
  private followStatusCache = new Map<string, { following: boolean; status?: string; follow?: Follow; timestamp: number }>();
  private CACHE_TTL = 60000; // 1 minute cache

  private handleApiError(error: any, defaultMessage: string, shouldThrow = true): never | any {
    console.error('🔴 Follow Service Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle rate limiting specifically
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers?.['retry-after'] || 5;
      const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      handleError(message);
      
      if (shouldThrow) {
        throw new Error(message);
      }
      return null;
    }

    const errorMessage = error.response?.data?.message || error.message || defaultMessage;
    
    // Don't show error for non-critical operations
    if (shouldThrow) {
      handleError(errorMessage);
      throw new Error(errorMessage);
    }
    
    return null;
  }

  // Clear cache
  clearCache(): void {
    this.followStatusCache.clear();
  }

  // Toggle follow/unfollow
  async toggleFollow(
    targetId: string,
    data: {
      targetType?: 'User' | 'Company' | 'Organization';
      followSource?: string;
    } = {}
  ): Promise<{ following: boolean; follow?: Follow }> {
    try {
      // Clear cache for this user
      this.followStatusCache.delete(targetId);

      const response = await api.post<FollowResponse>(`/follow/${targetId}`, {
        targetType: data.targetType || 'User',
        followSource: data.followSource || 'manual'
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle follow');
      }

      const message = response.data.data.following ? 'Followed successfully' : 'Unfollowed successfully';
      handleSuccess(message);

      return {
        following: response.data.data.following,
        follow: response.data.data.follow
      };
    } catch (error: any) {
      // Handle specific error cases
      if (error.response?.status === 409) {
        // Already following - this shouldn't happen with proper UI state
        handleError('Already following this user');
        throw new Error('Already following this user');
      }
      return this.handleApiError(error, 'Failed to toggle follow') as never;
    }
  }

  // Get followers - with better error handling
  async getFollowers(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    targetId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<FollowsResponse> {
    try {
      const response = await api.get<FollowsResponse>('/follow/followers', {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50) // Reduced default limit
        }
      });
      return response.data;
    } catch (error: any) {
      // For follower list, don't throw - return empty data
      console.error('Failed to fetch followers:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Get following - with better error handling
  async getFollowing(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<FollowsResponse> {
    try {
      const response = await api.get<FollowsResponse>('/follow/following', {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50) // Reduced default limit
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch following:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Get pending follow requests
  async getPendingRequests(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    try {
      const response = await api.get<FollowsResponse>('/follow/pending', {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch pending requests:', error);
      return {
        success: false,
        data: [],
        pagination: {
          page: params?.page || 1,
          limit: params?.limit || 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Get follow suggestions
  async getFollowSuggestions(params?: {
    limit?: number;
    algorithm?: 'hybrid' | 'skills' | 'popular' | 'connections';
  }): Promise<FollowSuggestion[]> {
    try {
      const response = await api.get<{
        success: boolean;
        data: FollowSuggestion[];
        algorithm: string;
        message?: string;
      }>('/follow/suggestions', { 
        params: { 
          ...params,
          limit: Math.min(params?.limit || 5, 20) // Reduced limit
        } 
      });

      if (!response.data.success) {
        console.warn('Follow suggestions not successful:', response.data.message);
        return [];
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch follow suggestions:', error);
      // Return empty array instead of throwing to prevent UI crashes
      return [];
    }
  }

  // Get follow statistics
  async getFollowStats(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    targetId?: string;
  }): Promise<FollowStats> {
    try {
      const response = await api.get<FollowStatsResponse>('/follow/stats', {
        params: {
          targetType: params?.targetType || 'User',
          targetId: params?.targetId
        }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to fetch follow stats');
      }

      return response.data.data;
    } catch (error: any) {
      console.error('Failed to fetch follow stats:', error);
      // Return default stats instead of throwing
      return {
        followers: 0,
        following: 0,
        pendingRequests: 0,
        totalConnections: 0
      };
    }
  }

  // Accept follow request
  async acceptFollowRequest(followId: string): Promise<Follow | null> {
    try {
      const response = await api.put<FollowResponse>(`/follow/${followId}/accept`);

      if (!response.data.success || !response.data.data.follow) {
        throw new Error(response.data.message || 'Failed to accept follow request');
      }

      handleSuccess('Follow request accepted');
      return response.data.data.follow;
    } catch (error: any) {
      console.error('Failed to accept follow request:', error);
      return null;
    }
  }

  // Reject follow request
  async rejectFollowRequest(followId: string): Promise<boolean> {
    try {
      const response = await api.put<FollowResponse>(`/follow/${followId}/reject`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reject follow request');
      }

      handleSuccess('Follow request rejected');
      return true;
    } catch (error: any) {
      console.error('Failed to reject follow request:', error);
      return false;
    }
  }

  // Get mutual connections count - FIXED: Removed excessive API calls
  async getMutualConnectionsCount(targetUserId: string): Promise<number> {
    try {
      // Use a dedicated endpoint if available, otherwise return 0
      // Don't make multiple API calls here as it causes rate limiting
      return 0; // Simplified for now
    } catch (error) {
      console.error('Failed to get mutual connections count:', error);
      return 0;
    }
  }

  // Get follow status with caching
  async getFollowStatus(
    targetId: string,
    targetType: 'User' | 'Company' | 'Organization' = 'User'
  ): Promise<{ following: boolean; status?: string; follow?: Follow }> {
    const cacheKey = `${targetId}_${targetType}`;
    const cached = this.followStatusCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }

    try {
      const response = await api.get<FollowResponse>(`/follow/${targetId}/status`, {
        params: { targetType }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check follow status');
      }

      const result = {
        following: response.data.data.following || false,
        status: response.data.data.status || 'none',
        follow: response.data.data.follow
      };

      // Cache the result
      this.followStatusCache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      return result;
    } catch (error: any) {
      // Don't throw for status checks, return default
      if (error.response?.status === 404) {
        return { following: false, status: 'none' };
      }
      console.error('Error checking follow status:', error);
      return { following: false, status: 'none' };
    }
  }

async getBulkFollowStatus(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
  return this.getBulkFollowStatusV2(userIds);
}

  // Public followers (optional auth)
  async getPublicFollowers(targetId: string, params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    try {
      const response = await api.get<FollowsResponse>(`/follow/public/followers/${targetId}`, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch public followers:', error);
      // Return empty response instead of throwing for public endpoints
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit || 10,
          total: 0,
          pages: 0
        }
      };
    }
  }

  // Public following (optional auth)
  async getPublicFollowing(targetId: string, params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    try {
      const response = await api.get<FollowsResponse>(`/follow/public/following/${targetId}`, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        }
      });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch public following:', error);
      // Return empty response instead of throwing for public endpoints
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit || 10,
          total: 0,
          pages: 0
        }
      };
    }
  }
// In followService.ts - Update getBulkFollowStatusV2 method:

async getBulkFollowStatusV2(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
  try {
    if (!userIds || userIds.length === 0) return {};

    // Remove duplicates and invalid IDs
    const uniqueIds = Array.from(new Set(
      userIds.filter(id => typeof id === 'string' && id.trim() !== '')
    ));

    if (uniqueIds.length === 0) return {};

    console.log('📊 Fetching bulk follow status for:', uniqueIds.length, 'users');

    try {
      const response = await api.post<{
        [x: string]: any;
        success: boolean;
        data: Record<string, boolean>;
      }>('/follow/bulk-status', {
        userIds: uniqueIds,
        targetType: 'User'
      });

      if (!response.data.success) {
        console.warn('⚠️ Bulk follow status API error:', response.data.message);
        return this.fallbackToIndividualCalls(uniqueIds);
      }

      const results: Record<string, { following: boolean; status?: string }> = {};
      
      uniqueIds.forEach(userId => {
        const following = response.data.data[userId] || false;
        results[userId] = {
          following,
          status: following ? 'accepted' : 'none'
        };

        // Cache the result
        const cacheKey = `${userId}_User`;
        this.followStatusCache.set(cacheKey, {
          following,
          status: following ? 'accepted' : 'none',
          timestamp: Date.now()
        });
      });

      console.log('✅ Bulk follow status fetched successfully');
      return results;
    } catch (error: any) {
      // If bulk endpoint doesn't exist (400 error), fall back to individual calls
      if (error.response?.status === 400 || error.response?.status === 404) {
        console.warn('⚠️ Bulk endpoint not available, falling back to individual calls');
        return this.fallbackToIndividualCalls(uniqueIds);
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to get bulk follow status:', error);
    return this.fallbackToIndividualCalls(userIds);
  }
}

// Add fallback method
private async fallbackToIndividualCalls(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
  const results: Record<string, { following: boolean; status?: string }> = {};
  
  // Process in small batches to avoid rate limiting
  const batchSize = 3;
  for (let i = 0; i < userIds.length; i += batchSize) {
    const batch = userIds.slice(i, i + batchSize);
    
    const batchPromises = batch.map(async (userId, index) => {
      // Small delay between requests
      if (index > 0) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      try {
        const status = await this.getFollowStatus(userId);
        return { userId, ...status };
      } catch (error) {
        console.error(`Failed to get follow status for ${userId}:`, error);
        return { userId, following: false, status: 'none' };
      }
    });
    
    const batchResults = await Promise.all(batchPromises);
    batchResults.forEach(({ userId, following, status }) => {
      results[userId] = { following, status };
    });
  }
  
  return results;
}
  // Utility functions
  canFollow(targetType: string, targetId: string, currentUserId?: string): boolean {
    if (!currentUserId) return true;

    // Prevent self-follow
    if (targetType === 'User' && targetId === currentUserId) {
      return false;
    }

    return true;
  }

  getFollowStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'pending': 'Requested',
      'accepted': 'Following',
      'rejected': 'Rejected',
      'blocked': 'Blocked',
      'none': 'Not Following'
    };
    return labels[status] || status;
  }

  getFollowStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'pending': 'warning',
      'accepted': 'success',
      'rejected': 'error',
      'blocked': 'error',
      'none': 'default'
    };
    return colors[status] || 'default';
  }

  getFollowStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'pending': 'secondary',
      'accepted': 'default',
      'rejected': 'destructive',
      'blocked': 'destructive',
      'none': 'outline'
    };
    return variants[status] || 'outline';
  }

  shouldShowFollowButton(
    currentStatus: string,
    isOwnProfile: boolean
  ): boolean {
    if (isOwnProfile) return false;

    const hiddenStatuses = ['accepted', 'pending'];
    return !hiddenStatuses.includes(currentStatus);
  }

  shouldShowUnfollowButton(currentStatus: string): boolean {
    return currentStatus === 'accepted';
  }

  shouldShowPendingButton(currentStatus: string): boolean {
    return currentStatus === 'pending';
  }

  // Network quality assessment
  getNetworkQuality(followers: number, following: number): {
    level: 'excellent' | 'good' | 'average' | 'poor';
    label: string;
    description: string;
  } {
    const ratio = followers > 0 ? following / followers : 0;

    if (followers > 1000 && ratio < 2) {
      return {
        level: 'excellent',
        label: 'Elite Network',
        description: 'Strong influencer with high follower engagement'
      };
    } else if (followers > 500 && ratio < 3) {
      return {
        level: 'good',
        label: 'Quality Network',
        description: 'Well-balanced following with good engagement'
      };
    } else if (followers > 100 && ratio < 5) {
      return {
        level: 'average',
        label: 'Growing Network',
        description: 'Developing network with potential for growth'
      };
    } else {
      return {
        level: 'poor',
        label: 'Building Network',
        description: 'Early stage network, focus on quality connections'
      };
    }
  }

  // Format follower count for display
  formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  // Calculate engagement rate
  calculateEngagementRate(followers: number, interactions: number): number {
    if (followers === 0) return 0;
    return Math.round((interactions / followers) * 100);
  }
}

export const followService = new FollowService();
export default followService;