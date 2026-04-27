// src/social/navigation/types.ts
/**
 * BananaLink Social v2.0 — Navigation param lists.
 *
 * Updated for Phase 5 to include Messages, Chat, and MessageRequests screens.
 *
 * The Chat screen's `otherUser` is intentionally loose-typed (any subset of
 * ConversationParticipant) so callers can pass whatever they have on-hand
 * from lists; ChatScreen re-fetches the full conversation on mount anyway.
 */
import type { Post } from '../types';
import { ChatUser } from '../types/chat';

export interface ChatRouteOtherUser {
  _id: string;
  name: string;
  avatar?: string | { url?: string; secure_url?: string };
  role?: string;
  headline?: string;
  lastSeen?: string | null;
  isOnline?: boolean;
  verificationStatus?: 'none' | 'partial' | 'full';
}

export type SocialStackParamList = {
  SocialSplash: undefined;
  SocialTabs: undefined | { screen?: string };

  PublicProfile: { userId: string; userName?: string };
  PostDetail: { postId: string };
  EditProfile: undefined;
  CreatePost: undefined;
  EditPost: { post: Post };
  Followers: { userId?: string; title?: string };
  Following: { userId?: string; title?: string };

  // Phase 5 — chat routes
  Messages: undefined;
  Chat: {
    conversationId: string;
    otherUser?: ChatRouteOtherUser;
  };
  MessageRequests: undefined;
};

export type SocialTabParamList = {
  Home: undefined;
  Posts: undefined;
  Network: undefined;
  Messages: undefined;  // NEW tab
  Search: undefined;
  Profile: undefined;
};

export type PostsTabParamList = {
  Feed: undefined;
  MyPosts: undefined;
  SavedPosts: undefined;
};
 
/** Screens pushable onto the Social stack from anywhere. */
export type SocialScreenParamList = {
  PublicProfile: { userId: string; userName?: string };
  PostDetail: { postId: string };
  EditProfile: undefined;
  Followers: { userId?: string; title?: string };
  Following: { userId?: string; title?: string };
 
  // Chat
  Messages: undefined;
  Chat: {
    conversationId: string;
    otherUser: ChatUser;
    /** Soft hint set by NewChatScreen when this is a Tier-2 request flow. */
    isRequestFlow?: boolean;
  };
  MessageRequests: undefined;
  NewChat: undefined;
};