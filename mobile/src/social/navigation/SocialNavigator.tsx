// src/social/navigation/SocialNavigator.tsx
/**
 * BananaLink Social v2.0 — Bottom tabs.
 * Uses shared PillTabBar — zero react-native-reanimated.
 *
 * Tab order: Posts · Network · Messages · Search · Profile
 */

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery }                 from '@tanstack/react-query';

import MessagesScreen               from '../screens/MessagesScreen';
import NetworkScreen                from '../screens/NetworkScreen';
import ProfileScreen                from '../screens/ProfileScreen';
import SearchScreen                 from '../screens/SearchScreen';
import { conversationService }      from '../services/conversationService';
import { useSocialTheme }           from '../theme/socialTheme';
import { PillTabBar, PillTabMeta }  from '../../navigation/PillTabBar';
import PostsNavigator               from './PostsNavigator';
import type { SocialTabParamList }  from './types';

const Tab = createBottomTabNavigator<SocialTabParamList>();

// ─── Unread count ─────────────────────────────────────────────────────────────
const useTotalUnread = () =>
  useQuery({
    queryKey: ['social', 'conversations', 'totalUnread'] as const,
    queryFn: async () => {
      const res  = await conversationService.getMyConversations({ page: 1, limit: 50 });
      const list = (res.data?.data as any[]) ?? [];
      return list.reduce((acc: number, c: any) => acc + (c.unreadCount || 0), 0);
    },
    staleTime:       1000 * 30,
    refetchInterval: 1000 * 60,
  });

// ─── Tab metadata ─────────────────────────────────────────────────────────────
const SOCIAL_META: Record<string, PillTabMeta> = {
  Posts: {
    icon: 'newspaper-outline', iconActive: 'newspaper', label: 'Posts',
    accentDark: '#34D399', accentLight: '#059669',
  },
  Network: {
    icon: 'people-outline', iconActive: 'people', label: 'Network',
    accentDark: '#F1BB03', accentLight: '#B45309',
  },
  Messages: {
    icon: 'chatbubble-ellipses-outline', iconActive: 'chatbubble-ellipses', label: 'Messages',
    accentDark: '#D8B4FE', accentLight: '#7C3AED',
  },
  Search: {
    icon: 'search-outline', iconActive: 'search', label: 'Search',
    accentDark: '#FDBA74', accentLight: '#EA580C',
  },
  Profile: {
    icon: 'person-circle-outline', iconActive: 'person-circle', label: 'Profile',
    accentDark: '#94A3B8', accentLight: '#64748B',
  },
};

// ─── Navigator ────────────────────────────────────────────────────────────────
const SocialNavigator: React.FC = () => {
  const theme                = useSocialTheme();
  const { data: unread = 0 } = useTotalUnread();
  const isDark               = theme.dark;

  const badges = {
    Messages: unread,
  };

  return (
    <Tab.Navigator
      initialRouteName="Posts"
      tabBar={({ state, navigation }) => (
        <PillTabBar
          routes={state.routes}
          activeIndex={state.index}
          isDark={isDark}
          meta={SOCIAL_META}
          badges={badges}
          onPress={(name, key, focused) => {
            const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(name);
          }}
        />
      )}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Posts"    component={PostsNavigator} />
      <Tab.Screen name="Network"  component={NetworkScreen}  />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Search"   component={SearchScreen}   />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
};

export default SocialNavigator;