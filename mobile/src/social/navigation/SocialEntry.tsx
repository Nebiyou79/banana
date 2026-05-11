/**
 * src/social/navigation/SocialEntry.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Social v3 — Root of the Social feature
 *
 * Responsibilities:
 *  1. Bootstraps the socket connection via useSocketBootstrap().
 *  2. Registers every social screen in one NativeStack.
 *  3. SocialNavigator (bottom tabs) sits at "SocialTabs".
 *  4. All push screens (profile, chat, post detail …) are siblings of
 *     SocialTabs so they slide over the tab bar cleanly.
 *
 * Navigation flow:
 *  SocialSplash → SocialTabs (bottom tabs)
 *                   └─ push from any tab:
 *                        PublicProfile, PostDetail, EditProfile,
 *                        Followers, Following,
 *                        Chat, MessageRequests, NewChat
 *
 * NOTE: MessagesScreen (inbox) lives INSIDE the bottom tabs at the
 * "Messages" tab, NOT as a push screen. Only Chat (room), MessageRequests,
 * and NewChat are push screens.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Navigators
import SocialNavigator from './SocialNavigator';

// Screens — splash
import SocialSplashScreen from '../screens/SocialSplashScreen';

// Screens — profile & posts
import PublicProfileScreen from '../screens/PublicProfileScreen';
import PostDetailScreen    from '../screens/PostDetailScreen';
import EditProfileScreen   from '../screens/EditProfileScreen';
import FollowListScreen    from '../screens/FollowListScreen';

// Screens — chat
import ChatScreen            from '../screens/ChatScreen';
import MessageRequestsScreen from '../screens/MessageRequestsScreen';
import NewChatScreen         from '../screens/NewChatScreen';

// Socket bootstrap
import { useSocketBootstrap } from '../hooks/useSocket';

import type { SocialStackParamList } from './types';

const Stack = createNativeStackNavigator<SocialStackParamList>();

const SocialEntry: React.FC = () => {
  // Connect socket once at the root of the social module.
  // Disconnects automatically when SocialEntry unmounts.
  useSocketBootstrap();

  return (
    <Stack.Navigator
      initialRouteName="SocialSplash"
      screenOptions={{ headerShown: false }}
    >
      {/* ── Initial splash → auto-navigates to SocialTabs ── */}
      <Stack.Screen
        name="SocialSplash"
        component={SocialSplashScreen}
      />

      {/* ── Bottom tab container ── */}
      <Stack.Screen
        name="SocialTabs"
        component={SocialNavigator}
      />

      {/* ── Profile push screens ── */}
      <Stack.Screen
        name="PublicProfile"
        component={PublicProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="PostDetail"
        component={PostDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          animation:    'slide_from_bottom',
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="Followers"
        component={FollowListScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="Following"
        component={FollowListScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* ── Chat push screens ─────────────────────────────────────────────
           MessagesScreen (inbox) is NOT registered here — it lives inside
           the bottom tab as the "Messages" tab in SocialNavigator.
           Only the chat ROOM and supporting screens are push screens.
      ── */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="MessageRequests"
        component={MessageRequestsScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="NewChat"
        component={NewChatScreen}
        options={{
          animation:    'slide_from_bottom',
          presentation: 'modal',
        }}
      />
    </Stack.Navigator>
  );
};

export default SocialEntry;