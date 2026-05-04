/**
 * navigation/PillTabBar.tsx
 * Shared animated pill tab button used by all role navigators.
 * Uses ONLY react-native Animated — zero react-native-reanimated.
 *
 * Two Animated.Value instances per button:
 *   pillAnim  → interpolates pill width + opacity  (useNativeDriver: false)
 *   scaleAnim → interpolates icon scale transform  (useNativeDriver: true)
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
import { Ionicons }          from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PillTabMeta {
  icon:        string;   // Ionicon name — outline variant
  iconActive:  string;   // Ionicon name — filled variant
  label:       string;   // Short uppercase label
  accentDark:  string;   // Hex — dark mode pill colour
  accentLight: string;   // Hex — light mode pill colour
}

export interface PillTabBarRoute {
  key:  string;
  name: string;
}

export interface PillTabBarProps {
  routes:   PillTabBarRoute[];
  activeIndex: number;
  isDark:   boolean;
  meta:     Record<string, PillTabMeta>;
  onPress:  (routeName: string, routeKey: string, focused: boolean) => void;
  badges?:  Record<string, number>;   // routeName → unread count
}

// ═════════════════════════════════════════════════════════════════════════════
//  SINGLE ANIMATED BUTTON
// ═════════════════════════════════════════════════════════════════════════════

const FALLBACK_META: PillTabMeta = {
  icon: 'ellipse-outline', iconActive: 'ellipse',
  label: '?', accentDark: '#94A3B8', accentLight: '#64748B',
};

export const PillTabButton: React.FC<{
  tabMeta: PillTabMeta;
  focused: boolean;
  onPress: () => void;
  isDark:  boolean;
  badge?:  number;
}> = ({ tabMeta, focused, onPress, isDark, badge }) => {
  const accent = isDark ? tabMeta.accentDark : tabMeta.accentLight;

  // pillAnim drives width+opacity — layout props can NOT use native driver
  const pillAnim  = useRef(new Animated.Value(focused ? 1 : 0)).current;
  // scaleAnim drives transform — CAN use native driver
  const scaleAnim = useRef(new Animated.Value(focused ? 1.12 : 1)).current;

  useEffect(() => {
    Animated.timing(pillAnim, {
      toValue:         focused ? 1 : 0,
      duration:        200,
      easing:          Easing.out(Easing.quad),
      useNativeDriver: false,   // ← must be false for width/opacity layout props
    }).start();

    Animated.spring(scaleAnim, {
      toValue:         focused ? 1.12 : 1,
      friction:        6,
      tension:         280,
      useNativeDriver: true,    // ← safe for transform
    }).start();
  }, [focused]);

  const pillWidth   = pillAnim.interpolate({ inputRange: [0, 1], outputRange: [40, 72] });
  const pillOpacity = pillAnim;   // same range 0→1, no extra interpolate needed
  const iconColor   = focused ? (isDark ? '#0F172A' : '#FFFFFF') : (isDark ? '#475569' : '#94A3B8');
  const labelColor  = focused ? accent : (isDark ? '#475569' : '#94A3B8');
  const hasBadge    = badge !== undefined && badge > 0;

  return (
    <Pressable
      onPress={onPress}
      style={pbs.btn}
      accessibilityRole="button"
      accessibilityLabel={tabMeta.label}
      accessibilityState={{ selected: focused }}
    >
      {/* Animated pill — useNativeDriver: false path */}
      <Animated.View
        style={[pbs.pill, { width: pillWidth, opacity: pillOpacity, backgroundColor: accent }]}
      />

      {/* Icon — useNativeDriver: true path */}
      <Animated.View style={[pbs.iconWrap, { transform: [{ scale: scaleAnim }] }]}>
        <Ionicons
          name={(focused ? tabMeta.iconActive : tabMeta.icon) as any}
          size={22}
          color={iconColor}
        />
        {hasBadge && (
          <View style={[pbs.badge, { backgroundColor: accent }]}>
            <Text style={pbs.badgeText}>
              {(badge as number) > 99 ? '99+' : String(badge)}
            </Text>
          </View>
        )}
      </Animated.View>

      <Text style={[pbs.label, { color: labelColor }]} numberOfLines={1}>
        {tabMeta.label}
      </Text>
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  FULL TAB BAR
// ═════════════════════════════════════════════════════════════════════════════

export const PillTabBar: React.FC<PillTabBarProps> = ({
  routes, activeIndex, isDark, meta, onPress, badges = {},
}) => {
  const insets  = useSafeAreaInsets();
  const bgColor = isDark ? '#0F172A' : '#FFFFFF';
  const border  = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

  return (
    <View
      style={[
        pbs.bar,
        {
          backgroundColor: bgColor,
          borderTopColor:  border,
          paddingBottom:   insets.bottom + 4,
        },
      ]}
    >
      {routes.map((route, index) => {
        const focused = index === activeIndex;
        const tabMeta = meta[route.name] ?? FALLBACK_META;
        const badge   = badges[route.name];
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
const pbs = StyleSheet.create({
  bar: {
    flexDirection:  'row',
    borderTopWidth: 0.5,
    paddingTop:     6,
    shadowColor:    '#000',
    shadowOffset:   { width: 0, height: -3 },
    shadowOpacity:  0.06,
    shadowRadius:   10,
    elevation:      10,
  },
  btn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 8, gap: 3,
  },
  pill: {
    position: 'absolute', top: 6,
    height: 36, borderRadius: 18, zIndex: 1,
  },
  iconWrap: { zIndex: 2, position: 'relative' },
  badge: {
    position: 'absolute', top: -5, right: -8,
    minWidth: 16, height: 16, paddingHorizontal: 3,
    borderRadius: 8, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', lineHeight: 12 },
  label: {
    fontSize: 9, fontWeight: '700',
    letterSpacing: 0.3, textTransform: 'uppercase',
  },
});