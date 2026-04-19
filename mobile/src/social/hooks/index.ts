export { SOCIAL_KEYS } from './queryKeys';

// Feed
export { useFeed } from './useFeed';

// Posts
export { usePost, useSharePost } from './usePost';
export {
  useMyPosts,
  useCreatePost,
  useUpdatePost,
  useDeletePost,
} from './useMyPosts';
export { useSavedPosts, useToggleSavePost } from './useSavedPosts';

// Comments
export {
  useComments,
  useReplies,
  useAddComment,
  useAddReply,
  useUpdateComment,
  useDeleteComment,
  useToggleCommentLike,
} from './useComments';

// Reactions
export { useReact, useDislike, useRemoveInteraction } from './useLike';

// Follow
export {
  useFollowStatus,
  useBulkFollowStatus,
  useToggleFollow,
  usePendingRequests,
  useAcceptFollowRequest,
  useRejectFollowRequest,
} from './useFollow';
export { useFollowers, useFollowing } from './useFollowList';
export { useFollowStats } from './useFollowStats';
export { useFollowSuggestions } from './useFollowSuggestions';

// Search
export {
  useSocialSearch,
  useSearchPosts,
  useSearchHashtags,
  useUnifiedSearch,
  useSearchHistory,
  useAddSearchHistory,
  useRemoveSearchHistoryEntry,
  useClearSearchHistory,
} from './useSocialSearch';

// Profile
export {
  useOwnProfile,
  useProfileCompletion,
  useUpdateProfile,
  useUploadAvatar,
  useUploadCover,
  useDeleteAvatar,
  useDeleteCover,
  useUpdateSocialLinks,
  usePopularProfiles,
} from './useProfile';
export { useRoleProfile, useUpdateRoleProfile } from './useRoleProfile';
export { usePublicProfile } from './usePublicProfile';

// Cache helpers (internal but exported in case screens need them)
export {
  updateAllPostCaches,
  snapshotAllPostCaches,
  restoreAllPostCaches,
} from './_cacheHelpers';
