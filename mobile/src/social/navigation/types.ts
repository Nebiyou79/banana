/**
 * src/social/navigation/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Social — navigation param lists v3
 *
 * Architecture:
 *   RoleNavigator (bottom tabs per role)
 *     └─ "Social" tab → SocialEntry (NativeStack)
 *          ├─ SocialSplash          (initial splash)
 *          ├─ SocialTabs            (SocialNavigator — bottom tab)
 *          │    ├─ Posts            (PostsNavigator — material top tabs)
 *          │    │    ├─ Feed
 *          │    │    ├─ MyPosts
 *          │    │    └─ SavedPosts
 *          │    ├─ Network
 *          │    ├─ Messages         (MessagesScreen — inbox)
 *          │    ├─ Search
 *          │    └─ Profile
 *          │
 *          └─ Push screens (slide in over the tabs):
 *               PublicProfile, PostDetail, EditProfile,
 *               Followers, Following,
 *               Chat, MessageRequests, NewChat
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Post } from '../types';
import type { ChatUser } from '../types/chat';

// ─── Shared otherUser shape for Chat route ────────────────────────────────────

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

// ─── Full Social stack (SocialEntry root) ─────────────────────────────────────
// Every screen that can be navigated to from within Social lives here.

export type SocialStackParamList = {
  // Initial screens
  SocialSplash: undefined;
  SocialTabs:   undefined | { screen?: keyof SocialTabParamList };

  // Profile push screens
  PublicProfile: { userId: string; userName?: string };
  PostDetail:    { postId: string };
  EditProfile:   undefined;
  Followers:     { userId?: string; title?: string };
  Following:     { userId?: string; title?: string };
  // Post editing
  EditPost:      { post: import('../types').Post };
  // Chat push screens
  Messages:        undefined;
  Chat:            { conversationId: string; otherUser?: ChatRouteOtherUser };
  MessageRequests: undefined;
  NewChat:         { preselectedUserId?: string } | undefined;
   CreatePost: undefined
};

// ─── Bottom-tab screens (SocialNavigator) ────────────────────────────────────

export type SocialTabParamList = {
  Posts:    undefined;
  Network:  undefined;
  Messages: undefined;
  Search:   undefined;
  Profile:  undefined;
Back:     undefined;};

// ─── Posts top-tab screens (PostsNavigator) ───────────────────────────────────

export type PostsTabParamList = {
  Feed:       undefined;
  MyPosts:    undefined;
  SavedPosts: undefined;
};

// ─── Alias for push-screens from anywhere inside Social ──────────────────────
// This is the same as SocialStackParamList but re-exported for convenience
// when screens call `useNavigation<NativeStackNavigationProp<SocialScreenParamList>>()`.

export type SocialScreenParamList = SocialStackParamList;