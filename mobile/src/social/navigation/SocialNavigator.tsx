/**
 * src/social/navigation/SocialNavigator.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * BananaLink Social v4 — Bottom tab navigator with custom SimpleTabBar
 *
 * Tab order: Posts · Network · Messages · Search · Profile · Back
 *
 * Uses a clean custom tab bar (like TendersNavigator) that:
 *   - Has no overflow/bleed issues
 *   - Shows proper active/inactive states
 *   - Supports unread badges on Messages
 *   - Has the Back tab at the end
 *   - Navigates to parent on Back press
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useMemo } from 'react';
import { View, Pressable, Text, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import MessagesScreen from '../screens/MessagesScreen';
import NetworkScreen from '../screens/NetworkScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import PostsNavigator from './PostsNavigator';
import { conversationService } from '../services/conversationService';
import { useThemeStore } from '../../store/themeStore';
import { useSocialTheme } from '../theme/socialTheme';
import type { SocialTabParamList } from './types';

const Tab = createBottomTabNavigator<SocialTabParamList>();

// ─── Tab configuration ───────────────────────────────────────────────────────

interface TabConfig {
  icon: string;
  iconActive: string;
  label: string;
  accentDark: string;
  accentLight: string;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  Back: {
    icon: 'exit-outline',
    iconActive: 'exit',
    label: 'Back',
    accentDark: '#64748B',
    accentLight: '#475569',
  },
  Posts: {
    icon: 'newspaper-outline',
    iconActive: 'newspaper',
    label: 'Posts',
    accentDark: '#34D399',
    accentLight: '#059669',
  },
  Network: {
    icon: 'people-outline',
    iconActive: 'people',
    label: 'Network',
    accentDark: '#F1BB03',
    accentLight: '#B45309',
  },
  Messages: {
    icon: 'chatbubble-ellipses-outline',
    iconActive: 'chatbubble-ellipses',
    label: 'Messages',
    accentDark: '#D8B4FE',
    accentLight: '#7C3AED',
  },
  Search: {
    icon: 'search-outline',
    iconActive: 'search',
    label: 'Search',
    accentDark: '#FDBA74',
    accentLight: '#EA580C',
  },
  Profile: {
    icon: 'person-circle-outline',
    iconActive: 'person-circle',
    label: 'Profile',
    accentDark: '#94A3B8',
    accentLight: '#64748B',
  },
};

// ─── Unread count query ──────────────────────────────────────────────────────

const useTotalUnread = () =>
  useQuery({
    queryKey: ['social', 'conversations', 'totalUnread'] as const,
    queryFn: async () => {
      const res = await conversationService.getMyConversations({ page: 1, limit: 50 });
      const list = (res.data?.data as any[]) ?? [];
      const requestsCount = (res.data as any)?.requestsCount ?? 0;
      const unreadMsgs = list.reduce((acc: number, c: any) => acc + (c.unreadCount ?? 0), 0);
      return unreadMsgs + requestsCount;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

// ─── Custom Tab Bar ──────────────────────────────────────────────────────────

function SocialTabBar({ state, navigation }: any) {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const insets = useSafeAreaInsets();
  const { data: unread = 0 } = useTotalUnread();

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          paddingBottom: insets.bottom + 4
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const focused = state.index === index;
        const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.Posts;
        const accent = isDark ? config.accentDark : config.accentLight;
        const isBack = route.name === 'Back';
        const isMessages = route.name === 'Messages';
        const showBadge = isMessages && unread > 0;

        return (
          <Pressable
            key={route.key}
            onPress={() => {
              if (isBack) {
                navigation.getParent()?.goBack();
                return;
              }
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={({ pressed }) => [
              styles.tabItem,
              {
                opacity: pressed ? 0.7 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={`${config.label}${showBadge ? `, ${unread} unread` : ''}`}
          >
            {/* Icon with optional badge */}
            <View style={styles.iconContainer}>
              <Ionicons
                name={(focused ? config.iconActive : config.icon) as any}
                size={22}
                color={focused ? accent : isDark ? '#64748B' : '#94A3B8'}
              />

              {/* Unread badge */}
              {showBadge && (
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: isDark ? '#F87171' : '#EF4444',
                      borderColor: isDark ? '#0F172A' : '#FFFFFF',
                    },
                  ]}
                >
                  <Text style={styles.badgeText} numberOfLines={1}>
                    {unread > 99 ? '99+' : unread}
                  </Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                {
                  color: focused ? accent : isDark ? '#64748B' : '#94A3B8',
                  fontWeight: focused ? '700' : '500',
                },
              ]}
              numberOfLines={1}
            >
              {config.label}
            </Text>

            {/* Active indicator dot */}
            {focused && (
              <View
                style={[
                  styles.activeDot,
                  { backgroundColor: accent },
                ]}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Back placeholder — never rendered, just handles tab press ───────────────

function BackPlaceholder() {
  return null;
}

// ─── Navigator ────────────────────────────────────────────────────────────────

const SocialNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      initialRouteName="Posts"
      tabBar={(props) => <SocialTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Posts"    component={PostsNavigator} />
      <Tab.Screen name="Network"  component={NetworkScreen}  />
      <Tab.Screen name="Messages" component={MessagesScreen} />
      <Tab.Screen name="Search"   component={SearchScreen}   />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
      <Tab.Screen name="Back"     component={BackPlaceholder} />
    </Tab.Navigator>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    gap: 4,
    minHeight: 48,
  },
  iconContainer: {
    position: 'relative',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
  },
  activeDot: {
    position: 'absolute',
    top: 0,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
});

export default SocialNavigator;