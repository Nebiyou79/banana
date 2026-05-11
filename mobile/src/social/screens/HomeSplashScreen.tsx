// src/social/screens/HomeSplashScreen.tsx
// ─── Home / Role Transition Splash Screen ─────────────────────────────────────
// Shown when user taps into their role root (Candidate, Freelancer, etc.).
// Uses logo.png. Role-based accent color. Dark/light mode via useThemeStore.
// Beautiful progress bar + ambient glow. Auto-navigates after ~1000ms.

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';

const { width } = Dimensions.get('window');

const ROLE_ROOT: Record<string, string> = {
  candidate:    'CandidateRoot',
  freelancer:   'FreelancerRoot',
  company:      'CompanyRoot',
  organization: 'OrganizationRoot',
};

const ROLE_CONFIG: Record<string, {
  accent: string;
  accentDim: string;
  label: string;
  sublabel: string;
}> = {
  candidate: {
    accent:    '#3B82F6',
    accentDim: 'rgba(59,130,246,0.12)',
    label:     'Welcome Back',
    sublabel:  'Returning to Jobs',
  },
  freelancer: {
    accent:    '#10B981',
    accentDim: 'rgba(16,185,129,0.12)',
    label:     'Welcome Back',
    sublabel:  'Returning to Projects',
  },
  company: {
    accent:    '#F1BB03',
    accentDim: 'rgba(241,187,3,0.12)',
    label:     'Welcome Back',
    sublabel:  'Returning to Hiring',
  },
  organization: {
    accent:    '#8B5CF6',
    accentDim: 'rgba(139,92,246,0.12)',
    label:     'Welcome Back',
    sublabel:  'Returning to Tenders',
  },
};

// Decorative dot positions
const DOTS: [number, number][] = [
  [20, 80],  [100, 40], [300, 70], [350, 190],
  [50, 280], [260, 290],[140, 420],[320, 470],
  [80, 600], [230, 650],[350, 720],[60, 740],
];

export const HomeSplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark     = useThemeStore((s) => s.theme.isDark);
  const role       = (useAuthStore((s) => s.role) ?? 'candidate') as string;
  const cfg        = ROLE_CONFIG[role] ?? ROLE_CONFIG.candidate;

  const bg    = isDark ? '#050D1A' : '#F8FAFC';
  const text  = isDark ? '#F8FAFC' : '#0A1628';
  const muted = isDark ? 'rgba(255,255,255,0.40)' : 'rgba(10,22,40,0.40)';

  // Animations
  const logoScale    = useRef(new Animated.Value(0.65)).current;
  const logoOpacity  = useRef(new Animated.Value(0)).current;
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const glowScale    = useRef(new Animated.Value(0.7)).current;
  const ringOpacity  = useRef(new Animated.Value(0)).current;
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(14)).current;
  const barWidth     = useRef(new Animated.Value(0)).current;
  const dotsOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Constellation
    Animated.timing(dotsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    // Main sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 70, friction: 6, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(glowScale,   { toValue: 1, tension: 55, friction: 8, useNativeDriver: true }),
        Animated.timing(ringOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(textY,       { toValue: 0, tension: 60, friction: 8, useNativeDriver: true }),
        Animated.timing(textOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
      Animated.timing(barWidth, { toValue: 1, duration: 750, useNativeDriver: false }),
    ]).start();

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.12, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.92, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();

    // Navigate after delay
    const t = setTimeout(() => {
      Animated.timing(logoOpacity, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
        try {
          navigation.getParent()?.getParent()?.reset({
            index: 0,
            routes: [{ name: ROLE_ROOT[role] ?? 'CandidateRoot' }],
          });
        } catch {
          navigation.goBack();
        }
      });
    }, 1050);

    return () => clearTimeout(t);
  }, []);

  const barPx = barWidth.interpolate({
    inputRange: [0, 1], outputRange: [0, width * 0.52],
  });

  return (
    <View style={[S.root, { backgroundColor: bg }]}>

      {/* Constellation dots */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dotsOpacity }]}>
        {DOTS.map(([x, y], i) => (
          <View key={i} style={[S.dot, {
            left: x, top: y,
            backgroundColor: cfg.accent,
            opacity: isDark ? 0.16 + (i % 3) * 0.06 : 0.1 + (i % 3) * 0.04,
          }]} />
        ))}
      </Animated.View>

      {/* Atmosphere blobs */}
      <View style={[S.blob, { top: -90, right: -80, backgroundColor: cfg.accentDim }]} />
      <View style={[S.blob, { bottom: -100, left: -90, backgroundColor: cfg.accentDim, width: 340, height: 340 }]} />

      <View style={S.centre}>
        {/* Glow halo */}
        <Animated.View style={[S.halo, {
          backgroundColor: cfg.accent,
          transform: [{ scale: glowScale }],
          opacity: glowOpacity,
          shadowColor: cfg.accent,
        }]} />

        {/* Ring */}
        <Animated.View style={[S.ring, {
          borderColor: `${cfg.accent}45`,
          opacity: ringOpacity,
        }]} />

        {/* Logo — Animated.View wrapper + plain Image avoids Android scale-clip bug */}
        <Animated.View style={[S.logoWrap, {
          opacity: logoOpacity,
          transform: [{ scale: logoScale }],
        }]}>
          <Image
            source={require('../../../assets/logo.png')}
            style={S.logo}
            resizeMode="contain"
          />
        </Animated.View>
      </View>

      {/* Bottom text + progress */}
      <Animated.View style={[S.bottom, {
        opacity: textOpacity,
        transform: [{ translateY: textY }],
      }]}>
        <Text style={[S.label, { color: muted }]}>{cfg.sublabel}</Text>

        <View style={[S.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }]}>
          <Animated.View style={[S.barFill, { width: barPx, backgroundColor: cfg.accent }]} />
        </View>

        <View style={[S.badge, { backgroundColor: cfg.accentDim, borderColor: `${cfg.accent}30` }]}>
          <View style={[S.badgeDot, { backgroundColor: cfg.accent }]} />
          <Text style={[S.badgeText, { color: cfg.accent }]}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
};

const S = StyleSheet.create({
  root: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  dot:  { position: 'absolute', width: 3, height: 3, borderRadius: 2 },
  blob: { position: 'absolute', width: 280, height: 280, borderRadius: 999 },

  centre: { alignItems: 'center', flex: 1, justifyContent: 'center' },

  halo: {
    position: 'absolute',
    width: 210, height: 210,
    borderRadius: 105,
    opacity: 0.14,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 50,
    elevation: 18,
  },
  ring: {
    position: 'absolute',
    width: 200, height: 200,
    borderRadius: 100,
    borderWidth: 1.5,
  },

  logoWrap: { width: 150, height: 150, zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 150, height: 150 },

  bottom: {
    position: 'absolute',
    bottom: 58,
    alignItems: 'center',
    gap: 14,
  },
  label: { fontSize: 14, fontWeight: '500', letterSpacing: 0.4 },

  barTrack: {
    width: width * 0.52,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barFill: { height: 3, borderRadius: 2 },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeDot:  { width: 7, height: 7, borderRadius: 4 },
  badgeText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
});

export default HomeSplashScreen;