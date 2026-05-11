/**
 * src/social/navigation/index.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Barrel export for the Social navigation module.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export { default as SocialEntry }     from './SocialEntry';
export { default as SocialNavigator } from './SocialNavigator';
export { default as PostsNavigator }  from './PostsNavigator';

export type {
  SocialStackParamList,
  SocialTabParamList,
  SocialScreenParamList,
  PostsTabParamList,
  ChatRouteOtherUser,
} from './types';