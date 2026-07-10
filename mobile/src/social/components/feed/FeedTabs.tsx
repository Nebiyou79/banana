// src/social/components/feed/FeedTabs.tsx
import React, { memo, useState } from 'react';
import { Animated, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTabIndicator } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

export type FeedSort = 'latest' | 'trending' | 'following';

interface Tab { 
  key: FeedSort; 
  label: string; 
}

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
  const theme = useSocialTheme();
  const { colors, spacing, type, dark } = theme;
  const [width, setWidth] = useState(0);
  
  const activeIndex = Math.max(0, TABS.findIndex((t) => t.key === active));
  const { indicatorX, tabWidth } = useTabIndicator(activeIndex, TABS.length, width);

  // Dark mode: deeper tab background, lighter border
  // Light mode: clean tab background, subtle border
  const bgColor = dark ? colors.tabBg : colors.card;
  const borderColor = dark ? 'rgba(255,255,255,0.08)' : colors.border;

  return (
    <View
      style={[
        styles.wrap,
        { 
          backgroundColor: bgColor,
          borderBottomColor: borderColor,
        }
      ]}
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
                type.bodySm,
                {
                  color: isActive ? colors.primary : colors.textMuted,
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
            shadowColor: colors.primary,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: dark ? 0.4 : 0.2,
            shadowRadius: 4,
            elevation: 3,
          },
        ]} />
      ) : null}
    </View>
  );
});

FeedTabs.displayName = 'FeedTabs';

const styles = StyleSheet.create({
  wrap: { 
    borderBottomWidth: 0.5,
    paddingTop: 4,
  },
  row: { 
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  tab: { 
    flex: 1, 
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  indicator: { 
    position: 'absolute', 
    bottom: 0, 
    height: 3, 
    borderTopLeftRadius: 2, 
    borderTopRightRadius: 2 
  },
});

export default FeedTabs;