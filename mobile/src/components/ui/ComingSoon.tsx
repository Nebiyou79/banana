// src/components/ui/ComingSoon.tsx
// Usage: <ComingSoon feature="Chat" description="Real-time messaging is in development." />

import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

interface ComingSoonProps {
  feature?: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}

export const ComingSoon: React.FC<ComingSoonProps> = ({
  feature = 'This feature',
  description,
  icon = 'rocket-outline',
  style,
}) => {
  const { colors: c, radius, spacing, type, shadows } = useTheme();
  const insets = useSafeAreaInsets();

  // Staggered entrance
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const badgeFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, speed: 10, bounciness: 10 }),
      ]),
      Animated.timing(badgeFade, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Gentle pulse on icon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1600, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View
      style={[
        styles.root,
        {
          paddingBottom: insets.bottom + spacing.xl,
          paddingTop: insets.top + spacing.xl,
          backgroundColor: c.bg,
        },
        style,
      ]}
    >
      {/* Decorative background rings */}
      <View
        style={[
          styles.ring,
          styles.ringOuter,
          {
            borderColor: withAlpha(c.primary, 0.06),
          },
        ]}
      />
      <View
        style={[
          styles.ring,
          styles.ringMiddle,
          {
            borderColor: withAlpha(c.primary, 0.10),
          },
        ]}
      />

      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Icon */}
        <Animated.View
          style={[
            styles.iconWrap,
            {
              backgroundColor: withAlpha(c.primary, 0.12),
              borderColor: withAlpha(c.primary, 0.25),
              borderRadius: radius.xl,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <Ionicons name={icon} size={40} color={c.primary} />
        </Animated.View>

        {/* Coming Soon badge */}
        <Animated.View
          style={[
            styles.badge,
            {
              backgroundColor: c.primaryBg,
              borderColor: c.borderAccent,
              borderRadius: radius.full,
              opacity: badgeFade,
            },
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              { backgroundColor: c.primary },
            ]}
          />
          <Text
            style={[
              type.caption,
              { color: c.primary, fontWeight: '700', letterSpacing: 1 },
            ]}
          >
            COMING SOON
          </Text>
        </Animated.View>

        {/* Feature name */}
        <Text
          style={[
            type.h1,
            {
              color: c.text,
              textAlign: 'center',
              fontWeight: '700',
              marginTop: spacing.lg,
            },
          ]}
        >
          {feature}
        </Text>

        {/* Description */}
        <Text
          style={[
            type.body,
            {
              color: c.textMuted,
              textAlign: 'center',
              marginTop: spacing.sm,
              maxWidth: 280,
              lineHeight: 24,
            },
          ]}
        >
          {description ?? `${feature} is under active development. Check back soon for updates.`}
        </Text>

        {/* Decorative dots row */}
        <View style={[styles.dotsRow, { marginTop: spacing.xxl }]}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === 1 ? c.primary : withAlpha(c.primary, 0.25),
                  width: i === 1 ? 24 : 8,
                  borderRadius: radius.full,
                },
              ]}
            />
          ))}
        </View>

        {/* Footer note */}
        <Text
          style={[
            type.caption,
            {
              color: c.textMuted,
              textAlign: 'center',
              marginTop: spacing.xl,
              fontStyle: 'italic',
            },
          ]}
        >
          We're building something great ✨
        </Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Decorative background rings (like radar pulse)
  ring: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  ringOuter: {
    width: 340,
    height: 340,
    borderRadius: 170,
    top: '50%',
    left: '50%',
    marginTop: -170,
    marginLeft: -170,
  },
  ringMiddle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    top: '50%',
    left: '50%',
    marginTop: -110,
    marginLeft: -110,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    zIndex: 1,
  },
  iconWrap: {
    width: 96,
    height: 96,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    marginTop: 20,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 8,
  },
  dot: {
    height: 8,
  },
});

export default ComingSoon;