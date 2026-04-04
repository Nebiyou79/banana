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
  [x: string]: any;
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
  
  // Request tracking to prevent duplicate calls
  private pendingRequests = new Map<string, Promise<any>>();
  private requestCounts = new Map<string, { count: number; timestamp: number }>();
  private readonly RATE_LIMIT_WINDOW = 60000; // 1 minute
  private readonly MAX_REQUESTS_PER_MINUTE = 30;

  private checkRateLimit(endpoint: string): boolean {
    const now = Date.now();
    const key = endpoint.split('?')[0]; // Remove query params
    const requestData = this.requestCounts.get(key) || { count: 0, timestamp: now };
    
    // Reset if window has passed
    if (now - requestData.timestamp > this.RATE_LIMIT_WINDOW) {
      requestData.count = 0;
      requestData.timestamp = now;
    }
    
    // Check if over limit
    if (requestData.count >= this.MAX_REQUESTS_PER_MINUTE) {
      console.warn(`⚠️ Rate limit exceeded for ${key}, blocking request`);
      return false;
    }
    
    // Increment count
    requestData.count++;
    this.requestCounts.set(key, requestData);
    return true;
  }

  private async makeRequest<T>(endpoint: string, config?: any): Promise<T> {
    const cacheKey = `${endpoint}_${JSON.stringify(config?.params || {})}`;
    
    // Check for duplicate pending request
    if (this.pendingRequests.has(cacheKey)) {
      console.log('📦 Reusing pending request for:', endpoint);
      return this.pendingRequests.get(cacheKey);
    }
    
    // Check rate limit
    if (!this.checkRateLimit(endpoint)) {
      throw new Error('RATE_LIMIT_EXCEEDED');
    }
    
    // Create request promise
    const requestPromise = api.get<T>(endpoint, {
      timeout: 10000,
      ...config
    }).then(response => response.data)
      .finally(() => {
        // Remove from pending after completion
        setTimeout(() => {
          this.pendingRequests.delete(cacheKey);
        }, 1000);
      });
    
    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  private handleApiError(error: any, defaultMessage: string, shouldThrow = true): never | any {
    console.error('🔴 Follow Service Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    // Handle rate limiting specifically
    if (error.response?.status === 429 || error.message === 'RATE_LIMIT_EXCEEDED') {
      const retryAfter = error.response?.headers?.['retry-after'] || 60;
      const message = `Too many requests. Please wait ${retryAfter} seconds before trying again.`;
      handleError(message);
      
      if (shouldThrow) {
        throw new Error(message);
      }
      return null;
    }

    // Handle timeout specifically
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      const message = 'Request timed out. Please check your connection and try again.';
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
    this.pendingRequests.clear();
    this.requestCounts.clear();
  }

// Toggle follow/unfollow - WITH FIXED TARGET TYPE MAPPING
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

    // Send the targetType directly as-is (backend expects 'User', 'Company', 'Organization')
    const backendTargetType = data.targetType || 'User';
    
    console.log('📤 Sending follow request with targetType:', backendTargetType);

    const response = await api.post<FollowResponse>(`/follow/${targetId}`, {
      targetType: backendTargetType,
      followSource: data.followSource || 'manual'
    }, {
      timeout: 10000 // 10 second timeout
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
      handleError('Already following this user');
      throw new Error('Already following this user');
    }
    
    // Log the actual error for debugging
    console.error('Follow error details:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    
    return this.handleApiError(error, 'Failed to toggle follow') as never;
  }
}

  // Get followers - with debouncing and rate limiting
  async getFollowers(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    targetId?: string;
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<FollowsResponse> {
    const endpoint = '/follow/followers';
    
    try {
      const response = await this.makeRequest<FollowsResponse>(endpoint, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        },
        timeout: 10000,
        timeoutErrorMessage: 'Request timed out while fetching followers'
      });
      return response;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for followers, returning cached/empty data');
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
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching followers, returning empty results');
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

  // Get following - with rate limiting
  async getFollowing(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
    status?: string;
  }): Promise<FollowsResponse> {
    const endpoint = '/follow/following';
    
    try {
      const response = await this.makeRequest<FollowsResponse>(endpoint, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        },
        timeout: 10000,
        timeoutErrorMessage: 'Request timed out while fetching following list'
      });
      return response;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for following');
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
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching following list');
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
    const endpoint = '/follow/pending';
    
    try {
      const response = await this.makeRequest<FollowsResponse>(endpoint, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        },
        timeout: 10000,
        timeoutErrorMessage: 'Request timed out while fetching pending requests'
      });
      return response;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for pending requests');
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
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching pending requests');
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
    const endpoint = '/follow/suggestions';
    
    try {
      const response = await this.makeRequest<{
        success: boolean;
        data: FollowSuggestion[];
        algorithm: string;
        message?: string;
      }>(endpoint, { 
        params: { 
          ...params,
          limit: Math.min(params?.limit || 5, 20)
        },
        timeout: 8000,
        timeoutErrorMessage: 'Request timed out while fetching suggestions'
      });

      if (!response.success) {
        console.warn('Follow suggestions not successful:', response.message);
        return [];
      }

      return response.data;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for suggestions');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching suggestions');
      } else {
        console.error('Failed to fetch follow suggestions:', error);
      }
      return [];
    }
  }

  // Get follow statistics
  async getFollowStats(params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    targetId?: string;
  }): Promise<FollowStats> {
    const endpoint = '/follow/stats';
    
    try {
      const response = await this.makeRequest<FollowStatsResponse>(endpoint, {
        params: {
          targetType: params?.targetType || 'User',
          targetId: params?.targetId
        },
        timeout: 8000,
        timeoutErrorMessage: 'Request timed out while fetching stats'
      });

      if (!response.success) {
        console.warn('Failed to fetch follow stats:', response.message);
        throw new Error(response.message || 'Failed to fetch follow stats');
      }

      return response.data;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for stats');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching follow stats');
      } else {
        console.error('Failed to fetch follow stats:', error);
      }
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
      const response = await api.put<FollowResponse>(`/follow/${followId}/accept`, {}, {
        timeout: 10000
      });

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
      const response = await api.put<FollowResponse>(`/follow/${followId}/reject`, {}, {
        timeout: 10000
      });

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

  // Get mutual connections count
  async getMutualConnectionsCount(targetUserId: string): Promise<number> {
    try {
      return 0;
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
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }

    try {
      const response = await api.get<FollowResponse>(`/follow/${targetId}/status`, {
        params: { targetType },
        timeout: 8000
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check follow status');
      }

      const result = {
        following: response.data.data.following || false,
        status: response.data.data.status || 'none',
        follow: response.data.data.follow
      };

      this.followStatusCache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });

      return result;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return { following: false, status: 'none' };
      }
      
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout checking follow status');
      } else {
        console.error('Error checking follow status:', error);
      }
      
      return { following: false, status: 'none' };
    }
  }

  async getBulkFollowStatus(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
    return this.getBulkFollowStatusV2(userIds);
  }

  // Public followers
  async getPublicFollowers(targetId: string, params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    const endpoint = `/follow/public/followers/${targetId}`;
    
    try {
      const response = await this.makeRequest<FollowsResponse>(endpoint, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        },
        timeout: 10000
      });
      return response;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for public followers');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching public followers');
      } else {
        console.error('Failed to fetch public followers:', error);
      }
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

  // Public following
  async getPublicFollowing(targetId: string, params?: {
    targetType?: 'User' | 'Company' | 'Organization';
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    const endpoint = `/follow/public/following/${targetId}`;
    
    try {
      const response = await this.makeRequest<FollowsResponse>(endpoint, {
        params: {
          ...params,
          page: params?.page || 1,
          limit: Math.min(params?.limit || 10, 50)
        },
        timeout: 10000
      });
      return response;
    } catch (error: any) {
      if (error.message === 'RATE_LIMIT_EXCEEDED' || error.response?.status === 429) {
        console.warn('⚠️ Rate limit exceeded for public following');
      } else if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        console.warn('⚠️ Timeout fetching public following');
      } else {
        console.error('Failed to fetch public following:', error);
      }
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

  async getBulkFollowStatusV2(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
    try {
      if (!userIds || userIds.length === 0) return {};

      const uniqueIds = Array.from(new Set(
        userIds.filter(id => typeof id === 'string' && id.trim() !== '')
      ));

      if (uniqueIds.length === 0) return {};

      console.log('📊 Fetching bulk follow status for:', uniqueIds.length, 'users');

      try {
        const response = await api.post<{
          success: boolean;
          data: Record<string, boolean>;
        }>('/follow/bulk-status', {
          userIds: uniqueIds,
          targetType: 'User'
        }, {
          timeout: 15000
        });

        if (!response.data.success) {
          console.warn('⚠️ Bulk follow status API error:', response.data);
          return this.fallbackToIndividualCalls(uniqueIds);
        }

        const results: Record<string, { following: boolean; status?: string }> = {};
        
        uniqueIds.forEach(userId => {
          const following = response.data.data[userId] || false;
          results[userId] = {
            following,
            status: following ? 'accepted' : 'none'
          };

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
        if (error.response?.status === 400 || error.response?.status === 404) {
          console.warn('⚠️ Bulk endpoint not available, falling back to individual calls');
          return this.fallbackToIndividualCalls(uniqueIds);
        }
        
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit exceeded in bulk follow status');
          return this.createDefaultResults(uniqueIds);
        }
        
        if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
          console.warn('⚠️ Timeout in bulk follow status');
          return this.createDefaultResults(uniqueIds);
        }
        
        throw error;
      }
    } catch (error) {
      console.error('❌ Failed to get bulk follow status:', error);
      return this.fallbackToIndividualCalls(userIds);
    }
  }

  private async fallbackToIndividualCalls(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
    const results: Record<string, { following: boolean; status?: string }> = {};
    
    const batchSize = 2;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (userId, index) => {
        if (index > 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
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
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  private createDefaultResults(userIds: string[]): Record<string, { following: boolean; status?: string }> {
    const results: Record<string, { following: boolean; status?: string }> = {};
    userIds.forEach(userId => {
      results[userId] = { following: false, status: 'none' };
    });
    return results;
  }

  // Utility functions
  canFollow(targetType: string, targetId: string, currentUserId?: string): boolean {
    if (!currentUserId) return true;
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

  shouldShowFollowButton(currentStatus: string, isOwnProfile: boolean): boolean {
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

  formatFollowerCount(count: number): string {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }

  calculateEngagementRate(followers: number, interactions: number): number {
    if (followers === 0) return 0;
    return Math.round((interactions / followers) * 100);
  }
}

export const followService = new FollowService();
export default followService;