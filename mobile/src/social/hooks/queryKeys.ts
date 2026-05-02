/**
 * Query key factory — single source of truth for TanStack Query keys.
 * Keep this file in sync with all hook imports.
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

  // ── Connections (NEW) ─────────────────────────────────────────────────
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
 
  // ── FIX: roleProfile was missing — caused "is not a function" crash ───
  roleProfile: (role: string) => ['social', 'roleProfile', role] as const,

// ── Search ────────────────────────────────────────────────────────────
searchProfiles: (params: object) =>
  ['social', 'searchProfiles', params] as const,

searchPosts: (params: object) =>
  ['social', 'searchPosts', params] as const,

searchHashtags: (query: string, trending?: boolean) =>
  ['social', 'searchHashtags', query, trending ?? false] as const,

searchUnified: (params: object) =>
  ['social', 'searchUnified', params] as const,

searchHistory: ['social', 'searchHistory'] as const,

  // ── Chat (NEW) ────────────────────────────────────────────────────────
  conversations: (filter?: string) =>
    ['social', 'conversations', filter ?? 'all'] as const,
  messageRequests: ['social', 'messageRequests'] as const,
  conversation: (id: string) => ['social', 'conversation', id] as const,
  messages: (conversationId: string) =>
    ['social', 'messages', conversationId] as const,
  onlineContacts: ['social', 'onlineContacts'] as const,
  presence: (userId: string) => ['social', 'presence', userId] as const,
} as const;