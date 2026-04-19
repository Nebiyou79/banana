import React, { memo } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSkeletonPulse } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';

interface BoneProps {
  w?: number | string;
  h?: number;
  r?: number;
  pulse: Animated.Value;
  color: string;
  style?: any;
}

const Bone: React.FC<BoneProps> = ({ w = '100%', h = 14, r = 6, pulse, color, style }) => (
  <Animated.View
    style={[
      {
        width: w as any,
        height: h,
        borderRadius: r,
        backgroundColor: color,
        opacity: pulse,
        marginVertical: 4,
      },
      style,
    ]}
  />
);

/**
 * Loading placeholder that mimics a post card shape. Used while the feed
 * is loading its first page.
 */
const PostSkeleton: React.FC = memo(() => {
  const theme = useSocialTheme();
  const pulse = useSkeletonPulse();

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card, borderTopColor: theme.border },
      ]}
    >
      <View style={styles.header}>
        <Animated.View
          style={[
            styles.avatar,
            { backgroundColor: theme.skeleton, opacity: pulse },
          ]}
        />
        <View style={{ flex: 1, marginLeft: 10 }}>
          <Bone w="50%" h={13} color={theme.skeleton} pulse={pulse} />
          <Bone w="35%" h={11} color={theme.skeleton} pulse={pulse} />
        </View>
      </View>
      <View style={{ paddingHorizontal: 14 }}>
        <Bone h={13} color={theme.skeleton} pulse={pulse} />
        <Bone w="85%" h={13} color={theme.skeleton} pulse={pulse} />
        <Bone w="60%" h={13} color={theme.skeleton} pulse={pulse} />
      </View>
      <Animated.View
        style={[
          styles.mediaPlaceholder,
          { backgroundColor: theme.skeleton, opacity: pulse },
        ]}
      />
      <View style={styles.actionsRow}>
        <Bone w={60} h={18} color={theme.skeleton} pulse={pulse} />
        <Bone w={80} h={18} color={theme.skeleton} pulse={pulse} />
        <Bone w={60} h={18} color={theme.skeleton} pulse={pulse} />
      </View>
    </View>
  );
});

PostSkeleton.displayName = 'PostSkeleton';

const styles = StyleSheet.create({
  card: { borderTopWidth: 0.5, marginBottom: 8, paddingVertical: 12 },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22 },
  mediaPlaceholder: { height: 200, marginTop: 10 },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingHorizontal: 14,
    paddingTop: 14,
  },
});

export default PostSkeleton;