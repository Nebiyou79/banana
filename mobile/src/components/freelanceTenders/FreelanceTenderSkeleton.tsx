import React, { memo, useEffect, useRef, useMemo } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

export interface FreelanceTenderSkeletonProps { count?: number }

const ShimmerBox: React.FC<{ width: number | `${number}%`; height: number; borderRadius?: number }> = ({
  width, height, borderRadius = 6,
}) => {
  const { colors: c } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1,   duration: 700, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, easing: Easing.linear, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{
      width: width as number, height, borderRadius,
      backgroundColor: c.skeleton ?? withAlpha(c.textMuted, 0.20),
      opacity,
    }} />
  );
};

const SkeletonCard: React.FC = () => {
  const { colors: c, radius, spacing, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <ShimmerBox width="60%" height={16} />
        <ShimmerBox width={60} height={22} borderRadius={10} />
      </View>
      <View style={[styles.row, styles.mt8]}>
        <ShimmerBox width="40%" height={12} />
        <ShimmerBox width={56} height={12} />
      </View>
      <View style={[styles.row, styles.mt10]}>
        <ShimmerBox width={110} height={26} borderRadius={8} />
      </View>
      <View style={[styles.chipRow, styles.mt10]}>
        <ShimmerBox width={60} height={24} borderRadius={8} />
        <ShimmerBox width={80} height={24} borderRadius={8} />
        <ShimmerBox width={52} height={24} borderRadius={8} />
      </View>
    </View>
  );
};

const FreelanceTenderSkeleton: React.FC<FreelanceTenderSkeletonProps> = memo(({ count = 3 }) => (
  <View style={styles.wrap}>
    {Array.from({ length: count }).map((_, i) => <SkeletonCard key={i} />)}
  </View>
));

FreelanceTenderSkeleton.displayName = 'FreelanceTenderSkeleton';

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg, padding: spacing.lg,
      marginBottom: 12, backgroundColor: c.surface ?? c.bgCard,
      ...shadows.sm,
    },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
    chipRow: { flexDirection: 'row', gap: 6 },
    mt8:  { marginTop: 8 },
    mt10: { marginTop: 10 },
  });

const styles = StyleSheet.create({ wrap: { padding: 16 } });

export default FreelanceTenderSkeleton;