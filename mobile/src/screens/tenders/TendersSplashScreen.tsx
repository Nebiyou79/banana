/**
 * src/screens/tenders/TendersSplashScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Tenders splash screen — gold/navy palette, animated entrance.
 * Auto-navigates to TendersHome after the entrance sequence completes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { TendersStackParamList } from '../../navigation/TendersNavigator';
import { useThemeStore } from '../../store/themeStore';

const { width, height } = Dimensions.get('window');

// ─── Design tokens (self-contained, no external import needed) ───────────────
const GOLD         = '#F1BB03';
const GOLD_SOFT    = 'rgba(241,187,3,0.18)';
const GOLD_RING    = 'rgba(241,187,3,0.08)';
const NAVY_DEEP    = '#050D1A';
const NAVY_MID     = '#0A1628';
const NAVY_SURFACE = '#0F2040';

type Nav = NativeStackNavigationProp<TendersStackParamList, 'TendersSplash'>;

// ─── Animated ring component ─────────────────────────────────────────────────

interface RingProps {
  size: number;
  delay: number;
  opacity: number;
}

const PulseRing: React.FC<RingProps> = ({ size, delay, opacity }) => {
  const scale   = useRef(new Animated.Value(0.6)).current;
  const fadeVal = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.4,
            duration: 2200,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(fadeVal, {
              toValue: opacity,
              duration: 400,
              useNativeDriver: true,
            }),
            Animated.timing(fadeVal, {
              toValue: 0,
              duration: 1800,
              easing: Easing.in(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
        ]),
        Animated.parallel([
          Animated.timing(scale,   { toValue: 0.6, duration: 0, useNativeDriver: true }),
          Animated.timing(fadeVal, { toValue: 0,   duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: GOLD,
        opacity: fadeVal,
        transform: [{ scale }],
      }}
    />
  );
};

// ─── Main component ──────────────────────────────────────────────────────────

export const TendersSplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const isDark     = useThemeStore((s) => s.theme.isDark);

  // ── Animation values ──────────────────────────────────────────────────────
  const bgOpacity      = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.72)).current;
  const logoOpacity    = useRef(new Animated.Value(0)).current;
  const glowOpacity    = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const lineWidth      = useRef(new Animated.Value(0)).current;
  const subtitleY      = useRef(new Animated.Value(10)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');

    Animated.sequence([
      // 1. Background fades in
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // 2. Logo scale-in with glow bloom
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 120,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // 3. Divider line draws across
      Animated.timing(lineWidth, {
        toValue: 1, // we scale via scaleX
        duration: 380,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      // 4. Tagline slides up
      Animated.parallel([
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 340,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]),
      // 5. Subtitle fades
      Animated.parallel([
        Animated.timing(subtitleY, {
          toValue: 0,
          duration: 280,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      // Navigate after a short pause so the screen is fully visible
      setTimeout(() => {
        navigation.replace('TendersHome');
      }, 900);
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY_DEEP} />

      {/* ── Background gradient layers ── */}
      <View style={styles.bgLayer1} />
      <View style={styles.bgLayer2} />

      {/* ── Decorative corner accent (top-right) ── */}
      <View style={styles.cornerAccentTR} />
      <View style={styles.cornerAccentBL} />

      {/* ── Subtle diagonal grid lines ── */}
      {[...Array(6)].map((_, i) => (
        <View
          key={i}
          style={[
            styles.gridLine,
            {
              top: -80 + i * 120,
              transform: [{ rotate: '-28deg' }],
              opacity: 0.025 + i * 0.005,
            },
          ]}
        />
      ))}

      {/* ── Radial glow behind logo ── */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* ── Pulse rings ── */}
      <PulseRing size={220} delay={0}    opacity={0.18} />
      <PulseRing size={300} delay={400}  opacity={0.12} />
      <PulseRing size={380} delay={800}  opacity={0.07} />

      {/* ── Central content ── */}
      <View style={styles.centerContent}>

        {/* Logo */}
        <Animated.View
          style={[
            styles.logoWrap,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../../assets/tenderlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Divider */}
        <Animated.View
          style={[
            styles.divider,
            { transform: [{ scaleX: lineWidth }] },
          ]}
        />

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateY: taglineY }],
            },
          ]}
        >
          TENDERS & PROCUREMENT
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            {
              opacity: subtitleOpacity,
              transform: [{ translateY: subtitleY }],
            },
          ]}
        >
          Connecting opportunities with the right partners
        </Animated.Text>
      </View>

      {/* ── Bottom wordmark ── */}
      <Animated.View style={[styles.bottomBar, { opacity: subtitleOpacity }]}>
        <View style={styles.bottomDot} />
        <Text style={styles.bottomText}>BananaLink</Text>
        <View style={styles.bottomDot} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: NAVY_DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Background depth layers
  bgLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: NAVY_MID,
    opacity: 0.6,
  },
  bgLayer2: {
    position: 'absolute',
    top: -height * 0.3,
    left: -width * 0.3,
    width: width * 1.6,
    height: width * 1.6,
    borderRadius: width * 0.8,
    backgroundColor: NAVY_SURFACE,
    opacity: 0.45,
  },

  // Corner accents
  cornerAccentTR: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  cornerAccentBL: {
    position: 'absolute',
    bottom: -60,
    left: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: GOLD_RING,
  },

  // Grid lines
  gridLine: {
    position: 'absolute',
    left: -width * 0.5,
    width: width * 2,
    height: 1,
    backgroundColor: GOLD,
  },

  // Radial glow
  glow: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: GOLD,
    opacity: 0,
    // Soft bloom via shadow trick on the View itself (not logo)
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 80,
  },

  // Center content stack
  centerContent: {
    alignItems: 'center',
    gap: 0,
  },

  logoWrap: {
    width: 160,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    // Glow halo on the logo itself
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 32,
    elevation: 16,
  },
  logo: {
    width: 140,
    height: 140,
  },

  divider: {
    width: 120,
    height: 1.5,
    backgroundColor: GOLD,
    marginBottom: 20,
    opacity: 0.75,
  },

  tagline: {
    color: GOLD,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    marginBottom: 10,
    opacity: 0.9,
  },

  subtitle: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },

  // Bottom wordmark
  bottomBar: {
    position: 'absolute',
    bottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: GOLD,
    opacity: 0.5,
  },
  bottomText: {
    color: 'rgba(255,255,255,0.30)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});

export default TendersSplashScreen;