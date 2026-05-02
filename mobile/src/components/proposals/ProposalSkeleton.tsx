// src/components/proposals/ProposalSkeleton.tsx
// Banana Mobile App — Module 6B: Proposals
// Loading skeleton for proposal card and detail views.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useThemeStore } from '../../store/themeStore';

interface SkeletonBoxProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
  opacity: Animated.AnimatedInterpolation<string | number>;
}

const SkeletonBox: React.FC<SkeletonBoxProps> = ({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
  opacity,
}) => {
  const { theme } = useThemeStore();

  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: theme.colors.skeleton,
          opacity,
        },
        style,
      ]}
    />
  );
};

interface ProposalCardSkeletonProps {
  style?: ViewStyle;
}

export const ProposalCardSkeleton: React.FC<ProposalCardSkeletonProps> = ({
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [animValue]);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        style,
      ]}
    >
      <View style={styles.body}>
        {/* Header */}
        <View style={styles.headerRow}>
          <SkeletonBox width={42} height={42} borderRadius={12} opacity={opacity} />
          <View style={styles.headerText}>
            <SkeletonBox width="70%" height={14} opacity={opacity} />
            <SkeletonBox width="45%" height={11} opacity={opacity} style={{ marginTop: 6 }} />
          </View>
          <SkeletonBox width={70} height={22} borderRadius={999} opacity={opacity} />
        </View>

        {/* Amount */}
        <SkeletonBox width={120} height={22} opacity={opacity} />

        {/* Pills */}
        <View style={styles.pillsRow}>
          <SkeletonBox width={80} height={24} borderRadius={999} opacity={opacity} />
          <SkeletonBox width={70} height={24} borderRadius={999} opacity={opacity} />
        </View>

        {/* Text lines */}
        <SkeletonBox width="100%" height={12} opacity={opacity} />
        <SkeletonBox width="80%" height={12} opacity={opacity} />
      </View>
    </View>
  );
};

interface ProposalDetailSkeletonProps {
  style?: ViewStyle;
}

export const ProposalDetailSkeleton: React.FC<ProposalDetailSkeletonProps> = ({
  style,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  const animValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [animValue]);

  const opacity = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.9],
  });

  return (
    <View style={[{ padding: 20, gap: 20 }, style]}>
      {/* Header hero */}
      <View
        style={[
          styles.heroBlock,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.heroHeader}>
          <SkeletonBox width={56} height={56} borderRadius={28} opacity={opacity} />
          <View style={styles.heroText}>
            <SkeletonBox width="60%" height={18} opacity={opacity} />
            <SkeletonBox width="40%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
          </View>
        </View>
        <SkeletonBox width={140} height={28} opacity={opacity} style={{ marginTop: 16 }} />
        <View style={styles.pillsRow}>
          <SkeletonBox width={90} height={26} borderRadius={999} opacity={opacity} />
          <SkeletonBox width={80} height={26} borderRadius={999} opacity={opacity} />
        </View>
      </View>

      {/* Cover letter block */}
      <View
        style={[
          styles.sectionBlock,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonBox width="35%" height={12} opacity={opacity} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={12} opacity={opacity} />
        <SkeletonBox width="100%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
        <SkeletonBox width="100%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
        <SkeletonBox width="75%" height={12} opacity={opacity} style={{ marginTop: 6 }} />
      </View>

      {/* Bid section */}
      <View
        style={[
          styles.sectionBlock,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <SkeletonBox width="25%" height={12} opacity={opacity} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <SkeletonBox width="32%" height={60} borderRadius={12} opacity={opacity} />
          <SkeletonBox width="32%" height={60} borderRadius={12} opacity={opacity} />
          <SkeletonBox width="32%" height={60} borderRadius={12} opacity={opacity} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  body: {
    padding: 14,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerText: {
    flex: 1,
    gap: 6,
  },
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  heroBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
    gap: 6,
  },
  sectionBlock: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
});

export { ProposalCardSkeleton as ProposalSkeleton };
export default ProposalCardSkeleton;
