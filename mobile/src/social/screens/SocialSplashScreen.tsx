// src/social/screens/SocialSplashScreen.tsx
// ─── Banana Social Splash Screen ──────────────────────────────────────────────
// sociallogo.png has transparent background (black removed).
// Logo composites directly on the dark background — no card wrapper.
// Role-based accent colors. Full dark/light mode support.
// Auto-navigates to SocialTabs after SPLASH_MS.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import type { SocialStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');
const SPLASH_MS = 2100;

type Nav = NativeStackNavigationProp<SocialStackParamList>;

// Role config — all use dark bg so transparent logo shows correctly
const ROLE_CONFIG: Record<string, {
  accent: string;
  accentDim: string;
  tagline: string;
  label: string;
}> = {
  candidate: {
    accent:    '#3B82F6',
    accentDim: 'rgba(59,130,246,0.14)',
    tagline:   'Your Career Network',
    label:     'Candidate Network',
  },
  freelancer: {
    accent:    '#10B981',
    accentDim: 'rgba(16,185,129,0.14)',
    tagline:   'Your Freelance Hub',
    label:     'Freelancer Network',
  },
  company: {
    accent:    '#F1BB03',
    accentDim: 'rgba(241,187,3,0.14)',
    tagline:   'Your Hiring Platform',
    label:     'Company Network',
  },
  organization: {
    accent:    '#8B5CF6',
    accentDim: 'rgba(139,92,246,0.14)',
    tagline:   'Your Professional Circle',
    label:     'Organization Network',
  },
};

// Constellation dots
const DOTS: [number, number][] = [
  [22, 100], [100, 50], [200, 130], [310, 60], [360, 200],
  [60, 280], [280, 320], [150, 430], [330, 490],
  [45, 580], [185, 640], [345, 710], [85, 760],
  [250, 90], [325, 250], [65, 410], [295, 600],
];

// Constellation line connections
const LINES = [
  { x1: 22,  y1: 100, x2: 100, y2: 50  },
  { x1: 100, y1: 50,  x2: 200, y2: 130 },
  { x1: 200, y1: 130, x2: 310, y2: 60  },
  { x1: 280, y1: 320, x2: 330, y2: 490 },
  { x1: 150, y1: 430, x2: 280, y2: 320 },
];

const PARTICLE_COUNT  = 8;
const PARTICLE_RADIUS = 115;

// Always dark background so transparent logo composites correctly
const BG = '#050D1A';

