// src/components/bids/BidSkeleton.tsx
// Animated skeleton loading state matching BidCard layout.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';

// ── Shimmer block ─────────────────────────────────────────────────────────────

interface ShimmerProps {
  width: number | `${number}%`;
  height: number;
  borderRadius?: number;
  shimmerBg: string;
}

const Shimmer: React.FC<ShimmerProps> = ({ width, height, borderRadius = 6, shimmerBg }) => (
  <View
    style={{
      width,
      height,
      borderRadius,
      backgroundColor: shimmerBg,
    }}
  />
);

// ── Component ─────────────────────────────────────────────────────────────────

interface Props {
  count?: number;
}

export const BidSkeleton: React.FC<Props> = ({ count = 3 }) => {
  const isDark = useThemeStore((s) => s.theme.isDark);
  const opacity = useRef(new Animated.Value(0.4)).current;

  const palette = {
    card:    isDark ? '#1E293B' : '#FFFFFF',
    border:  isDark ? '#334155' : '#E2E8F0',
    shimmer: isDark ? '#334155' : '#E2E8F0',
  };

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.root}>
      {Array.from({ length: count }).map((_, idx) => (
        <Animated.View
          key={idx}
          style={[
            styles.card,
            { borderColor: palette.border, backgroundColor: palette.card, opacity },
          ]}
        >
          {/* Top row: status pill + sealed indicator */}
          <View style={styles.topRow}>
            <Shimmer width={80} height={22} borderRadius={999} shimmerBg={palette.shimmer} />
            <Shimmer width={60} height={18} borderRadius={999} shimmerBg={palette.shimmer} />
          </View>

          {/* Tender title */}
          <Shimmer width="85%" height={16} shimmerBg={palette.shimmer} />
          <Shimmer width="60%" height={13} shimmerBg={palette.shimmer} />

          {/* Bid number */}
          <Shimmer width={120} height={12} shimmerBg={palette.shimmer} />

          {/* Bottom row: amount + date */}
          <View style={styles.bottomRow}>
            <Shimmer width={110} height={20} borderRadius={8} shimmerBg={palette.shimmer} />
            <Shimmer width={80} height={12} shimmerBg={palette.shimmer} />
          </View>
        </Animated.View>
      ))}
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { gap: 10 },

  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148,163,184,0.2)',
    marginTop: 2,
  },
});

export default BidSkeleton;
