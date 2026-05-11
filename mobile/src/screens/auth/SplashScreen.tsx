// src/screens/auth/SplashScreen.tsx
// ─── Main Banana App Splash Screen ────────────────────────────────────────────
// Uses logo.png (main Banana logo) with premium dark-navy + gold aesthetic.
// Fully wired to useTheme() for dark/light mode support.
// Beautiful constellation background, pulsing glow halo, smooth spring animation.

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Image,
  Text,
} from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';

const { width, height } = Dimensions.get('window');

// Constellation dot positions
const DOTS: [number, number][] = [
  [28, 90], [95, 45], [195, 130], [305, 55], [355, 190],
  [55, 260], [275, 310], [145, 410], [325, 460],
  [38, 560], [175, 615], [338, 695], [75, 740],
  [240, 80], [320, 240], [60, 400], [290, 580],
];

// Constellation line connections
const LINES = [
  { x1: 28,  y1: 90,  x2: 95,  y2: 45  },
  { x1: 95,  y1: 45,  x2: 195, y2: 130 },
  { x1: 195, y1: 130, x2: 305, y2: 55  },
  { x1: 305, y1: 55,  x2: 355, y2: 190 },
  { x1: 275, y1: 310, x2: 325, y2: 460 },
  { x1: 145, y1: 410, x2: 275, y2: 310 },
  { x1: 55,  y1: 260, x2: 145, y2: 410 },
];

