/**
 * src/navigation/PillTabBar.tsx
 *
 * PILL RENDERING FIX (Android):
 *   Android paints children in JSX declaration order regardless of zIndex
 *   when mixing position:absolute and normal-flow siblings inside a flex
 *   container. First declared = bottom of paint stack. Last = top.
 *
 *   Solution: declare Pill FIRST, Icon second, Label last.
 *   Pill is position:absolute so it does not affect flex layout.
 *   Icon and Label render in normal flow ON TOP of the pill visually.
 *   No zIndex, no overflow:hidden, no gap required.
 *
 * Animation split:
 *   pillAnim  (width/opacity) → useNativeDriver: false
 *   scaleAnim (transform)     → useNativeDriver: true
 */

import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface PillTabMeta {
  icon: string;
  iconActive: string;
  label: string;
  accentDark: string;
  accentLight: string;
}

export interface PillTabBarRoute {
  key: string;
  name: string;
}

export interface PillTabBarProps {
  routes: PillTabBarRoute[];
  activeIndex: number;
  isDark: boolean;
  meta: Record<string, PillTabMeta>;
  onPress: (routeName: string, routeKey: string, focused: boolean) => void;
  badges?: Record<string, number>;
}

const FALLBACK_META: PillTabMeta = {
  icon: 'ellipse-outline',
  iconActive: 'ellipse',
  label: '?',
  accentDark: '#94A3B8',
  accentLight: '#64748B',
};

// ═════════════════════════════════════════════════════════════════════════════
//  Single animated pill button
// ═════════════════════════════════════════════════════════════════════════════

interface PillTabButtonProps {
  tabMeta: PillTabMeta;
  focused: boolean;
  isDark: boolean;
  onPress: () => void;
  badge?: number;
}

export const PillTabButton: React.FC<PillTabButtonProps> = ({
  tabMeta,
  focused,
  isDark,
  onPress,
  badge,
}) => {
  const accent = isDark ? tabMeta.accentDark : tabMeta.accentLight;

  const pillAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(focused ? 1.12 : 1)).current;

  useEffect(() => {
    Animated.timing(pillAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();

    Animated.spring(scaleAnim, {
      toValue: focused ? 1.12 : 1,
      friction: 6,
      tension: 280,
      useNativeDriver: true,
    }).start();
  }, [focused, pillAnim, scaleAnim]);

  const pillWidth = pillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 72],
  });

  const iconColor = focused
    ? isDark ? '#0F172A' : '#FFFFFF'
    : isDark ? '#475569' : '#94A3B8';

  const labelColor = focused
    ? accent
    : isDark ? '#475569' : '#94A3B8';

  const hasBadge = badge !== undefined && badge > 0;

  return (
    <Pressable
      onPress={onPress}
      style={styles.btn}
      accessibilityRole="button"
      accessibilityLabel={tabMeta.label}
      accessibilityState={{ selected: focused }}
    >
      {/* PILL — declared FIRST: painted at bottom of Android layer stack */}
      <Animated.View
        style={[
          styles.pill,
          {
            width: pillWidth,
            opacity: pillAnim,
            backgroundColor: accent,
          },
        ]}
      />

      {/* ICON — declared second: painted on top of pill */}
      <Animated.View
        style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons
          name={(focused ? tabMeta.iconActive : tabMeta.icon) as any}
          size={22}
          color={iconColor}
        />
        {hasBadge && (
          <View style={[styles.badge, { backgroundColor: accent }]}>
            <Text style={styles.badgeText}>
              {(badge as number) > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        )}
      </Animated.View>

      {/* LABEL — declared last: painted on top of everything */}
      <Text style={[styles.label, { color: labelColor }]} numberOfLines={1}>
        {tabMeta.label}
      </Text>
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  Full tab bar row
// ═════════════════════════════════════════════════════════════════════════════

export const PillTabBar: React.FC<PillTabBarProps> = ({
  routes,
  activeIndex,
  isDark,
  meta,
  onPress,
  badges = {},
}) => {
  const insets = useSafeAreaInsets();
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const borderColor = isDark
    ? 'rgba(255,255,255,0.07)'
    : 'rgba(0,0,0,0.07)';

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          paddingBottom: insets.bottom + 4,
        },
      ]}
    >
      {routes.map((route, index) => {
        const focused = index === activeIndex;
        const tabMeta = meta[route.name] ?? FALLBACK_META;
        const badge = badges[route.name];
        return (
          <PillTabButton
            key={route.key}
            tabMeta={tabMeta}
            focused={focused}
            isDark={isDark}
            badge={badge}
            onPress={() => onPress(route.name, route.key, focused)}
          />
        );
      })}
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    borderTopWidth: 0.5,
    paddingTop: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 10,
  },
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    // No gap — use marginTop on label instead (gap + absolute = Android bug)
    // No overflow:hidden — clips pill on Android
  },
  pill: {
    position: 'absolute',
    top: 6,
    height: 36,
    borderRadius: 18,
    // No zIndex — declaration order handles layering
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    lineHeight: 12,
  },
  label: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});