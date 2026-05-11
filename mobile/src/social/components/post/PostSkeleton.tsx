// src/social/components/post/PostSkeleton.tsx
/**
 * PostSkeleton — shimmer loading placeholder for post cards (core Animated)
 *
 * Theme migration:
 * - theme.skeleton → theme.colors.skeleton (authoritative colors object)
 * - theme.card     → theme.colors.card
 * - theme.border   → theme.colors.border
 * - RADIUS.md, SPACING.* already imported from socialTheme ✅
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { RADIUS, SPACING, useSocialTheme } from '../../theme/socialTheme';

// ── Single shimmer bone ──────────────────────────────────────
interface BoneProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
  pulse: Animated.Value;
  baseColor: string;
}

const Bone: React.FC<BoneProps> = ({
  width = '100%',
  height = 14,
  borderRadius = RADIUS.sm,
  style,
  pulse,
  baseColor,
}) => (
  <Animated.View
    style={[
      {
        width: width as any,
        height,
        borderRadius,
        backgroundColor: baseColor,
        opacity: pulse,
        marginVertical: 4,
      },
      style,
    ]}
  />
);

// ── Single skeleton card ─────────────────────────────────────
const SkeletonCard: React.FC<{
  pulse: Animated.Value;
  baseColor: string;
  cardBg: string;
  borderColor: string;
}> = ({ pulse, baseColor, cardBg, borderColor }) => (
  <View style={[styles.card, { backgroundColor: cardBg, borderColor }]}>
    {/* Header */}
    <View style={styles.header}>
      <Bone
        width={44}
        height={44}
        borderRadius={22}
        style={{ flexShrink: 0, marginVertical: 0 }}
        pulse={pulse}
        baseColor={baseColor}
      />
      <View style={styles.headerLines}>
        <Bone width="50%" height={13} pulse={pulse} baseColor={baseColor} />
        <Bone width="34%" height={11} pulse={pulse} baseColor={baseColor} />
      </View>
    </View>

    {/* Text lines */}
    <View style={styles.textBlock}>
      <Bone width="100%" height={13} pulse={pulse} baseColor={baseColor} />
      <Bone width="88%"  height={13} pulse={pulse} baseColor={baseColor} />
      <Bone width="64%"  height={13} pulse={pulse} baseColor={baseColor} />
    </View>

    {/* Media block */}
    <Bone
      width="100%"
      height={200}
      borderRadius={0}
      style={{ marginVertical: 0 }}
      pulse={pulse}
      baseColor={baseColor}
    />

    {/* Actions row */}
    <View style={styles.actions}>
      <Bone width={68} height={20} borderRadius={10} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} />
      <Bone width={76} height={20} borderRadius={10} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} />
      <Bone width={68} height={20} borderRadius={10} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} />
    </View>
  </View>
);

interface Props {
  count?: number;
}

const PostSkeleton: React.FC<Props> = memo(({ count = 2 }) => {
  const theme = useSocialTheme();
  const pulse = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 750,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          pulse={pulse}
          baseColor={theme.colors.skeleton}
          cardBg={theme.colors.card}
          borderColor={theme.colors.border}
        />
      ))}
    </>
  );
});

PostSkeleton.displayName = 'PostSkeleton';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
  },
  headerLines: { flex: 1 },
  textBlock: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.lg,
    padding: SPACING.md,
  },
});

export default PostSkeleton;
export { PostSkeleton };
// ✅ theme-migrated