export const SplashScreen: React.FC = () => {
  const { colors: c, isDark } = useTheme();

  // Animation refs
  const glowScale    = useRef(new Animated.Value(0.82)).current;
  const glowOpacity  = useRef(new Animated.Value(0.25)).current;
  const ringScale    = useRef(new Animated.Value(0.75)).current;
  const ringOpacity  = useRef(new Animated.Value(0)).current;
  const logoScale    = useRef(new Animated.Value(0.55)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const tagOpacity   = useRef(new Animated.Value(0)).current;
  const tagY         = useRef(new Animated.Value(12)).current;
  const spinnerOp    = useRef(new Animated.Value(0)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;
  const shimmer      = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Constellation fade in
    Animated.timing(dotsOpacity, {
      toValue: 1, duration: 900, useNativeDriver: true,
    }).start();

    // Main entrance sequence
    Animated.sequence([
      // Glow ring expands
      Animated.parallel([
        Animated.spring(ringScale,   { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
      // Logo springs in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 65, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
      ]),
      // Tagline slides up
      Animated.parallel([
        Animated.spring(tagY,      { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(tagOpacity,{ toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
      // Spinner fades in
      Animated.timing(spinnerOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Pulsing glow loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 1.15, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.65, duration: 1800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale,   { toValue: 0.82, duration: 1800, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.25, duration: 1800, useNativeDriver: true }),
        ]),
      ]),
    ).start();

    // Shimmer loop on the divider line
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const shimmerOpacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] });

  return (
    <View style={[S.root, { backgroundColor: c.bg }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={c.bg} />

      {/* ── Constellation background ── */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dotsOpacity }]}>
        {DOTS.map(([x, y], i) => (
          <View
            key={`d${i}`}
            style={[S.dot, {
              left: x, top: y,
              backgroundColor: c.primary,
              opacity: isDark ? 0.18 + (i % 3) * 0.07 : 0.12 + (i % 3) * 0.05,
              width: i % 4 === 0 ? 5 : 3,
              height: i % 4 === 0 ? 5 : 3,
              borderRadius: 3,
            }]}
          />
        ))}
        {LINES.map((l, i) => {
          const dx = l.x2 - l.x1;
          const dy = l.y2 - l.y1;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View
              key={`l${i}`}
              style={[S.line, {
                width: len, left: l.x1, top: l.y1,
                backgroundColor: withAlpha(c.primary, isDark ? 0.14 : 0.08),
                transform: [{ rotate: `${angle}deg` }],
              }]}
            />
          );
        })}
      </Animated.View>

      {/* ── Corner atmosphere blobs ── */}
      <View style={[S.blob, {
        top: -110, right: -90,
        backgroundColor: withAlpha(c.primary, isDark ? 0.07 : 0.05),
        width: 320, height: 320,
      }]} />
      <View style={[S.blob, {
        bottom: -130, left: -110,
        backgroundColor: withAlpha(c.candidate, isDark ? 0.06 : 0.04),
        width: 380, height: 380,
      }]} />
      <View style={[S.blob, {
        top: height * 0.35, right: -60,
        backgroundColor: withAlpha(c.freelancer, isDark ? 0.04 : 0.03),
        width: 200, height: 200,
      }]} />

      {/* ── Centre content ── */}
      <View style={S.centre}>

        {/* Outer glow halo */}
        <Animated.View style={[S.halo, {
          backgroundColor: c.primary,
          transform: [{ scale: glowScale }],
          opacity: glowOpacity,
        }]} />

        {/* Ring border */}
        <Animated.View style={[S.ring, {
          borderColor: withAlpha(c.primary, 0.35),
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }]} />

        {/* Inner ring */}
        <Animated.View style={[S.ringInner, {
          borderColor: withAlpha(c.primary, 0.15),
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }]} />

        {/* Logo image */}
        <Animated.Image
          source={require('../../../assets/logo.png')}
          style={[S.logoImg, {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }]}
          resizeMode="contain"
        />

        {/* App name + divider */}
        <Animated.View style={[S.textBlock, {
          opacity: tagOpacity,
          transform: [{ translateY: tagY }],
        }]}>
          <Text style={[S.appName, { color: c.text }]}>Banana</Text>

          {/* Shimmer divider */}
          <View style={S.dividerWrap}>
            <View style={[S.dividerLine, { backgroundColor: withAlpha(c.primary, 0.25) }]} />
            <Animated.View style={[S.dividerDot, {
              backgroundColor: c.primary,
              opacity: shimmerOpacity,
            }]} />
            <View style={[S.dividerLine, { backgroundColor: withAlpha(c.primary, 0.25) }]} />
          </View>

          <Text style={[S.tagline, { color: withAlpha(c.primary, 0.75) }]}>
            Jobs · Tenders · Personal Branding
          </Text>
        </Animated.View>
      </View>

      {/* ── Bottom spinner + version ── */}
      <Animated.View style={[S.bottom, { opacity: spinnerOp }]}>
        <View style={[S.spinner, {
          borderColor: withAlpha(c.primary, 0.18),
          borderTopColor: c.primary,
        }]} />
        <Text style={[S.version, { color: withAlpha(c.text, 0.3) }]}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const S = StyleSheet.create({
  root:      { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dot:       { position: 'absolute' },
  line:      { position: 'absolute', height: 1 },
  blob:      { position: 'absolute', borderRadius: 999 },

  centre: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  halo: {
    position: 'absolute',
    width: 240, height: 240,
    borderRadius: 120,
    opacity: 0.15,
  },
  ring: {
    position: 'absolute',
    width: 230, height: 230,
    borderRadius: 115,
    borderWidth: 1.5,
  },
  ringInner: {
    position: 'absolute',
    width: 195, height: 195,
    borderRadius: 98,
    borderWidth: 1,
  },

  logoImg: { width: 190, height: 190, zIndex: 2 },

  textBlock: { alignItems: 'center', marginTop: 28 },
  appName: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 10,
  },
  dividerLine: { width: 40, height: 1 },
  dividerDot:  { width: 6, height: 6, borderRadius: 3 },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
  },

  bottom: {
    position: 'absolute',
    bottom: 52,
    alignItems: 'center',
    gap: 10,
  },
  spinner: {
    width: 30, height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
  },
  version: { fontSize: 11, letterSpacing: 0.5 },
});

export default SplashScreen;