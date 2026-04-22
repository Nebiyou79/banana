// src/screens/auth/SplashScreen.tsx
// Premium splash: dark navy + glowing Banana logo + fade-in animation (no Reanimated)

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';

const { width, height } = Dimensions.get('window');

// Constellation dot helper
const Dot: React.FC<{ x: number; y: number; size?: number; opacity?: number }> = ({
  x, y, size = 3, opacity = 0.25,
}) => (
  <View style={[styles.dot, { left: x, top: y, width: size, height: size, opacity }]} />
);

// Static constellation lines (decorative)
const DOTS = [
  { x: 30,  y: 80,  s: 3,   o: 0.3 },
  { x: 100, y: 40,  s: 2,   o: 0.2 },
  { x: 200, y: 120, s: 4,   o: 0.35 },
  { x: 300, y: 60,  s: 2,   o: 0.2 },
  { x: 350, y: 180, s: 3,   o: 0.25 },
  { x: 60,  y: 250, s: 2,   o: 0.2 },
  { x: 280, y: 300, s: 3,   o: 0.3 },
  { x: 150, y: 400, s: 2,   o: 0.15 },
  { x: 320, y: 450, s: 4,   o: 0.25 },
  { x: 40,  y: 550, s: 2,   o: 0.2 },
  { x: 180, y: 600, s: 3,   o: 0.3 },
  { x: 340, y: 680, s: 2,   o: 0.2 },
  { x: 80,  y: 720, s: 3,   o: 0.25 },
];

export const SplashScreen: React.FC = () => {
  const glowAnim   = useRef(new Animated.Value(0)).current;
  const logoScale  = useRef(new Animated.Value(0.7)).current;
  const logoOpacity= useRef(new Animated.Value(0)).current;
  const textOpacity= useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const spinnerOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      // Tagline fade in
      Animated.timing(tagOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      // Spinner
      Animated.timing(spinnerOp, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1400, useNativeDriver: true }),
      ]),
    ).start();
  }, []);

  const glowScale   = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.08] });
  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.9] });

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#050D1A" />

      {/* Constellation dots */}
      {DOTS.map((d, i) => (
        <Dot key={i} x={d.x} y={d.y} size={d.s} opacity={d.o} />
      ))}

      {/* Gradient circles for depth */}
      <View style={[styles.glowCircle, styles.glowTL]} />
      <View style={[styles.glowCircle, styles.glowBR]} />

      {/* Main content */}
      <View style={styles.content}>
        {/* Glow halo behind logo */}
        <Animated.View
          style={[
            styles.halo,
            {
              transform:  [{ scale: glowScale }],
              opacity:    glowOpacity,
            },
          ]}
        />

        {/* Logo */}
        <Animated.View
          style={{
            transform: [{ scale: logoScale }],
            opacity:   logoOpacity,
            alignItems: 'center',
          }}
        >
          <View style={styles.logoWrap}>
            <Text style={styles.logoEmoji}>🍌</Text>
            <View style={styles.briefcaseOverlay}>
              <Text style={styles.briefcaseEmoji}>💼</Text>
            </View>
          </View>
        </Animated.View>

        {/* App name */}
        <Animated.View style={{ opacity: textOpacity, alignItems: 'center', marginTop: 20 }}>
          <Text style={styles.appName}>Banana</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View style={{ opacity: tagOpacity }}>
          <Text style={styles.tagline}>Connecting Professionals</Text>
        </Animated.View>
      </View>

      {/* Spinner + version */}
      <Animated.View style={[styles.bottom, { opacity: spinnerOp }]}>
        <View style={styles.spinner}>
          <View style={styles.spinnerArc} />
        </View>
        <Text style={styles.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const NAVY = '#050D1A';
const GOLD = '#F1BB03';
const NAVY2 = '#0A1628';

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: NAVY,
    justifyContent:  'center',
    alignItems:      'center',
  },

  // Constellation
  dot: {
    position:     'absolute',
    borderRadius: 99,
    backgroundColor: '#F1BB03',
  },

  // Deep glow circles
  glowCircle: {
    position:     'absolute',
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth:  1,
    borderColor:  'rgba(241,187,3,0.06)',
  },
  glowTL: {
    width: 300, height: 300,
    top: -100, left: -100,
    borderColor: 'rgba(59,130,246,0.06)',
  },
  glowBR: {
    width: 400, height: 400,
    bottom: -150, right: -130,
    borderColor: 'rgba(241,187,3,0.05)',
  },

  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },

  // Glow halo
  halo: {
    position:        'absolute',
    width:           200,
    height:          200,
    borderRadius:    100,
    backgroundColor: GOLD,
    opacity:         0.18,
    // Spread the blur via outer shadow trick on iOS
    shadowColor:     GOLD,
    shadowOffset:    { width: 0, height: 0 },
    shadowOpacity:   0.9,
    shadowRadius:    60,
    elevation:       30,
  },

  logoWrap: {
    width:          130,
    height:         130,
    position:       'relative',
    alignItems:     'center',
    justifyContent: 'center',
  },
  logoEmoji: {
    fontSize:  90,
    position:  'absolute',
    bottom:    0,
    left:      0,
  },
  briefcaseOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  briefcaseEmoji: {
    fontSize: 64,
  },

  appName: {
    fontSize:      48,
    fontWeight:    '900',
    color:         GOLD,
    letterSpacing: -1,
  },
  tagline: {
    fontSize:      14,
    color:         'rgba(241,187,3,0.65)',
    letterSpacing: 1.5,
    marginTop:     6,
    textTransform: 'uppercase',
  },

  bottom: {
    position:   'absolute',
    bottom:     48,
    alignItems: 'center',
    gap:        12,
  },
  spinner: {
    width:       32,
    height:      32,
    borderRadius: 16,
    borderWidth:  2.5,
    borderColor:  'rgba(241,187,3,0.15)',
    borderTopColor: GOLD,
  },
  spinnerArc: {},
  version: {
    fontSize: 12,
    color:    'rgba(241,187,3,0.35)',
  },
});

export default SplashScreen;