export const SocialSplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const isDark     = useThemeStore((s) => s.theme.isDark);
  const role       = (useAuthStore((s) => s.role) ?? 'candidate') as string;
  const cfg        = ROLE_CONFIG[role] ?? ROLE_CONFIG.candidate;

  const muted = 'rgba(255,255,255,0.45)';

  // Animations
  const logoScale   = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale   = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const ringScale   = useRef(new Animated.Value(0.7)).current;
  const ringOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(22)).current;
  const titleOp     = useRef(new Animated.Value(0)).current;
  const taglineY    = useRef(new Animated.Value(16)).current;
  const taglineOp   = useRef(new Animated.Value(0)).current;
  const badgeOp     = useRef(new Animated.Value(0)).current;
  const dotsOp      = useRef(new Animated.Value(0)).current;
  const outro       = useRef(new Animated.Value(0)).current;

  const particleAnims = useRef(
    Array.from({ length: PARTICLE_COUNT }, () => ({
      scale:   new Animated.Value(0),
      opacity: new Animated.Value(0),
    })),
  ).current;

  useEffect(() => {
    // Constellation + lines
    Animated.timing(dotsOp, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    // Particle burst
    particleAnims.forEach((p, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(p.scale,   { toValue: 1, tension: 80, friction: 6, useNativeDriver: true }),
          Animated.timing(p.opacity, { toValue: 0.65, duration: 400, useNativeDriver: true }),
        ]).start();
      }, 300 + i * 65);
    });

    // Main entrance sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(ringScale,   { toValue: 1, tension: 45, friction: 8, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(glowScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.spring(logoScale,   { toValue: 1, tension: 65, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(titleY,  { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(titleOp, { toValue: 1, duration: 340, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(taglineY,  { toValue: 0, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(taglineOp, { toValue: 1, duration: 320, useNativeDriver: true }),
        Animated.timing(badgeOp,   { toValue: 1, duration: 380, useNativeDriver: true }),
      ]),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.12, duration: 1600, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.95, duration: 1600, useNativeDriver: true }),
      ]),
    ).start();

    // Navigate out with fade
    const timer = setTimeout(() => {
      Animated.timing(outro, { toValue: 1, duration: 280, useNativeDriver: true }).start(() => {
        navigation.replace('SocialTabs');
      });
    }, SPLASH_MS);

    return () => clearTimeout(timer);
  }, []);

  const outerOpacity = outro.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Animated.View style={[S.root, { opacity: outerOpacity, backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />

      {/* Constellation dots + lines */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dotsOp }]}>
        {DOTS.map(([x, y], i) => (
          <View key={`d${i}`} style={[S.dot, {
            left: x, top: y,
            backgroundColor: cfg.accent,
            opacity: 0.16 + (i % 3) * 0.06,
            width: i % 5 === 0 ? 5 : 3,
            height: i % 5 === 0 ? 5 : 3,
          }]} />
        ))}
        {LINES.map((l, i) => {
          const dx    = l.x2 - l.x1;
          const dy    = l.y2 - l.y1;
          const len   = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);
          return (
            <View key={`l${i}`} style={[S.line, {
              width: len, left: l.x1, top: l.y1,
              backgroundColor: `${cfg.accent}20`,
              transform: [{ rotate: `${angle}deg` }],
            }]} />
          );
        })}
      </Animated.View>

      {/* Atmosphere corner blobs */}
      <View style={[S.blob, { top: -100, right: -90, backgroundColor: cfg.accentDim }]} />
      <View style={[S.blob, { bottom: -120, left: -100, backgroundColor: cfg.accentDim, width: 360, height: 360 }]} />

      {/* Particles burst around logo */}
      {particleAnims.map((p, i) => {
        const angle = (i / PARTICLE_COUNT) * Math.PI * 2;
        const px    = Math.cos(angle) * PARTICLE_RADIUS;
        const py    = Math.sin(angle) * PARTICLE_RADIUS;
        return (
          <Animated.View key={i} style={[S.particle, {
            backgroundColor: cfg.accent,
            left: width / 2 + px - 5,
            top:  height / 2 - 90 + py - 5,
            opacity:   p.opacity,
            transform: [{ scale: p.scale }],
          }]} />
        );
      })}

      {/* Centre content */}
      <View style={S.centre}>

        {/* Glow halo */}
        <Animated.View style={[S.halo, {
          backgroundColor: cfg.accent,
          transform: [{ scale: glowScale }],
          opacity: glowOpacity,
          shadowColor: cfg.accent,
        }]} />

        {/* Outer ring */}
        <Animated.View style={[S.ring, {
          borderColor: `${cfg.accent}55`,
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }]} />

        {/* Inner ring */}
        <Animated.View style={[S.ringInner, {
          borderColor: `${cfg.accent}28`,
          transform: [{ scale: ringScale }],
          opacity: ringOpacity,
        }]} />

        {/*
          Logo — transparent background, plain Image inside Animated.View.
          No card, no backgroundColor — composites directly on dark navy.
        */}
        <Animated.View style={[S.logoWrap, {
          opacity:   logoOpacity,
          transform: [{ scale: logoScale }],
        }]}>
          <Image
            source={require('../../../assets/sociallogo.png')}
            style={S.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* "Banana Social" title */}
        <Animated.View style={[S.titleBlock, {
          opacity:   titleOp,
          transform: [{ translateY: titleY }],
        }]}>
          <Text style={S.titleMain}>Banana</Text>
          <Text style={[S.titleAccent, { color: cfg.accent }]}>Social</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[S.tagline, {
          opacity:   taglineOp,
          transform: [{ translateY: taglineY }],
        }]}>
          {cfg.tagline}
        </Animated.Text>

      </View>

      {/* Bottom role badge */}
      <Animated.View style={[S.badgeWrap, { opacity: badgeOp }]}>
        <View style={[S.badge, {
          borderColor:     `${cfg.accent}45`,
          backgroundColor: 'rgba(255,255,255,0.05)',
        }]}>
          <View style={[S.badgeDot, { backgroundColor: cfg.accent }]} />
          <Text style={[S.badgeText, { color: `${cfg.accent}EE` }]}>{cfg.label}</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const S = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dot:      { position: 'absolute', borderRadius: 3 },
  line:     { position: 'absolute', height: 1 },
  blob:     { position: 'absolute', width: 300, height: 300, borderRadius: 999 },
  particle: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },

  centre: { alignItems: 'center', flex: 1, justifyContent: 'center' },

  halo: {
    position: 'absolute',
    width: 250, height: 250,
    borderRadius: 125,
    opacity: 0.13,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 20,
  },
  ring: {
    position: 'absolute',
    width: 270, height: 270,
    borderRadius: 135,
    borderWidth: 1.5,
  },
  ringInner: {
    position: 'absolute',
    width: 228, height: 228,
    borderRadius: 114,
    borderWidth: 1,
  },

  // No background, no border-radius clip — just size + center
  logoWrap: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoImg: {
    width: 200,
    height: 200,
  },

  titleBlock: { alignItems: 'center', marginTop: 20, gap: 0 },
  titleMain: {
    fontSize: 40,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: -0.5,
    lineHeight: 44,
  },
  titleAccent: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 0.5,
    lineHeight: 40,
  },

  tagline: {
    marginTop: 12,
    fontSize: 15,
    color: 'rgba(255,255,255,0.50)',
    letterSpacing: 0.4,
    textAlign: 'center',
  },

  badgeWrap: {
    position: 'absolute',
    bottom: 58,
    left: 0, right: 0,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  badgeDot:  { width: 8, height: 8, borderRadius: 4 },
  badgeText: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },
});

export default SocialSplashScreen;