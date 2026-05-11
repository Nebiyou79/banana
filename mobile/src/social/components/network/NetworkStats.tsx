// src/social/components/shared/NetworkStats.tsx
/**
 * NetworkStats — follower / following / connections tile row
 *
 * Theme migration:
 * - `elevation.xs` does not exist → replaced with Platform.select() shadow inline
 * - `colors.textMuted` → valid on colors object ✅ (no change needed)
 * - `colors.bg` used for loader overlay → theme.colors.bg ✅
 * - All other tokens (colors.card, colors.border, colors.primary, etc.) already
 *   on the colors object ✅
 */
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn, useSlideUp } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
import type { FollowStats } from '../../types';
import { formatCount } from '../../utils/format';
import type { ComponentProps } from 'react';

interface TileProps {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: number;
  onPress?: () => void;
  delay: number;
}

const Tile: React.FC<TileProps> = ({ icon, label, value, onPress, delay }) => {
  const { colors, spacing, radius, type, withAlpha } = useSocialTheme();
  const { translateY, opacity } = useSlideUp(16, delay);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateY }] }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
        disabled={!onPress}
        style={[
          styles.tile,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderRadius: radius.md,
            paddingVertical: spacing.md - 2,
            paddingHorizontal: spacing.sm,
            minHeight: 96,
            // elevation.xs → inline Platform.select
            ...Platform.select({
              ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.08,
                shadowRadius: 3,
              },
              android: { elevation: 2 },
            }),
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: withAlpha(colors.primary, 0.12),
              borderRadius: radius.pill,
              width: 34,
              height: 34,
              marginBottom: spacing.sm,
            },
          ]}
        >
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>
        <Text style={[type.title, { color: colors.text }]}>
          {formatCount(value)}
        </Text>
        <Text style={[type.caption, { color: colors.textMuted, marginTop: 2 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

interface Props {
  stats?: FollowStats;
  loading?: boolean;
  onFollowersPress?: () => void;
  onFollowingPress?: () => void;
  onConnectionsPress?: () => void;
}

const NetworkStats: React.FC<Props> = memo(({
  stats, loading, onFollowersPress, onFollowingPress, onConnectionsPress,
}) => {
  const { colors, spacing } = useSocialTheme();
  const opacity = useFadeIn(0, 200);
  const safe: FollowStats = stats ?? { followers: 0, following: 0, totalConnections: 0 };

  return (
    <Animated.View
      style={[
        styles.row,
        {
          opacity,
          gap: spacing.sm + 2,
          paddingHorizontal: spacing.md,
          paddingTop: spacing.sm + 2,
          paddingBottom: spacing.sm,
        },
      ]}
    >
      <Tile
        icon="people-outline"
        label="Followers"
        value={safe.followers}
        onPress={onFollowersPress}
        delay={0}
      />
      <Tile
        icon="person-add-outline"
        label="Following"
        value={safe.following}
        onPress={onFollowingPress}
        delay={70}
      />
      <Tile
        icon="git-network-outline"
        label="Connections"
        value={safe.totalConnections}
        onPress={onConnectionsPress}
        delay={140}
      />
      {loading ? (
        <View
          style={[styles.loaderOverlay, { backgroundColor: colors.bg + 'CC' }]}
          pointerEvents="none"
        />
      ) : null}
    </Animated.View>
  );
});

NetworkStats.displayName = 'NetworkStats';

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  tile: { alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
  loaderOverlay: { ...StyleSheet.absoluteFillObject },
});

export default NetworkStats;
// ✅ theme-migrated
