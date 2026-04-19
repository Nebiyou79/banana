/**
 * Centralized query key factory. Use these instead of hardcoding arrays.
 * Prefix arrays starting with ['social', '<section>'] can be used for
 * coarse-grained `invalidateQueries` / `setQueriesData`.
 */
export const SOCIAL_KEYS = {
  // Posts
  feed: (filters?: object) => ['social', 'feed', filters ?? {}] as const,
  myPosts: (filters?: object) => ['social', 'myPosts', filters ?? {}] as const,
  savedPosts: (filters?: object) =>
    ['social', 'savedPosts', filters ?? {}] as const,
  post: (id: string) => ['social', 'post', id] as const,
  profilePosts: (userId: string) =>
    ['social', 'profilePosts', userId] as const,

  // Comments
  comments: (postId: string) => ['social', 'comments', postId] as const,
  replies: (commentId: string) => ['social', 'replies', commentId] as const,

  // Follow
  followStats: ['social', 'followStats'] as const,
  followers: (userId?: string) =>
    ['social', 'followers', userId ?? 'me'] as const,
  following: (userId?: string) =>
    ['social', 'following', userId ?? 'me'] as const,
  suggestions: ['social', 'suggestions'] as const,
  pending: ['social', 'pending'] as const,
  followStatus: (targetId: string) =>
    ['social', 'followStatus', targetId] as const,
  bulkFollowStatus: (ids: string[]) =>
    ['social', 'bulkFollowStatus', [...ids].sort()] as const,

  // Profile
  ownProfile: ['social', 'ownProfile'] as const,
  publicProfile: (userId: string) =>
    ['social', 'publicProfile', userId] as const,
  profileCompletion: ['social', 'profileCompletion'] as const,
  popularProfiles: (params?: object) =>
    ['social', 'popularProfiles', params ?? {}] as const,
  roleProfile: (role: string) => ['social', 'roleProfile', role] as const,

  // Search
  searchProfiles: (params: object) =>
    ['social', 'searchProfiles', params] as const,
  searchPosts: (q: string) => ['social', 'searchPosts', q] as const,
  searchHashtags: (q: string) => ['social', 'searchHashtags', q] as const,
  unifiedSearch: (q: string) => ['social', 'unifiedSearch', q] as const,
  searchHistory: ['social', 'searchHistory'] as const,
} as const;
