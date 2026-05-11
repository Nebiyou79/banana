import React, { memo, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTabIndicator } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

export type FeedSort = 'latest' | 'trending' | 'following';

interface Tab { key: FeedSort; label: string; }
const TABS: Tab[] = [
  { key: 'latest', label: 'Latest' },
  { key: 'trending', label: 'Trending' },
  { key: 'following', label: 'Following' },
];

interface Props {
  active: FeedSort;
  onChange: (key: FeedSort) => void;
}

const FeedTabs: React.FC<Props> = memo(({ active, onChange }) => {
  const { colors, spacing, type } = useSocialTheme();
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active));
  const { indicatorX, tabWidth } = useTabIndicator(activeIndex, TABS.length, width);

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.tabBg, borderBottomColor: colors.border }]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.row}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <TouchableOpacity
              key={t.key}
              style={[styles.tab, { minHeight: 44, paddingVertical: spacing.sm + 2 }]}
              onPress={() => onChange(t.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                type.bodySm, // theme.type.labelSm → theme.type.bodySm (already on the theme.type destructure)
                {
                  color: isActive ? colors.primary : colors.textMuted, // theme.colors.textSecondary → theme.colors.textMuted
                  fontWeight: isActive ? '700' : '500',
                },
              ]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {width > 0 ? (
        <Animated.View style={[
          styles.indicator,
          {
            backgroundColor: colors.primary,
            width: tabWidth * 0.4,
            left: tabWidth * 0.3,
            transform: [{ translateX: indicatorX }],
          },
        ]} />
      ) : null}
    </View>
  );
});

FeedTabs.displayName = 'FeedTabs';

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 0.5 },
  row: { flexDirection: 'row' },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  indicator: { position: 'absolute', bottom: 0, height: 3, borderTopLeftRadius: 2, borderTopRightRadius: 2 },
});

export default FeedTabs;
// ✅ theme-migrated
