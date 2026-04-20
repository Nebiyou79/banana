// src/social/navigation/SocialEntry.tsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import CreatePostScreen from '../screens/CreatePostScreen';
import EditPostScreen from '../screens/EditPostScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
// import FollowListScreen from '../screens/FollowListScreen';
// import PostDetailScreen from '../screens/PostDetailScreen';
import PublicProfileScreen from '../screens/PublicProfileScreen';
import SocialSplashScreen from '../screens/SocialSplashScreen';
import SocialNavigator from './SocialNavigator';
import type { SocialStackParamList } from './types';
import PlaceholderScreen from '../../screens/auth/PlaceholderScreen';

const Stack = createNativeStackNavigator<SocialStackParamList>();

const SocialEntry: React.FC = () => (
  <Stack.Navigator
    initialRouteName="SocialSplash"
    screenOptions={{ headerShown: false }}
  >
    <Stack.Screen name="SocialSplash" component={SocialSplashScreen} />
    <Stack.Screen name="SocialTabs" component={SocialNavigator} />
    <Stack.Screen
      name="PublicProfile"
      component={PublicProfileScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="PostDetail"
      component={PlaceholderScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="EditProfile"
      component={EditProfileScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <Stack.Screen
      name="CreatePost"
      component={CreatePostScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <Stack.Screen
      name="EditPost"
      component={EditPostScreen}
      options={{
        animation: 'slide_from_bottom',
        presentation: 'modal',
      }}
    />
    <Stack.Screen
      name="Followers"
      component={PlaceholderScreen}
      options={{ animation: 'slide_from_right' }}
    />
    <Stack.Screen
      name="Following"
      component={PlaceholderScreen}
      options={{ animation: 'slide_from_right' }}
    />
  </Stack.Navigator>
);

export default SocialEntry;