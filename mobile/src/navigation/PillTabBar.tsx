/**
 * src/navigation/PillTabBar.tsx
 *
 * FIX — Button overlap / over-padding issue:
 *   The previous version did not export its height, so React Navigation
 *   could not tell screens how much bottom offset to apply. Screens that
 *   used SafeAreaView edges={['bottom']} were double-padded (safe-area inset
 *   PLUS the tab bar height), shoving Cancel/Next buttons way up.
 *
 *   Solution:
 *     1. Export TAB_BAR_HEIGHT constant (inner content height, no insets).
 *     2. Export getTabBarHeight(insets) helper for full height calculation.
 *     3. All bottom-tab navigators that use PillTabBar must declare
 *        tabBarStyle: { height: getTabBarHeight(insets) } in screenOptions
 *        so React Navigation correctly insets child screens.
 *     4. Form screens (Create/Edit tender) drop edges={['bottom']} from
 *        SafeAreaView and instead use useBottomTabBarHeight() when they
 *        need explicit bottom padding, or simply omit bottom-edge insets
 *        because the navigator already provides the correct offset.
 *
 * PILL RENDERING FIX (Android):
 *   Android paints children in JSX declaration order regardless of zIndex
 *   when mixing position:absolute and normal-flow siblings inside a flex
 *   container. Pill is declared FIRST so it sits below Icon and Label in
 *   the paint stack. No zIndex, no overflow:hidden needed.
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
import type { EdgeInsets } from 'react-native-safe-area-context';

// ─── Height constants ─────────────────────────────────────────────────────────

/**
 * The fixed inner height of the tab bar (content only, no bottom safe-area
 * inset). Keep in sync with styles.bar paddingTop + styles.btn paddingVertical
 * + icon size + label line height.
 *   paddingTop 6 + paddingVertical 8*2 + icon 22 + marginTop 2 + label 11 = 57
 */
export const TAB_BAR_INNER_HEIGHT = 57;

/**
 * Returns the total rendered height of PillTabBar for a given device.
 * Pass this to tabBarStyle.height in your navigator so React Navigation
 * correctly offsets screen content below the bar.
 */
export function getTabBarHeight(insets: EdgeInsets): number {
  return TAB_BAR_INNER_HEIGHT + Math.max(insets.bottom, 0) + 4;
}

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
      useNativeDriver: false, // width animation — cannot use native driver
    }).start();

    Animated.spring(scaleAnim, {
      toValue: focused ? 1.12 : 1,
      friction: 6,
      tension: 280,
      useNativeDriver: true, // transform — native driver fine
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
      {/* PILL — declared FIRST: bottom of Android paint stack */}
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

      {/* ICON — on top of pill */}
      <Animated.View style={[styles.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
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

      {/* LABEL — topmost in paint stack */}
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
  const borderColor = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: bgColor,
          borderTopColor: borderColor,
          // Only the device's bottom inset — NOT extra padding.
          // React Navigation already tells screens the full bar height via
          // tabBarStyle.height, so screens don't add their own bottom padding.
          paddingBottom: Math.max(insets.bottom, 0) + 4,
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
    minHeight: 44, // accessibility minimum
  },
  pill: {
    position: 'absolute',
    top: 6,
    height: 36,
    borderRadius: 18,
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