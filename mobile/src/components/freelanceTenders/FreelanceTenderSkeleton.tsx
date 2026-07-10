import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderSkeletonProps {
  count?: number;
}

// ─── Shimmer box ──────────────────────────────────────────────────────────────

const ShimmerBox: React.FC<{
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}> = ({ width, height, borderRadius = 6 }) => {
  const { colors } = useTheme();
  const opacity    = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.85, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        width:           width as number,
        height,
        borderRadius,
        backgroundColor: colors.skeleton ?? withAlpha(colors.textMuted, 0.18),
        opacity,
      }}
    />
  );
};

// ─── Single skeleton card ─────────────────────────────────────────────────────

const SkeletonCard: React.FC = () => {
  const { colors, radius, shadows } = useTheme();
  return (
    <View
      style={[
        skS.card,
        {
          backgroundColor: colors.bgCard,
          borderRadius:    radius.lg,
          borderColor:     colors.border,
          ...shadows.sm,
        },
      ]}
    >
      {/* Row 1: avatar + title */}
      <View style={skS.row}>
        <ShimmerBox width={40} height={40} borderRadius={10} />
        <View style={{ flex: 1, gap: 6 }}>
          <ShimmerBox width="75%" height={14} />
          <ShimmerBox width="45%" height={11} />
        </View>
        <ShimmerBox width={64} height={22} borderRadius={11} />
      </View>

      {/* Row 2: category + deadline */}
      <View style={[skS.row, { marginTop: 12 }]}>
        <ShimmerBox width={90} height={22} borderRadius={6} />
        <ShimmerBox width={60} height={22} borderRadius={6} />
      </View>

      {/* Row 3: budget + save */}
      <View style={[skS.row, { marginTop: 10 }]}>
        <ShimmerBox width={110} height={26} borderRadius={6} />
        <ShimmerBox width={24} height={24} borderRadius={6} />
      </View>

      {/* Row 4: skill chips */}
      <View style={[skS.chipRow, { marginTop: 10 }]}>
        <ShimmerBox width={60}  height={24} borderRadius={12} />
        <ShimmerBox width={80}  height={24} borderRadius={12} />
        <ShimmerBox width={52}  height={24} borderRadius={12} />
        <ShimmerBox width={36}  height={24} borderRadius={12} />
      </View>
    </View>
  );
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const FreelanceTenderSkeleton: React.FC<FreelanceTenderSkeletonProps> = memo(({ count = 3 }) => (
  <View style={skS.wrap}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </View>
));

FreelanceTenderSkeleton.displayName = 'FreelanceTenderSkeleton';

const skS = StyleSheet.create({
  wrap:    { padding: 16 },
  card:    { padding: 16, marginBottom: 12, borderWidth: StyleSheet.hairlineWidth },
  row:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  chipRow: { flexDirection: 'row', gap: 6 },
});

export default FreelanceTenderSkeleton;
