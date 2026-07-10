/**
 * src/social/screens/SocialSplashScreen.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Social splash screen — mint/dark palette, animated entrance.
 * Auto-navigates to SocialTabs after the entrance sequence completes.
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
import type { SocialStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

// ─── Design tokens ────────────────────────────────────────────────────────────
const MINT         = '#2DD4A0';
const MINT_SOFT    = 'rgba(45,212,160,0.16)';
const MINT_RING    = 'rgba(45,212,160,0.07)';
const DARK_BASE    = '#0C1A16';
const DARK_MID     = '#132620';
const DARK_SURFACE = '#1A322A';
const VIOLET_HINT  = 'rgba(129,140,248,0.12)';

type Nav = NativeStackNavigationProp<SocialStackParamList, 'SocialSplash'>;

// ─── Floating particle component ─────────────────────────────────────────────

interface ParticleProps {
  x: number;
  y: number;
  size: number;
  delay: number;
  color: string;
}

const FloatingParticle: React.FC<ParticleProps> = ({ x, y, size, delay, color }) => {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -28,
            duration: 2400,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
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
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ translateY }],
      }}
    />
  );
};

// ─── Particle data ────────────────────────────────────────────────────────────

const PARTICLES = [
  { x: width * 0.12, y: height * 0.18, size: 6,  delay: 0,    color: MINT },
  { x: width * 0.82, y: height * 0.22, size: 4,  delay: 300,  color: MINT },
  { x: width * 0.22, y: height * 0.70, size: 5,  delay: 600,  color: '#818CF8' },
  { x: width * 0.75, y: height * 0.65, size: 7,  delay: 200,  color: MINT },
  { x: width * 0.05, y: height * 0.45, size: 3,  delay: 900,  color: '#818CF8' },
  { x: width * 0.90, y: height * 0.48, size: 4,  delay: 500,  color: MINT },
  { x: width * 0.50, y: height * 0.12, size: 3,  delay: 700,  color: MINT },
  { x: width * 0.35, y: height * 0.85, size: 5,  delay: 100,  color: '#818CF8' },
];

// ─── Connection arc (decorative SVG-like lines via Views) ────────────────────

const ConnectArc: React.FC<{ opacity: Animated.Value }> = ({ opacity }) => (
  <Animated.View style={[styles.arcWrap, { opacity }]}>
    {/* Top-left arc */}
    <View
      style={{
        position: 'absolute',
        top: -20,
        left: -20,
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 1,
        borderColor: MINT_SOFT,
        borderStyle: 'dashed',
      }}
    />
    {/* Bottom-right arc */}
    <View
      style={{
        position: 'absolute',
        bottom: -20,
        right: -20,
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: MINT_RING,
        borderStyle: 'dashed',
      }}
    />
  </Animated.View>
);

// ─── Main component ──────────────────────────────────────────────────────────

const SocialSplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();

  // ── Animation values ──────────────────────────────────────────────────────
  const bgOpacity       = useRef(new Animated.Value(0)).current;
  const logoScale       = useRef(new Animated.Value(0.68)).current;
  const logoOpacity     = useRef(new Animated.Value(0)).current;
  const glowOpacity     = useRef(new Animated.Value(0)).current;
  const arcOpacity      = useRef(new Animated.Value(0)).current;
  const taglineX        = useRef(new Animated.Value(-20)).current;
  const taglineOpacity  = useRef(new Animated.Value(0)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const pillScale       = useRef(new Animated.Value(0.8)).current;
  const pillOpacity     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    StatusBar.setBarStyle('light-content');

    Animated.sequence([
      // 1. Background
      Animated.timing(bgOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      // 2. Glow blooms, arcs appear, logo pops in
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(arcOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 5,
          tension: 110,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      // 3. Tagline slides in from left
      Animated.parallel([
        Animated.timing(taglineX, {
          toValue: 0,
          duration: 360,
          easing: Easing.out(Easing.exp),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
      // 4. Subtitle + pill badge
      Animated.parallel([
        Animated.timing(subtitleOpacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.spring(pillScale, {
          toValue: 1,
          friction: 6,
          tension: 200,
          useNativeDriver: true,
        }),
        Animated.timing(pillOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      setTimeout(() => {
        navigation.replace('SocialTabs');
      }, 900);
    });
  }, []);

  return (
    <Animated.View style={[styles.root, { opacity: bgOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor={DARK_BASE} />

      {/* ── Background layers ── */}
      <View style={styles.bgMid} />
      <View style={styles.bgBlob} />
      <View style={styles.bgVioletHint} />

      {/* ── Floating particles ── */}
      {PARTICLES.map((p, i) => (
        <FloatingParticle key={i} {...p} />
      ))}

      {/* ── Radial glow ── */}
      <Animated.View style={[styles.glow, { opacity: glowOpacity }]} />

      {/* ── Decorative rings ── */}
      <View style={styles.ring1} />
      <View style={styles.ring2} />

      {/* ── Central content ── */}
      <View style={styles.centerContent}>

        {/* Logo card */}
        <Animated.View
          style={[
            styles.logoCard,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <ConnectArc opacity={arcOpacity} />
          <Image
            source={require('../../../assets/sociallogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text
          style={[
            styles.tagline,
            {
              opacity: taglineOpacity,
              transform: [{ translateX: taglineX }],
            },
          ]}
        >
          BANANALINK SOCIAL
        </Animated.Text>

        {/* Subtitle */}
        <Animated.Text
          style={[
            styles.subtitle,
            { opacity: subtitleOpacity },
          ]}
        >
          Connect, share, and grow your professional network
        </Animated.Text>

        {/* Feature pills */}
        <Animated.View
          style={[
            styles.pillRow,
            {
              opacity: pillOpacity,
              transform: [{ scale: pillScale }],
            },
          ]}
        >
          {['Posts', 'Network', 'Messages'].map((label) => (
            <View key={label} style={styles.pill}>
              <Text style={styles.pillText}>{label}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      {/* ── Bottom wordmark ── */}
      <Animated.View style={[styles.bottomBar, { opacity: subtitleOpacity }]}>
        <View style={styles.bottomAccent} />
        <Text style={styles.bottomText}>BananaLink</Text>
        <View style={styles.bottomAccent} />
      </Animated.View>
    </Animated.View>
  );
};

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: DARK_BASE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bgMid: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: DARK_MID,
    opacity: 0.55,
  },
  bgBlob: {
    position: 'absolute',
    bottom: -height * 0.25,
    right: -width * 0.25,
    width: width * 1.4,
    height: width * 1.4,
    borderRadius: width * 0.7,
    backgroundColor: DARK_SURFACE,
    opacity: 0.5,
  },
  bgVioletHint: {
    position: 'absolute',
    top: -height * 0.1,
    left: -width * 0.2,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    backgroundColor: VIOLET_HINT,
  },

  // Radial glow
  glow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: MINT,
    opacity: 0,
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 90,
  },

  // Decorative rings
  ring1: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: MINT_SOFT,
  },
  ring2: {
    position: 'absolute',
    width: 440,
    height: 440,
    borderRadius: 220,
    borderWidth: 1,
    borderColor: MINT_RING,
  },

  // Center content
  centerContent: {
    alignItems: 'center',
  },

  logoCard: {
    width: 156,
    height: 156,
    borderRadius: 40,
    backgroundColor: DARK_SURFACE,
    borderWidth: 1,
    borderColor: 'rgba(45,212,160,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
    // Mint glow
    shadowColor: MINT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 28,
    elevation: 14,
  },

  arcWrap: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    borderRadius: 40,
  },

  logo: {
    width: 120,
    height: 120,
  },

  tagline: {
    color: MINT,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 3.2,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  subtitle: {
    color: 'rgba(228,251,242,0.40)',
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: 0.2,
    textAlign: 'center',
    paddingHorizontal: 44,
    lineHeight: 20,
    marginBottom: 24,
  },

  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(45,212,160,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,160,0.25)',
  },
  pillText: {
    color: MINT,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
  },

  // Bottom wordmark
  bottomBar: {
    position: 'absolute',
    bottom: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bottomAccent: {
    width: 20,
    height: 1,
    backgroundColor: MINT,
    opacity: 0.35,
  },
  bottomText: {
    color: 'rgba(228,251,242,0.28)',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },
});

export default SocialSplashScreen;