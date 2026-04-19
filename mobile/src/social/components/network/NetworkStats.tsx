import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
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
  const theme = useSocialTheme();
  const { translateY, opacity } = useSlideUp(16, delay);
  return (
    <Animated.View
      style={{
        flex: 1,
        opacity,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={onPress ? 0.75 : 1}
        disabled={!onPress}
        style={[
          styles.tile,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <View
          style={[
            styles.iconWrap,
            { backgroundColor: `${theme.primary}1F` },
          ]}
        >
          <Ionicons name={icon} size={18} color={theme.primary} />
        </View>
        <Text style={[styles.value, { color: theme.text }]}>
          {formatCount(value)}
        </Text>
        <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
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

/**
 * Three-tile strip of network stats. Each tile slides up in sequence on mount.
 */
const NetworkStats: React.FC<Props> = memo(
  ({
    stats,
    loading,
    onFollowersPress,
    onFollowingPress,
    onConnectionsPress,
  }) => {
    const theme = useSocialTheme();
    const opacity = useFadeIn(0, 200);
    const safe: FollowStats = stats ?? {
      followers: 0,
      following: 0,
      totalConnections: 0,
    };

    return (
      <Animated.View style={[styles.row, { opacity }]}>
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
            style={[
              styles.loaderOverlay,
              { backgroundColor: `${theme.bg}CC` },
            ]}
            pointerEvents="none"
          />
        ) : null}
      </Animated.View>
    );
  }
);

NetworkStats.displayName = 'NetworkStats';

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  tile: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    minHeight: 96,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 11, marginTop: 2 },
  loaderOverlay: { ...StyleSheet.absoluteFillObject },
});

export default NetworkStats;