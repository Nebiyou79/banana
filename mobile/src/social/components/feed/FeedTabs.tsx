import React, { memo, useState } from 'react';
import {
  Animated,
  LayoutChangeEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

/**
 * Top tabs for FeedScreen. Slides a coloured indicator bar under the active
 * tab using an Animated.Value. Bar colour follows role primary.
 */
const FeedTabs: React.FC<Props> = memo(({ active, onChange }) => {
  const theme = useSocialTheme();
  const [width, setWidth] = useState(0);
  const activeIndex = Math.max(
    0,
    TABS.findIndex((t) => t.key === active)
  );
  const { indicatorX, tabWidth } = useTabIndicator(
    activeIndex,
    TABS.length,
    width
  );

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: theme.tabBg, borderBottomColor: theme.border },
      ]}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={styles.row}>
        {TABS.map((t) => {
          const isActive = t.key === active;
          return (
            <TouchableOpacity
              key={t.key}
              style={styles.tab}
              onPress={() => onChange(t.key)}
              activeOpacity={0.7}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text
                style={[
                  styles.label,
                  {
                    color: isActive ? theme.primary : theme.subtext,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {width > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            {
              backgroundColor: theme.primary,
              width: tabWidth * 0.4,
              left: tabWidth * 0.3,
              transform: [{ translateX: indicatorX }],
            },
          ]}
        />
      ) : null}
    </View>
  );
});

FeedTabs.displayName = 'FeedTabs';

const styles = StyleSheet.create({
  wrap: { borderBottomWidth: 0.5 },
  row: { flexDirection: 'row' },
  tab: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  label: { fontSize: 13 },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
});

export default FeedTabs;