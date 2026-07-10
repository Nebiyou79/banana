/**
 * mobile/src/social/components/publicProfile/PublicProfileTabs.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Scrollable tab bar + tab content factory for all four roles.
 *
 * Tab config (mirrors the markdown guide exactly):
 *   candidate    → Info & Social | Education & Experience | Certificates | Posts | Network | Social Data
 *   freelancer   → Info & Social | Portfolio | Services & Certificates | Posts | Network | Social Data
 *   company      → Info & Social | Products | Posts | Network | Social Data
 *   organization → Info & Social | Posts | Network | Social Data
 *
 * This component is purely presentational — it receives resolved data as props.
 * All fetching lives in the screen that owns this component.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Ionicons } from '@expo/vector-icons';
import React, { memo, useCallback, useRef, useState } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';
import type { UserRole } from '../../types';

// ── Tab definitions ───────────────────────────────────────────────────────────

export type PublicTabKey =
  | 'info'
  | 'edu'
  | 'certs'
  | 'posts'
  | 'network'
  | 'social-data'
  | 'portfolio'
  | 'services'
  | 'products';

interface TabDef {
  key:   PublicTabKey;
  label: string;
  icon:  string;
}

export const TABS_BY_ROLE: Record<UserRole, TabDef[]> = {
  candidate: [
    { key: 'info',        label: 'Info',       icon: 'person-outline' },
    { key: 'edu',         label: 'Experience', icon: 'briefcase-outline' },
    { key: 'certs',       label: 'Certs',      icon: 'ribbon-outline' },
    { key: 'posts',       label: 'Posts',      icon: 'newspaper-outline' },
    { key: 'network',     label: 'Network',    icon: 'people-outline' },
    { key: 'social-data', label: 'Analytics',  icon: 'bar-chart-outline' },
  ],
  freelancer: [
    { key: 'info',        label: 'Info',      icon: 'person-outline' },
    { key: 'portfolio',   label: 'Portfolio', icon: 'albums-outline' },
    { key: 'services',    label: 'Services',  icon: 'construct-outline' },
    { key: 'posts',       label: 'Posts',     icon: 'newspaper-outline' },
    { key: 'network',     label: 'Network',   icon: 'people-outline' },
    { key: 'social-data', label: 'Analytics', icon: 'bar-chart-outline' },
  ],
  company: [
    { key: 'info',        label: 'Info',     icon: 'business-outline' },
    { key: 'products',    label: 'Products', icon: 'cube-outline' },
    { key: 'posts',       label: 'Posts',    icon: 'newspaper-outline' },
    { key: 'network',     label: 'Network',  icon: 'people-outline' },
    { key: 'social-data', label: 'Analytics',icon: 'bar-chart-outline' },
  ],
  organization: [
    { key: 'info',        label: 'Info',     icon: 'ribbon-outline' },
    { key: 'posts',       label: 'Posts',    icon: 'newspaper-outline' },
    { key: 'network',     label: 'Network',  icon: 'people-outline' },
    { key: 'social-data', label: 'Analytics',icon: 'bar-chart-outline' },
  ],
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface PublicProfileTabsProps {
  role:       UserRole;
  activeTab:  PublicTabKey;
  onTabPress: (tab: PublicTabKey) => void;
}

// ── Tab Bar (standalone — used by screens to place the tab row) ───────────────

const PublicProfileTabBar: React.FC<PublicProfileTabsProps> = memo(({
  role,
  activeTab,
  onTabPress,
}) => {
  const theme = useSocialTheme();
  const tabs  = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.candidate;

  // Animated spring indicator
  const indicatorX  = useRef(new Animated.Value(0)).current;

  const handlePress = useCallback((tab: PublicTabKey) => {
    const idx = tabs.findIndex((t) => t.key === tab);
    Animated.spring(indicatorX, {
      toValue:  idx * TAB_MIN_W,
      friction: 7,
      tension:  200,
      useNativeDriver: true,
    }).start();
    onTabPress(tab);
  }, [tabs, indicatorX, onTabPress]);

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: theme.border, backgroundColor: theme.bg },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        bounces={false}
      >
        {tabs.map((t) => {
          const active = activeTab === t.key;
          return (
            <TouchableOpacity
              key={t.key}
              onPress={() => handlePress(t.key)}
              activeOpacity={0.75}
              style={[
                styles.tab,
                { borderBottomColor: active ? theme.colors.primary : 'transparent' },
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
            >
              <Ionicons
                name={t.icon as any}
                size={14}
                color={active ? theme.colors.primary : theme.muted}
                style={{ marginBottom: 2 }}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:      active ? theme.colors.primary : theme.muted,
                    fontWeight: active ? '700' : '500',
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
});

PublicProfileTabBar.displayName = 'PublicProfileTabBar';

// ── usePublicTabs hook — tab state + initial tab for a role ───────────────────

/** Returns tab state + helpers, initialising to the first tab for the given role. */
export const usePublicTabs = (role: UserRole) => {
  const tabs = TABS_BY_ROLE[role] ?? TABS_BY_ROLE.candidate;
  const [activeTab, setActiveTab] = useState<PublicTabKey>(tabs[0]?.key ?? 'info');

  const handleTabPress = useCallback((tab: PublicTabKey) => {
    setActiveTab(tab);
  }, []);

  return { activeTab, handleTabPress, tabs };
};

// ── Styles ────────────────────────────────────────────────────────────────────

const TAB_MIN_W = 72;

const styles = StyleSheet.create({
  container: {
    marginTop:    16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: { paddingHorizontal: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingTop:        10,
    paddingBottom:     10,
    borderBottomWidth: 2.5,
    alignItems:        'center',
    minWidth:          TAB_MIN_W,
    minHeight:         48,
    justifyContent:    'center',
  },
  tabText: { fontSize: 12 },
});

export { PublicProfileTabBar };
export default PublicProfileTabBar;