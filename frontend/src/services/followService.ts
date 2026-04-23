/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * frontend/src/services/followService.ts
 * ────────────────────────────────────────────────────────────────────────────
 * BananaLink Social System v2.0 — Follow Service (web)
 *
 * Changes from v1:
 *  - Removed 'pending' / 'rejected' / 'request' flow.
 *    The new follow system is immediate (Instagram / Twitter model).
 *  - Added getConnections, isConnected, blockUser.
 *  - toggleFollow now returns `isConnected` alongside `following`.
 *  - getFollowStatusLabel simplified to 'Follow' / 'Following' / 'Blocked'.
 *
 * Signatures match the mobile followService for parity where applicable.
 * ────────────────────────────────────────────────────────────────────────────
 */
import api from '@/lib/axios';

// ── Types ─────────────────────────────────────────────────────────────────

export type FollowTargetType = 'User' | 'Company' | 'Organization';
export type FollowStatus = 'active' | 'blocked' | 'none';
export type FollowSource =
  | 'search'
  | 'suggestion'
  | 'connection'
  | 'manual'
  | 'network'
  | 'profile'
  | 'feed';

export interface Follow {
  _id: string;
  follower: string | { _id: string; name: string; avatar?: string };
  targetType: FollowTargetType;
  targetId: string | { _id: string; name: string; avatar?: string };
  status: 'active' | 'blocked';
  followSource: FollowSource;
  notifications: boolean;
  followedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface FollowStatusResponse {
  following: boolean;
  status: FollowStatus;
  followId?: string | null;
  isConnected?: boolean;
  follow?: Follow | null;
}

export interface ToggleFollowResponse {
  following: boolean;
  isConnected: boolean;
  follow: Follow | null;
}

export interface FollowResponse {
  success: boolean;
  message?: string;
  data: any;
}

export interface FollowsResponse {
  success: boolean;
  data: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface IsConnectedResponse {
  isConnected: boolean;
  iFollow: boolean;
  theyFollow: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────

class FollowService {
  // Tiny in-memory cache for single-target status lookups.
  private followStatusCache = new Map<
    string,
    FollowStatusResponse & { timestamp: number }
  >();
  private readonly CACHE_TTL = 30_000;

  private handleApiError(error: any, fallback: string): never {
    const msg =
      error?.response?.data?.message || error?.message || fallback;
    throw new Error(msg);
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
      params?: Record<string, any>;
      data?: any;
      timeout?: number;
    } = {}
  ): Promise<T> {
    const { method = 'GET', params, data, timeout = 10_000 } = options;
    try {
      const response = await api.request<T>({
        url: endpoint,
        method,
        params,
        data,
        timeout,
      });
      return response.data;
    } catch (err) {
      return this.handleApiError(err, `Request failed: ${endpoint}`);
    }
  }

  // ── Toggle follow ───────────────────────────────────────────────────

  async toggleFollow(
    targetId: string,
    opts: {
      targetType?: FollowTargetType;
      followSource?: FollowSource;
    } = {}
  ): Promise<ToggleFollowResponse> {
    try {
      this.followStatusCache.delete(targetId);
      const targetType = opts.targetType || 'User';
      const followSource = opts.followSource || 'manual';

      const response = await api.post<FollowResponse>(
        `/follow/${targetId}`,
        { targetType, followSource },
        { timeout: 10_000 }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to toggle follow');
      }

      return {
        following: !!response.data.data?.following,
        isConnected: !!response.data.data?.isConnected,
        follow: response.data.data?.follow ?? null,
      };
    } catch (err: any) {
      if (err.response?.status === 409) {
        throw new Error('Already following this user');
      }
      return this.handleApiError(err, 'Failed to toggle follow');
    }
  }

  // ── Status ──────────────────────────────────────────────────────────

  async getFollowStatus(
    targetId: string,
    targetType: FollowTargetType = 'User'
  ): Promise<FollowStatusResponse> {
    const cacheKey = `${targetId}_${targetType}`;
    const cached = this.followStatusCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached;
    }

    try {
      const response = await api.get<FollowResponse>(
        `/follow/${targetId}/status`,
        { params: { targetType }, timeout: 8_000 }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.message || 'Failed to check follow status'
        );
      }

      const d = response.data.data || {};
      const result: FollowStatusResponse = {
        following: !!d.following,
        status: (d.status as FollowStatus) || 'none',
        followId: d.followId ?? null,
        isConnected: !!d.isConnected,
        follow: d.follow ?? null,
      };

      this.followStatusCache.set(cacheKey, {
        ...result,
        timestamp: Date.now(),
      });
      return result;
    } catch (err: any) {
      if (err?.response?.status === 404) {
        return { following: false, status: 'none' };
      }
      return { following: false, status: 'none' };
    }
  }

