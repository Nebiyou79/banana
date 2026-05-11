// src/components/proposals/ProposalSkeleton.tsx
// Banana Mobile App — Module 6B: Proposals
// Loading skeleton for proposal card and detail views.
// REFACTORED: useTheme() + withAlpha(). Memoized styles. No hardcoded hex.

import React, { memo, useEffect, useRef, useMemo } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

// ─── Shimmer primitive ────────────────────────────────────────────────────────

interface ShimmerBoxProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

const useShimmer = () => {
  const animValue = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(animValue, { toValue: 0, duration: 900, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [animValue]);
  return animValue.interpolate({ inputRange: [0, 1], outputRange: [0.4, 0.9] });
};

const ShimmerBox: React.FC<ShimmerBoxProps & { opacity: Animated.AnimatedInterpolation<string | number> }> = ({
  width = '100%', height = 16, borderRadius = 8, style, opacity,
}) => {
  const { colors: c } = useTheme();
  return (
    <Animated.View style={[{
      width: width as number, height, borderRadius,
      backgroundColor: c.skeleton ?? withAlpha(c.textMuted, 0.20),
      opacity,
    }, style]} />
  );
};

// ─── Card skeleton ────────────────────────────────────────────────────────────

interface ProposalCardSkeletonProps { style?: ViewStyle }

export const ProposalCardSkeleton: React.FC<ProposalCardSkeletonProps> = memo(({ style }) => {
  const { colors: c, radius, spacing, shadows } = useTheme();
  const opacity = useShimmer();
  const styles = useMemo(() => makeCardStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

  return (
    <View style={[styles.card, style]}>
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <ShimmerBox width={42} height={42} borderRadius={12} opacity={opacity} />
          <View style={styles.headerText}>
            <ShimmerBox width="70%" height={14} opacity={opacity} />
            <ShimmerBox width="45%" height={11} opacity={opacity} style={{ marginTop: 6 }} />
          </View>
          <ShimmerBox width={70} height={22} borderRadius={999} opacity={opacity} />
        </View>
        <ShimmerBox width={120} height={22} opacity={opacity} />
        <View style={styles.pillsRow}>
          <ShimmerBox width={80} height={24} borderRadius={999} opacity={opacity} />
          <ShimmerBox width={70} height={24} borderRadius={999} opacity={opacity} />
        </View>
        <ShimmerBox width="100%" height={12} opacity={opacity} />
        <ShimmerBox width="80%"  height={12} opacity={opacity} />
      </View>
    </View>
  );
});

ProposalCardSkeleton.displayName = 'ProposalCardSkeleton';

// ─── Detail skeleton ──────────────────────────────────────────────────────────

interface ProposalDetailSkeletonProps { style?: ViewStyle }

export const ProposalDetailSkeleton: React.FC<ProposalDetailSkeletonProps> = memo(({ style }) => {
  const { colors: c, radius, spacing, shadows } = useTheme();
  const opacity = useShimmer();
  const styles = useMemo(() => makeDetailStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);

  return (
    <View style={[{ padding: spacing.xl, gap: spacing.xl }, style]}>
      {/* Hero */}
      <View style={styles.heroBlock}>
        <View style={styles.heroHeader}>
          <ShimmerBox width={56} height={56} borderRadius={28} opacity={opacity} />
          <View style={styles.heroText}>
            <ShimmerBox width="60%" height={18} opacity={opacity} />
            <ShimmerBox width="40%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
          </View>
        </View>
        <ShimmerBox width={140} height={28} opacity={opacity} style={{ marginTop: 16 }} />
        <View style={styles.pillsRow}>
          <ShimmerBox width={90} height={26} borderRadius={999} opacity={opacity} />
          <ShimmerBox width={80} height={26} borderRadius={999} opacity={opacity} />
        </View>
      </View>

      {/* Cover letter block */}
      <View style={styles.sectionBlock}>
        <ShimmerBox width="35%" height={12} opacity={opacity} style={{ marginBottom: 12 }} />
        <ShimmerBox width="100%" height={12} opacity={opacity} />
        <ShimmerBox width="100%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
        <ShimmerBox width="100%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
        <ShimmerBox width="75%"  height={12} opacity={opacity} style={{ marginTop: 6 }} />
      </View>

      {/* Bid section */}
      <View style={styles.sectionBlock}>
        <ShimmerBox width="25%" height={12} opacity={opacity} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <ShimmerBox width="32%" height={60} borderRadius={12} opacity={opacity} />
          <ShimmerBox width="32%" height={60} borderRadius={12} opacity={opacity} />
          <ShimmerBox width="32%" height={60} borderRadius={12} opacity={opacity} />
        </View>
      </View>
    </View>
  );
});

ProposalDetailSkeleton.displayName = 'ProposalDetailSkeleton';

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeCardStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: c.border,
      backgroundColor: c.bgCard,
      overflow: 'hidden',
      ...shadows.sm,
    },
    body: { padding: 14, gap: 10 },
    headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    headerText: { flex: 1, gap: 6 },
    pillsRow: { flexDirection: 'row', gap: 8 },
  });

const makeDetailStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    heroBlock: {
      borderRadius: radius.lg, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.bgCard,
      padding: spacing.lg, ...shadows.sm,
    },
    heroHeader: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    heroText: { flex: 1, gap: 6 },
    pillsRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
    sectionBlock: {
      borderRadius: radius.lg, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.bgCard,
      padding: spacing.lg, ...shadows.sm,
    },
  });

// Legacy alias
export const ProposalSkeleton = ProposalCardSkeleton;
export default ProposalCardSkeleton;