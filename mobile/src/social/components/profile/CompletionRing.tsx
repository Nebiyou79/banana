import React, { memo, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSocialTheme } from '../../theme/socialTheme';

interface Props {
  percentage: number; // 0..100
  size?: number;
  thickness?: number;
  label?: string;
}

/**
 * Progress ring built with pure RN Views (no SVG dependency). The ring is
 * approximated by rotating two half-circles — the classic pure-RN technique.
 * Value animates whenever `percentage` changes.
 */
const CompletionRing: React.FC<Props> = memo(
  ({ percentage, size = 72, thickness = 7, label }) => {
    const theme = useSocialTheme();
    const animated = useRef(new Animated.Value(0)).current;
    const clamped = Math.max(0, Math.min(100, percentage ?? 0));

    useEffect(() => {
      Animated.timing(animated, {
        toValue: clamped,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }, [clamped, animated]);

    const halfSize = size / 2;

    // First half (0-180deg of progress fills the right side)
    const firstHalfRotate = animated.interpolate({
      inputRange: [0, 50, 100],
      outputRange: ['0deg', '180deg', '180deg'],
    });
    // Second half (after 50% fills the left side)
    const secondHalfRotate = animated.interpolate({
      inputRange: [0, 50, 100],
      outputRange: ['0deg', '0deg', '180deg'],
    });

    const trackColor = theme.dark ? theme.cardAlt : theme.border;

    return (
      <View
        style={[
          styles.wrap,
          { width: size, height: size },
        ]}
        accessibilityLabel={`${Math.round(clamped)} percent complete`}
      >
        {/* Track */}
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: halfSize,
              borderWidth: thickness,
              borderColor: trackColor,
            },
          ]}
        />

        {/* Progress fill — two rotating halves */}
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: halfSize, overflow: 'hidden' },
          ]}
        >
          {/* Right half container */}
          <View
            style={[
              styles.halfContainer,
              { width: halfSize, height: size, right: 0 },
            ]}
          >
            <Animated.View
              style={[
                styles.halfCircle,
                {
                  width: halfSize,
                  height: size,
                  borderTopRightRadius: halfSize,
                  borderBottomRightRadius: halfSize,
                  backgroundColor: theme.primary,
                  transform: [
                    { translateX: -halfSize / 2 },
                    { rotate: firstHalfRotate },
                    { translateX: halfSize / 2 },
                  ],
                },
              ]}
            />
          </View>
          {/* Left half container */}
          <View
            style={[
              styles.halfContainer,
              { width: halfSize, height: size, left: 0 },
            ]}
          >
            <Animated.View
              style={[
                styles.halfCircle,
                {
                  width: halfSize,
                  height: size,
                  borderTopLeftRadius: halfSize,
                  borderBottomLeftRadius: halfSize,
                  backgroundColor: theme.primary,
                  transform: [
                    { translateX: halfSize / 2 },
                    { rotate: secondHalfRotate },
                    { translateX: -halfSize / 2 },
                  ],
                },
              ]}
            />
          </View>

          {/* Inner mask to create the ring effect */}
          <View
            style={[
              styles.innerMask,
              {
                top: thickness,
                left: thickness,
                right: thickness,
                bottom: thickness,
                borderRadius: halfSize - thickness,
                backgroundColor: theme.card,
              },
            ]}
          />
        </View>

        {/* Center label */}
        <View style={styles.center} pointerEvents="none">
          <Text
            style={[
              styles.percent,
              { color: theme.text, fontSize: size * 0.26 },
            ]}
          >
            {Math.round(clamped)}%
          </Text>
          {label ? (
            <Text style={[styles.label, { color: theme.muted }]}>{label}</Text>
          ) : null}
        </View>
      </View>
    );
  }
);

CompletionRing.displayName = 'CompletionRing';

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  circle: { position: 'absolute' },
  halfContainer: { position: 'absolute', overflow: 'hidden' },
  halfCircle: { position: 'absolute' },
  innerMask: { position: 'absolute' },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  percent: { fontWeight: '800' },
  label: { fontSize: 9, marginTop: 1 },
});

export default CompletionRing;
