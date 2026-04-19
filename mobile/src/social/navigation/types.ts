/**
 * Social module navigation param lists. Matches the blueprint and
 * banana-social-navigation skill exactly.
 */

export type SocialStackParamList = {
  SocialSplash: undefined;
  SocialTabs: undefined;
  PublicProfile: { userId: string; userName?: string };
  PostDetail: { postId: string };
  EditProfile: undefined;
  Followers: { userId?: string; title?: string };
  Following: { userId?: string; title?: string };
};

export type SocialTabParamList = {
  Home: undefined;
  Posts: undefined;
  Network: undefined;
  Search: undefined;
  Profile: undefined;
};

export type PostsTabParamList = {
  Feed: undefined;
  MyPosts: undefined;
  SavedPosts: undefined;
};