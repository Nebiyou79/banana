// src/social/navigation/SocialNavigator.tsx
/**
 * BananaLink Social v2.0 — Bottom tabs inside SocialTabs.
 *
 * Phase 5: "Messages" replaces the Home splash tab. Home was purely an exit
 * shortcut back to the role root navigator; the app menu header already has
 * a back/close button, so a Messages tab is a better use of that slot.
 *
 * Tab order: Posts · Network · Messages · Search · Profile
 *
 * Messages tab shows an unread-count badge (sum of unreadCounts across
 * all active conversations) using a lightweight periodic count query.
 */
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import MessagesScreen from '../screens/MessagesScreen';
import NetworkScreen from '../screens/NetworkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import { conversationService } from '../services/conversationService';
import { useSocialTheme } from '../theme/socialTheme';
import PostsNavigator from './PostsNavigator';
import type { SocialTabParamList } from './types';

const Tab = createBottomTabNavigator<SocialTabParamList>();

const ICONS: Record<
  keyof SocialTabParamList,
  {
    active: keyof typeof Ionicons.glyphMap;
    inactive: keyof typeof Ionicons.glyphMap;
  }
> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Posts: { active: 'newspaper', inactive: 'newspaper-outline' },
  Network: { active: 'people', inactive: 'people-outline' },
  Messages: {
    active: 'chatbubble-ellipses',
    inactive: 'chatbubble-ellipses-outline',
  },
  Search: { active: 'search', inactive: 'search-outline' },
  Profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

/**
 * Cheap unread-total for the tab badge.
 * We reuse the inbox list endpoint with limit=50 and sum unreadCount locally,
 * refreshed every 30s or when the app regains focus.
 */
const useTotalUnread = () =>
  useQuery({
    queryKey: ['social', 'conversations', 'totalUnread'] as const,
    queryFn: async () => {
      const res = await conversationService.getMyConversations({
        page: 1,
        limit: 50,
      });
      const list = (res.data?.data as any[]) ?? [];
      return list.reduce(
        (acc: number, c: any) => acc + (c.unreadCount || 0),
        0
      );
    },
    staleTime: 1000 * 30,
    refetchInterval: 1000 * 60, // poll every minute
  });

const SocialNavigator: React.FC = () => {
  const theme = useSocialTheme();
  const totalUnread = useTotalUnread();

  return (
    <Tab.Navigator
      initialRouteName="Posts"
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBg,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
        tabBarIcon: ({ focused, color }) => {
          const icon = ICONS[route.name as keyof SocialTabParamList];
          return (
            <Ionicons
              name={focused ? icon.active : icon.inactive}
              size={22}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen
        name="Posts"
        component={PostsNavigator}
        options={{ tabBarLabel: 'Posts' }}
      />
      <Tab.Screen
        name="Network"
        component={NetworkScreen}
        options={{ tabBarLabel: 'Network' }}
      />
      <Tab.Screen
        name="Messages"
        component={MessagesScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarBadge:
            totalUnread.data && totalUnread.data > 0
              ? totalUnread.data > 99
                ? '99+'
                : totalUnread.data
              : undefined,
          tabBarBadgeStyle: {
            backgroundColor: theme.primary,
            color: '#FFFFFF',
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarLabel: 'Search' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

export default SocialNavigator;