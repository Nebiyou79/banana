// =============================================================================
// FILE: mobile/src/social/hooks/queryKeys.ts — COMPLETE UPDATE v4
// =============================================================================

/**
 * Query key factory — single source of truth for TanStack Query keys.
 * Keep this file in sync with all hook imports.
 * 
 * v4 CHANGES:
 * - Added searchSuggestions key for typeahead endpoint
 * - Added trendingHashtags key for trending endpoint
 * - Fixed conversations key to remove unused filter param (backend returns all)
 * - Added typing key for socket-driven typing indicators
 * - Added unreadCount key for badge queries
 * - Standardized array ordering: ['social', domain, ...specific]
 */

export const SOCIAL_KEYS = {
  // ── Posts ─────────────────────────────────────────────────────────────
  feed: (filters?: object) => ['social', 'feed', filters] as const,
  myPosts: (filters?: object) => ['social', 'myPosts', filters] as const,
  savedPosts: (filters?: object) => ['social', 'savedPosts', filters] as const,
  post: (id: string) => ['social', 'post', id] as const,
  profilePosts: (userId: string) => ['social', 'profilePosts', userId] as const,

  // ── Comments ──────────────────────────────────────────────────────────
  comments: (postId: string) => ['social', 'comments', postId] as const,
  replies: (commentId: string) => ['social', 'replies', commentId] as const,

  // ── Follow ────────────────────────────────────────────────────────────
  followStats: ['social', 'followStats'] as const,
  followers: (userId?: string) => ['social', 'followers', userId] as const,
  following: (userId?: string) => ['social', 'following', userId] as const,
  suggestions: ['social', 'suggestions'] as const,
  followStatus: (targetId: string) =>
    ['social', 'followStatus', targetId] as const,

  // ── Connections ───────────────────────────────────────────────────────
  connections: ['social', 'connections'] as const,
  isConnected: (userId: string) =>
    ['social', 'isConnected', userId] as const,

  // ── Profile ───────────────────────────────────────────────────────────
  ownProfile: ['social', 'ownProfile'] as const,
  publicProfile: (userId: string) =>
    ['social', 'publicProfile', userId] as const,
  profileCompletion: ['social', 'profileCompletion'] as const,
  popularProfiles: (params?: object) =>
    ['social', 'popularProfiles', params] as const,
  roleProfile: (role: string) => ['social', 'roleProfile', role] as const,

  // ── Search ────────────────────────────────────────────────────────────
  searchProfiles: (params: object) =>
    ['social', 'searchProfiles', params] as const,

  searchPosts: (params: object) =>
    ['social', 'searchPosts', params] as const,

  searchHashtags: (query: string, trending?: boolean) =>
    ['social', 'searchHashtags', query, trending ?? false] as const,

  // NEW: Typeahead suggestions (≤8 results, fast endpoint)
  searchSuggestions: (query: string, type?: string) =>
    ['social', 'searchSuggestions', query, type ?? 'all'] as const,

  // NEW: Trending hashtags with days/limit params
  trendingHashtags: (days?: number, limit?: number) =>
    ['social', 'trendingHashtags', days ?? 7, limit ?? 20] as const,

  searchUnified: (params: object) =>
    ['social', 'searchUnified', params] as const,

  searchHistory: ['social', 'searchHistory'] as const,

  // ── Chat (Conversations) ──────────────────────────────────────────────
  // UPDATED: Removed filter param — backend returns active + request by default
  conversations: ['social', 'conversations'] as const,

  messageRequests: ['social', 'messageRequests'] as const,

  conversation: (id: string) => ['social', 'conversation', id] as const,

  messages: (conversationId: string) =>
    ['social', 'messages', conversationId] as const,

  onlineContacts: ['social', 'onlineContacts'] as const,

  presence: (userId: string) => ['social', 'presence', userId] as const,

  // NEW: Typing indicator (socket-driven, per conversation per user)
  typing: (conversationId: string, userId: string) =>
    ['social', 'typing', conversationId, userId] as const,

  // NEW: Unread message count for badge
  unreadCount: (conversationId: string) =>
    ['social', 'unreadCount', conversationId] as const,

  // NEW: Total unread count across all conversations (for app badge)
  totalUnread: ['social', 'totalUnread'] as const,
} as const;

// ─── Type export for consumers ───────────────────────────────────────────────

export type SocialQueryKeys = typeof SOCIAL_KEYS;