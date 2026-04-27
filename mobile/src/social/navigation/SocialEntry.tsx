// src/social/navigation/SocialEntry.tsx
/**
 * SocialEntry — root of the Social feature.
 * -----------------------------------------------------------------------------
 *   1. Bootstraps the socket connection (useSocketBootstrap).
 *   2. Registers every screen in the social module, including chat.
 */

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';

import SocialSplashScreen from '../screens/SocialSplashScreen';
import SocialNavigator from './SocialNavigator';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import PostDetailScreen from '../screens/PostDetailScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import FollowListScreen from '../screens/FollowListScreen';
import MessagesScreen from '../screens/MessagesScreen';
import ChatScreen from '../screens/ChatScreen';
import MessageRequestsScreen from '../screens/MessageRequestsScreen';
import NewChatScreen from '../screens/NewChatScreen';

import { useSocketBootstrap } from '../hooks/useSocket';

import type {
  SocialScreenParamList,
  SocialStackParamList,
} from './types';

type FullSocialStack = SocialStackParamList & SocialScreenParamList;
const Stack = createNativeStackNavigator<FullSocialStack>();

const SocialEntry: React.FC = () => {
  useSocketBootstrap();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SocialSplash" component={SocialSplashScreen} />
      <Stack.Screen name="SocialTabs" component={SocialNavigator} />

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
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
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

      {/* Chat */}
      <Stack.Screen
        name="Messages"
        component={MessagesScreen}
        options={{ animation: 'slide_from_right' }}
      />
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
        options={{ animation: 'slide_from_bottom', presentation: 'modal' }}
      />
    </Stack.Navigator>
  );
};

export default SocialEntry;