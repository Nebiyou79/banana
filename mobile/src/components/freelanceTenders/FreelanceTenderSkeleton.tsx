// mobile/src/components/freelanceTenders/FreelanceTenderSkeleton.tsx
// Uses plain react-native Animated (no reanimated dependency).

import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

export interface FreelanceTenderSkeletonProps {
  count?: number;
}

const ShimmerBox: React.FC<{
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
}> = ({ width, height, borderRadius = 6 }) => {
  const { theme } = useThemeStore();
  const c = theme.colors;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Animated.View
      style={{
        width: width as number,
        height,
        borderRadius,
        backgroundColor: c.textMuted + '33',
        opacity,
      }}
    />
  );
};

const SkeletonCard: React.FC = () => {
  const { theme } = useThemeStore();
  const c = theme.colors;

  return (
    <View style={[styles.card, { backgroundColor: c.surface ?? c.card }]}>
      {/* Row 1: title + badge */}
      <View style={styles.row}>
        <ShimmerBox width="60%" height={16} />
        <ShimmerBox width={60} height={22} borderRadius={10} />
      </View>
      {/* Row 2: category + deadline */}
      <View style={[styles.row, styles.mt8]}>
        <ShimmerBox width="40%" height={12} />
        <ShimmerBox width={56} height={12} />
      </View>
      {/* Row 3: budget tag */}
      <View style={[styles.row, styles.mt10]}>
        <ShimmerBox width={110} height={26} borderRadius={8} />
      </View>
      {/* Row 4: skill chips */}
      <View style={[styles.chipRow, styles.mt10]}>
        <ShimmerBox width={60} height={24} borderRadius={8} />
        <ShimmerBox width={80} height={24} borderRadius={8} />
        <ShimmerBox width={52} height={24} borderRadius={8} />
      </View>
    </View>
  );
};

const FreelanceTenderSkeleton: React.FC<FreelanceTenderSkeletonProps> = memo(
  ({ count = 3 }) => (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  )
);

FreelanceTenderSkeleton.displayName = 'FreelanceTenderSkeleton';

const styles = StyleSheet.create({
  wrap: { padding: 16 },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 6,
  },
  mt8: { marginTop: 8 },
  mt10: { marginTop: 10 },
});

export default FreelanceTenderSkeleton;
