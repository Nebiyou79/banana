// src/social/components/post/PostSkeleton.tsx
/**
 * PostSkeleton — shimmer loading placeholder
 * Design 2 (light): soft grey bones on white card
 * Design 3 (dark): primary-tinted bones on dark card with subtle glow
 */
import React, { memo, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { RADIUS, SPACING, useSocialTheme, withAlpha } from '../../theme/socialTheme';

interface BoneProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: object;
  pulse: Animated.Value;
  baseColor: string;
  highlightColor: string;
}

const Bone: React.FC<BoneProps> = ({
  width = '100%',
  height = 14,
  borderRadius = RADIUS.sm,
  style,
  pulse,
  baseColor,
  highlightColor,
}) => {
  const backgroundColor = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor,
          marginVertical: 4,
        },
        style,
      ]}
    />
  );
};

const SkeletonCard: React.FC<{
  pulse: Animated.Value;
  baseColor: string;
  highlightColor: string;
  cardBg: string;
  borderColor: string;
  dark: boolean;
  primaryColor: string;
}> = ({ pulse, baseColor, highlightColor, cardBg, borderColor, dark, primaryColor }) => (
  <View
    style={[
      styles.card,
      {
        backgroundColor: cardBg,
        borderColor,
        borderLeftWidth: dark ? 2.5 : 1,
        borderLeftColor: dark ? withAlpha(primaryColor, 0.4) : borderColor,
        shadowColor: dark ? primaryColor : '#000',
        shadowOffset: { width: 0, height: dark ? 2 : 1 },
        shadowOpacity: dark ? 0.15 : 0.06,
        shadowRadius: dark ? 10 : 6,
        elevation: dark ? 5 : 2,
      },
    ]}
  >
    {/* Header */}
    <View style={styles.header}>
      <Bone
        width={48}
        height={48}
        borderRadius={24}
        style={{ flexShrink: 0, marginVertical: 0 }}
        pulse={pulse}
        baseColor={baseColor}
        highlightColor={highlightColor}
      />
      <View style={styles.headerLines}>
        <Bone width="52%" height={13} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
        <Bone width="38%" height={11} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
        <Bone width="28%" height={10} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      </View>
    </View>

    {/* Text lines */}
    <View style={styles.textBlock}>
      <Bone width="96%" height={13} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      <Bone width="84%" height={13} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      <Bone width="62%" height={13} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
    </View>

    {/* Media block */}
    <Bone
      width="100%"
      height={200}
      borderRadius={0}
      style={{ marginVertical: 0 }}
      pulse={pulse}
      baseColor={baseColor}
      highlightColor={highlightColor}
    />

    {/* Actions row */}
    <View style={styles.actions}>
      <Bone width={72} height={22} borderRadius={11} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      <Bone width={80} height={22} borderRadius={11} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      <Bone width={68} height={22} borderRadius={11} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
      <Bone width={60} height={22} borderRadius={11} style={{ marginVertical: 0 }} pulse={pulse} baseColor={baseColor} highlightColor={highlightColor} />
    </View>
  </View>
);

interface Props { count?: number; }

const PostSkeleton: React.FC<Props> = memo(({ count = 2 }) => {
  const theme = useSocialTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false, // needed for backgroundColor interpolation
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const baseColor = theme.dark
    ? withAlpha(theme.colors.primary, 0.12)
    : '#ECEEF2';
  const highlightColor = theme.dark
    ? withAlpha(theme.colors.primary, 0.22)
    : '#F6F7FA';

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard
          key={i}
          pulse={pulse}
          baseColor={baseColor}
          highlightColor={highlightColor}
          cardBg={theme.colors.card}
          borderColor={theme.colors.border}
          dark={theme.dark}
          primaryColor={theme.colors.primary}
        />
      ))}
    </>
  );
});

PostSkeleton.displayName = 'PostSkeleton';

const styles = StyleSheet.create({
  card: {
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.md + 2,
    borderRadius: RADIUS.lg,
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
    justifyContent: 'space-around',
    padding: SPACING.md,
    paddingVertical: SPACING.sm + 2,
  },
});

export default PostSkeleton;
export { PostSkeleton };