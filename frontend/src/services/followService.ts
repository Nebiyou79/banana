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
  isFollowing // Return empty response instead of throwing for public endpoints
    (profileUserId: string) {
    throw new Error('Method not implemented.');
  }
  unfollow(profileUserId: string) {
    throw new Error('Method not implemented.');
  }
  follow(profileUserId: string) {
    throw new Error('Method not implemented.');
  }
  private handleApiError(error: any, defaultMessage: string): never {
    console.error('🔴 Follow Service Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });

    const errorMessage = error.response?.data?.message || error.message || defaultMessage;
    handleError(errorMessage);
    throw new Error(errorMessage);
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

  // // Check follow status
  // async getFollowStatus(
  //   targetId: string,
  //   targetType: 'User' | 'Company' | 'Organization' = 'User'
  // ): Promise<{ following: boolean; status?: string; follow?: Follow }> {
  //   try {
  //     const response = await api.get<FollowResponse>(`/follow/${targetId}/status`, {
  //       params: { targetType }
  //     });

  //     if (!response.data.success) {
  //       throw new Error(response.data.message || 'Failed to check follow status');
  //     }

  //     return response.data.data;
  //   } catch (error: any) {
  //     return this.handleApiError(error, 'Failed to check follow status') as never;
  //   }
  // }

  // Get followers
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
          limit: Math.min(params?.limit || 50, 100)
        }
      });
      return response.data;
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to fetch followers') as never;
    }
  }

  // Get following
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
          limit: Math.min(params?.limit || 50, 100)
        }
      });
      return response.data;
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to fetch following') as never;
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
          limit: Math.min(params?.limit || 50, 100)
        }
      });
      return response.data;
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to fetch pending requests') as never;
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
      }>('/follow/suggestions', { params });

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
  async acceptFollowRequest(followId: string): Promise<Follow> {
    try {
      const response = await api.put<FollowResponse>(`/follow/${followId}/accept`);

      if (!response.data.success || !response.data.data.follow) {
        throw new Error(response.data.message || 'Failed to accept follow request');
      }

      handleSuccess('Follow request accepted');
      return response.data.data.follow;
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to accept follow request') as never;
    }
  }

  // Reject follow request
  async rejectFollowRequest(followId: string): Promise<void> {
    try {
      const response = await api.put<FollowResponse>(`/follow/${followId}/reject`);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to reject follow request');
      }

      handleSuccess('Follow request rejected');
    } catch (error: any) {
      return this.handleApiError(error, 'Failed to reject follow request') as never;
    }
  }

  // Get mutual connections count
  async getMutualConnectionsCount(targetUserId: string): Promise<number> {
    try {
      // This would typically be a separate API endpoint
      // For now, we'll calculate it client-side by comparing followers
      const [userFollowers, targetFollowers] = await Promise.all([
        this.getFollowers({ targetType: 'User', limit: 1000 }),
        this.getFollowers({ targetType: 'User', targetId: targetUserId, limit: 1000 })
      ]);

      const userFollowerIds = new Set(userFollowers.data.map(f => f.follower._id));
      const targetFollowerIds = new Set(targetFollowers.data.map(f => f.follower._id));

      let mutualCount = 0;
      userFollowerIds.forEach(id => {
        if (targetFollowerIds.has(id)) {
          mutualCount++;
        }
      });

      return mutualCount;
    } catch (error) {
      console.error('Failed to get mutual connections count:', error);
      return 0;
    }
  }

  // Bulk follow status check - optimized
  async getBulkFollowStatus(userIds: string[]): Promise<Record<string, { following: boolean; status?: string }>> {
    try {
      // Check if the current user follows each target user
      const statusPromises = userIds.map(userId =>
        this.getFollowStatus(userId).then(status => ({
          userId,
          following: status.following,
          status: status.status
        }))
      );

      const results = await Promise.all(statusPromises);
      return results.reduce((acc, { userId, following, status }) => {
        acc[userId] = { following, status };
        return acc;
      }, {} as Record<string, { following: boolean; status?: string }>);
    } catch (error) {
      console.error('Failed to get bulk follow status:', error);
      return {};
    }
  }

  // Also update the getFollowStatus method to be more robust
  async getFollowStatus(
    targetId: string,
    targetType: 'User' | 'Company' | 'Organization' = 'User'
  ): Promise<{ following: boolean; status?: string; follow?: Follow }> {
    try {
      const response = await api.get<FollowResponse>(`/follow/${targetId}/status`, {
        params: { targetType }
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to check follow status');
      }

      return {
        following: response.data.data.following || false,
        status: response.data.data.status || 'none',
        follow: response.data.data.follow
      };
    } catch (error: any) {
      // Don't throw for status checks, return default
      if (error.response?.status === 404) {
        return { following: false, status: 'none' };
      }
      console.error('Error checking follow status:', error);
      return { following: false, status: 'none' };
    }
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
          limit: Math.min(params?.limit || 50, 100)
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
          limit: params?.limit || 50,
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
          limit: Math.min(params?.limit || 50, 100)
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
          limit: params?.limit || 50,
          total: 0,
          pages: 0
        }
      };
    }
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