  async getBulkFollowStatus(
    userIds: string[],
    targetType: FollowTargetType = 'User'
  ): Promise<Record<string, { following: boolean; status?: FollowStatus }>> {
    try {
      if (!userIds || userIds.length === 0) return {};
      const unique = Array.from(
        new Set(userIds.filter((id) => typeof id === 'string' && id.trim()))
      );
      if (unique.length === 0) return {};

      const response = await api.post<{
        success: boolean;
        data: Record<string, boolean>;
      }>(
        '/follow/bulk-status',
        { userIds: unique, targetType },
        { timeout: 15_000 }
      );

      if (!response.data.success) return {};

      const out: Record<string, { following: boolean; status?: FollowStatus }> =
        {};
      unique.forEach((id) => {
        const following = !!response.data.data?.[id];
        out[id] = { following, status: following ? 'active' : 'none' };
      });
      return out;
    } catch {
      // Fallback: empty map (callers treat missing as "not following")
      const out: Record<string, { following: boolean; status?: FollowStatus }> =
        {};
      userIds.forEach((id) => (out[id] = { following: false, status: 'none' }));
      return out;
    }
  }

  // ── Lists ───────────────────────────────────────────────────────────

  async getFollowers(params?: {
    page?: number;
    limit?: number;
    targetType?: FollowTargetType;
  }): Promise<FollowsResponse> {
    return this.makeRequest<FollowsResponse>('/follow/followers', {
      params: {
        page: params?.page ?? 1,
        limit: Math.min(params?.limit ?? 20, 50),
        targetType: params?.targetType ?? 'User',
      },
    });
  }

  async getFollowing(params?: {
    page?: number;
    limit?: number;
    targetType?: FollowTargetType;
  }): Promise<FollowsResponse> {
    return this.makeRequest<FollowsResponse>('/follow/following', {
      params: {
        page: params?.page ?? 1,
        limit: Math.min(params?.limit ?? 20, 50),
        ...(params?.targetType ? { targetType: params.targetType } : {}),
      },
    });
  }

