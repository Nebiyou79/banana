// src/social/components/search/TrendingHashtags.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { useSocialTheme } from '../../theme/socialTheme';
import { formatCount } from '../../utils/format';

export interface TrendingHashtag {
  name: string;
  postsCount?: number;
  trending?: boolean;
}

interface Props {
  hashtags: TrendingHashtag[];
  onPress: (name: string) => void;
}

/**
 * Two-column grid of trending hashtag pills with post counts.
 * Hashtags marked `trending: true` get a flame icon and primary tint.
 */
const TrendingHashtags: React.FC<Props> = memo(({ hashtags, onPress }) => {
  const theme = useSocialTheme();
  if (!hashtags?.length) return null;

  return (
    <View style={styles.grid}>
      {hashtags.map((h) => (
        <TouchableOpacity
          key={h.name}
          onPress={() => onPress(h.name)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`See posts tagged #${h.name}`}
          style={[
            styles.pill,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.topRow}>
            {h.trending ? (
              <Ionicons name="flame" size={14} color={theme.primary} />
            ) : (
              <Ionicons name="pricetag-outline" size={14} color={theme.muted} />
            )}
            <Text
              style={[styles.tag, { color: theme.text }]}
              numberOfLines={1}
            >
              #{h.name}
            </Text>
          </View>
          {h.postsCount !== undefined ? (
            <Text style={[styles.count, { color: theme.muted }]}>
              {formatCount(h.postsCount)} posts
            </Text>
          ) : null}
        </TouchableOpacity>
      ))}
    </View>
  );
});

TrendingHashtags.displayName = 'TrendingHashtags';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pill: {
    minWidth: '47%',
    flexGrow: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  tag: { fontSize: 14, fontWeight: '700', flexShrink: 1 },
  count: { fontSize: 11 },
});

export default TrendingHashtags;