/**
 * src/navigation/PillTabBar.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Shared pill-shaped tab bar for both Role and Social navigators.
 *
 * FIXES v4:
 *   - Overflow hidden on pill highlight to prevent color bleed
 *   - Proper border radius clipping on the pill background
 *   - Icon-only sizing with constrained pill dimensions
 *   - Touch target maintained at 44px minimum
 *   - Badge positioning fixed to not overflow pill bounds
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { memo, useCallback } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PillTabMeta {
  icon: string;
  iconActive: string;
  label: string;
  accentDark: string;
  accentLight: string;
}

export interface PillTabRoute {
  key: string;
  name: string;
  params?: object;
}

export interface PillTabBarProps {
  routes: PillTabRoute[];
  activeIndex: number;
  isDark: boolean;
  meta: Record<string, PillTabMeta>;
  badges?: Record<string, number>;
  onPress: (name: string, key: string, focused: boolean) => void;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const TAB_HEIGHT = 56;
const PILL_HEIGHT = 38;
const PILL_WIDTH = 38;
const ICON_SIZE = 20;

// ─── Component ───────────────────────────────────────────────────────────────

const PillTabBar: React.FC<PillTabBarProps> = memo(
  ({ routes, activeIndex, isDark, meta, badges, onPress }) => {
    return (
      <View style={styles.container}>
        <View
          style={[
            styles.bar,
            {
              backgroundColor: isDark ? '#1A2133' : '#FFFFFF',
              borderColor: isDark ? '#232D42' : '#E4E8EF',
            },
          ]}
        >
          {routes.map((route, index) => {
            const tabMeta = meta[route.name];
            if (!tabMeta) return null;

            const isActive = index === activeIndex;
            const accent = isDark ? tabMeta.accentDark : tabMeta.accentLight;
            const badge = badges?.[route.name] ?? 0;
            const hasBadge = badge > 0;

            return (
              <Pressable
                key={route.key}
                onPress={() => onPress(route.name, route.key, isActive)}
                style={styles.tabItem}
                accessibilityRole="tab"
                accessibilityLabel={`${tabMeta.label}${hasBadge ? `, ${badge} unread` : ''}`}
                accessibilityState={{ selected: isActive }}
              >
                {/* Active pill background — clipped to prevent bleed */}
                {isActive && (
                  <View
                    style={[
                      styles.activePill,
                      {
                        backgroundColor: accent,
                        // Critical: shadow only on the pill, not the icon
                        shadowColor: accent,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 4,
                        elevation: 3,
                      },
                    ]}
                  />
                )}

                {/* Icon container */}
                <View style={styles.iconWrap}>
                  <Ionicons
                    name={
                      (isActive ? tabMeta.iconActive : tabMeta.icon) as any
                    }
                    size={ICON_SIZE}
                    color={isActive ? '#FFFFFF' : isDark ? '#9AAEC8' : '#64748B'}
                    style={styles.icon}
                  />
                </View>

                {/* Badge */}
                {hasBadge && (
                  <View
                    style={[
                      styles.badge,
                      {
                        backgroundColor: isDark ? '#F87171' : '#EF4444',
                        borderColor: isDark ? '#1A2133' : '#FFFFFF',
                      },
                    ]}
                  >
                    <Text style={styles.badgeText} numberOfLines={1}>
                      {badge > 99 ? '99+' : badge}
                    </Text>
                  </View>
                )}

                {/* Label */}
                <Text
                  style={[
                    styles.label,
                    {
                      color: isActive
                        ? accent
                        : isDark
                        ? '#5A6E8A'
                        : '#9AAAB8',
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {tabMeta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }
);

PillTabBar.displayName = 'PillTabBar';

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 12,
    left: 12,
    right: 12,
    alignItems: 'center',
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    paddingVertical: 8,
    borderRadius: 28,
    borderWidth: 1,
    // Shadow for the bar itself
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 44,
    position: 'relative',
  },
  activePill: {
    position: 'absolute',
    top: 4,
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    borderRadius: PILL_HEIGHT / 2,
    // CRITICAL: overflow hidden to clip any color bleed
    overflow: 'hidden',
  },
  iconWrap: {
    width: PILL_WIDTH,
    height: PILL_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  icon: {
    // Ensure icon stays within bounds
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: '50%',
    marginRight: -(PILL_WIDTH / 2 + 4),
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    zIndex: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.2,
    zIndex: 1,
  },
});

export default PillTabBar;