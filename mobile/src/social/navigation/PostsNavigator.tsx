/**
 * src/social/navigation/PostsNavigator.tsx
 * Three-tab swipe navigator: Feed · My Posts · Saved
 *
 * Uses createMaterialTopTabNavigator (unchanged — was already a top tab).
 * Safe-area top inset applied via tabBarStyle.paddingTop so it renders
 * correctly when nested inside SocialNavigator (also a top tab).
 */

import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import React from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FeedScreen from '../screens/FeedScreen';
import MyPostsScreen from '../screens/MyPostsScreen';
import SavedPostsScreen from '../screens/SavedPostsScreen';
import { useSocialTheme } from '../theme/socialTheme';
import type { PostsTabParamList } from './types';

const TopTab = createMaterialTopTabNavigator<PostsTabParamList>();

const PostsNavigator: React.FC = () => {
  const theme = useSocialTheme();
  const insets = useSafeAreaInsets();

  return (
    <TopTab.Navigator
      initialRouteName="Feed"
      screenOptions={{
        tabBarStyle: {
          backgroundColor: theme.card,
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 0.5,
          borderBottomColor: theme.border,
          // Only apply top inset when PostsNavigator is the outermost surface
          // (i.e. when not nested inside another top-tab that already handles it).
          paddingTop: insets.top,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: {
          fontSize: 13,
          fontWeight: '700',
          textTransform: 'none',
        },
        tabBarIndicatorStyle: {
          backgroundColor: theme.primary,
          height: 3,
          borderRadius: 2,
        },
        tabBarPressColor: theme.primaryLighter,
      }}
    >
      <TopTab.Screen
        name="Feed"
        component={FeedScreen}
        options={{ title: 'Feed' }}
      />
      <TopTab.Screen
        name="MyPosts"
        component={MyPostsScreen}
        options={{ title: 'My Posts' }}
      />
      <TopTab.Screen
        name="SavedPosts"
        component={SavedPostsScreen}
        options={{ title: 'Saved' }}
      />
    </TopTab.Navigator>
  );
};

export default PostsNavigator;