  async getPublicFollowers(
    targetId: string,
    params?: {
      targetType?: FollowTargetType;
      page?: number;
      limit?: number;
    }
  ): Promise<FollowsResponse> {
    try {
      return await this.makeRequest<FollowsResponse>(
        `/follow/public/followers/${targetId}`,
        {
          params: {
            page: params?.page ?? 1,
            limit: Math.min(params?.limit ?? 20, 50),
            targetType: params?.targetType ?? 'User',
          },
        }
      );
    } catch {
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit ?? 20,
          total: 0,
          pages: 0,
        },
      };
    }
  }

  async getPublicFollowing(
    targetId: string,
    params?: {
      targetType?: FollowTargetType;
      page?: number;
      limit?: number;
    }
  ): Promise<FollowsResponse> {
    try {
      return await this.makeRequest<FollowsResponse>(
        `/follow/public/following/${targetId}`,
        {
          params: {
            page: params?.page ?? 1,
            limit: Math.min(params?.limit ?? 20, 50),
          },
        }
      );
    } catch {
      return {
        success: false,
        data: [],
        pagination: {
          page: 1,
          limit: params?.limit ?? 20,
          total: 0,
          pages: 0,
        },
      };
    }
  }

  // ── Connections (NEW) ───────────────────────────────────────────────

  async getConnections(params?: {
    page?: number;
    limit?: number;
  }): Promise<FollowsResponse> {
    return this.makeRequest<FollowsResponse>('/follow/connections', {
      params: {
        page: params?.page ?? 1,
        limit: Math.min(params?.limit ?? 20, 50),
      },
    });
  }

  async isConnected(userId: string): Promise<IsConnectedResponse> {
    try {
      const resp = await this.makeRequest<{
        success: boolean;
        data: IsConnectedResponse;
      }>(`/follow/${userId}/is-connected`);
      return (
        resp.data ?? { isConnected: false, iFollow: false, theyFollow: false }
      );
    } catch {
      return { isConnected: false, iFollow: false, theyFollow: false };
    }
  }

  async blockUser(targetId: string): Promise<{ success: boolean }> {
    try {
      const resp = await this.makeRequest<{ success: boolean }>(
        `/follow/${targetId}/block`,
        { method: 'POST' }
      );
      return { success: !!resp.success };
    } catch {
      return { success: false };
    }
  }

  // ── Stats ───────────────────────────────────────────────────────────

  async getFollowStats(): Promise<{
    followers: number;
    following: number;
    connections: number;
    totalConnections: number;
    pendingRequests: number;
  }> {
    try {
      const resp = await api.get('/follow/stats', { timeout: 8_000 });
      const d = resp.data?.data ?? {};
      return {
        followers: d.followers ?? 0,
        following: d.following ?? 0,
        connections: d.connections ?? d.totalConnections ?? 0,
        totalConnections: d.totalConnections ?? d.connections ?? 0,
        pendingRequests: 0, // always 0 in v2
      };
    } catch {
      return {
        followers: 0,
        following: 0,
        connections: 0,
        totalConnections: 0,
        pendingRequests: 0,
      };
    }
  }

  // ── Suggestions ─────────────────────────────────────────────────────

  async getFollowSuggestions(params?: {
    limit?: number;
    algorithm?: 'popular' | 'skills' | 'connections' | 'hybrid';
  }): Promise<any[]> {
    try {
      const resp = await api.get('/follow/suggestions', {
        params: {
          limit: params?.limit ?? 10,
          algorithm: params?.algorithm ?? 'hybrid',
        },
        timeout: 10_000,
      });
      return resp.data?.data ?? [];
    } catch {
      return [];
    }
  }

  // ── Legacy no-ops (kept for back-compat) ────────────────────────────
  async getPendingRequests(): Promise<FollowsResponse> {
    return {
      success: true,
      data: [],
      pagination: { page: 1, limit: 20, total: 0, pages: 0 },
    };
  }
  async acceptFollowRequest(_followId: string): Promise<{ success: boolean }> {
    return { success: true };
  }
  async rejectFollowRequest(_followId: string): Promise<{ success: boolean }> {
    return { success: true };
  }

  // ── UI helpers ──────────────────────────────────────────────────────

  /**
   * Returns the label to display on a follow button given a status.
   * v2: only 'Follow', 'Following', 'Blocked'.
   */
  getFollowStatusLabel(
    status: FollowStatus | undefined,
    following: boolean | undefined
  ): 'Follow' | 'Following' | 'Blocked' {
    if (status === 'blocked') return 'Blocked';
    if (following || status === 'active') return 'Following';
    return 'Follow';
  }

  canFollow(
    targetType: FollowTargetType,
    targetId: string,
    currentUserId?: string
  ): boolean {
    if (!targetId) return false;
    if (targetType === 'User' && currentUserId && targetId === currentUserId) {
      return false;
    }
    return true;
  }

  clearCache(targetId?: string) {
    if (targetId) {
      this.followStatusCache.delete(`${targetId}_User`);
      this.followStatusCache.delete(`${targetId}_Company`);
      this.followStatusCache.delete(`${targetId}_Organization`);
    } else {
      this.followStatusCache.clear();
    }
  }
}

export const followService = new FollowService();
export default followService;