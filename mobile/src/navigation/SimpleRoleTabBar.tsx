// src/navigation/SimpleRoleTabBar.tsx
import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeStore } from '../store/themeStore';
import type { PillTabMeta } from './PillTabBar';

interface TabConfig {
  icon: string;
  iconActive: string;
  label: string;
  accentDark: string;
  accentLight: string;
}

interface SimpleRoleTabBarProps {
  routes: any[];
  activeIndex: number;
  meta: Record<string, PillTabMeta>;
  onPress: (name: string, key: string, focused: boolean) => void;
  badges?: Record<string, number>;
}

function convertMetaToConfig(meta: Record<string, PillTabMeta>): Record<string, TabConfig> {
  const config: Record<string, TabConfig> = {};
  for (const [key, value] of Object.entries(meta)) {
    config[key] = {
      icon: value.icon,
      iconActive: value.iconActive,
      label: value.label,
      accentDark: value.accentDark,
      accentLight: value.accentLight,
    };
  }
  return config;
}

export const SimpleRoleTabBar: React.FC<SimpleRoleTabBarProps> = ({
  routes,
  activeIndex,
  meta,
  onPress,
  badges = {},
}) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const insets = useSafeAreaInsets();
  const tabConfig = convertMetaToConfig(meta);

  return (
    <View
      style={[
        styles.tabBar,
        {
          backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {routes.map((route: any, index: number) => {
        const focused = index === activeIndex;
        const config = tabConfig[route.name];
        if (!config) return null;
        
        const accent = isDark ? config.accentDark : config.accentLight;
        const badge = badges[route.name];

        return (
          <Pressable
            key={route.key}
            onPress={() => onPress(route.name, route.key, focused)}
            style={({ pressed }) => [
              styles.tabItem,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={config.label}
          >
            <View style={styles.iconContainer}>
              <Ionicons
                name={(focused ? config.iconActive : config.icon) as any}
                size={22}
                color={focused ? accent : isDark ? '#64748B' : '#94A3B8'}
              />
              {badge && badge > 0 && (
                <View style={[styles.badge, { backgroundColor: accent }]}>
                  <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
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
            {focused && <View style={[styles.activeDot, { backgroundColor: accent }]} />}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
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