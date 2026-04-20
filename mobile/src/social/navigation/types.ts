// src/social/navigation/types.ts
import type { Post } from '../types';

export type SocialStackParamList = {
  SocialSplash: undefined;
  SocialTabs: undefined;
  PublicProfile: { userId: string; userName?: string };
  PostDetail: { postId: string };
  EditProfile: undefined;
  CreatePost: undefined;
  EditPost: { post: Post };
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