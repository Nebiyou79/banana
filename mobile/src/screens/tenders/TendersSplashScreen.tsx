// src/screens/tenders/TendersSplashScreen.tsx
// ─── Banana Tenders Splash Screen ─────────────────────────────────────────────
// tenderlogo.png has a transparent background (black removed).
// Logo is displayed directly — no card wrapper — so it composites cleanly
// over the dark navy background. Tap anywhere to skip.

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';

const { width, height } = Dimensions.get('window');

const AUTO_DISMISS_MS = 1300;
const PROGRESS_MS     = 1100;

const DARK = {
  bg:      '#050D1A',
  gold:    '#F1BB03',
  goldDim: 'rgba(241,187,3,0.16)',
  goldBdr: 'rgba(241,187,3,0.30)',
  track:   'rgba(255,255,255,0.10)',
  text:    '#F8FAFC',
  muted:   '#64748B',
  dot:     'rgba(241,187,3,0.22)',
};

const LIGHT = {
  bg:      '#0D1B2E',   // keep dark even in "light" mode so transparent logo shows
  gold:    '#F1BB03',
  goldDim: 'rgba(241,187,3,0.16)',
  goldBdr: 'rgba(241,187,3,0.30)',
  track:   'rgba(255,255,255,0.10)',
  text:    '#F8FAFC',
  muted:   '#94A3B8',
  dot:     'rgba(241,187,3,0.22)',
};

const DOTS: [number, number, number][] = [
  [24, 85, 3],  [112, 38, 4], [298, 68, 3], [352, 188, 4],
  [48, 315, 3], [268, 295, 4],[128, 495, 3],[318, 525, 4],
  [78, 685, 3], [248, 705, 3],[42, 205, 2], [382, 405, 2],
  [170, 150, 3],[330, 360, 2],[60, 540, 3], [200, 620, 2],
];

// Constellation lines
const LINES = [
  { x1: 24,  y1: 85,  x2: 112, y2: 38  },
  { x1: 112, y1: 38,  x2: 298, y2: 68  },
  { x1: 298, y1: 68,  x2: 352, y2: 188 },
  { x1: 268, y1: 295, x2: 318, y2: 525 },
  { x1: 128, y1: 495, x2: 268, y2: 295 },
];

export const TendersSplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark     = useThemeStore((s) => s.theme.isDark);
  const p          = isDark ? DARK : LIGHT;

  const logoScale   = useRef(new Animated.Value(0.65)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale   = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const tagY        = useRef(new Animated.Value(18)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const progress    = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;
  const fadeIn      = useRef(new Animated.Value(0)).current;
  const dismissed   = useRef(false);

  const goHome = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    navigation.replace?.('TendersHome');
  }, [navigation]);

  useEffect(() => {
    Animated.timing(dotsOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();

    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue: 1, tension: 60, friction: 7, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 420, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 550, useNativeDriver: true }),
        Animated.spring(glowScale,   { toValue: 1, tension: 50, friction: 8, useNativeDriver: true }),
        Animated.timing(fadeIn,      { toValue: 1, duration: 320, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.spring(tagY,       { toValue: 0, tension: 58, friction: 8, useNativeDriver: true }),
        Animated.timing(tagOpacity, { toValue: 1, duration: 340, useNativeDriver: true }),
      ]),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.12, duration: 1700, useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 0.94, duration: 1700, useNativeDriver: true }),
      ]),
    ).start();

    Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_MS,
      useNativeDriver: false,
      easing: Easing.out(Easing.cubic),
    }).start();

    const timer = setTimeout(goHome, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <Pressable onPress={goHome} style={{ flex: 1 }} accessibilityLabel="Skip splash">
      <View style={[S.root, { backgroundColor: p.bg }]}>
        <StatusBar barStyle="light-content" backgroundColor={p.bg} />

        {/* Constellation dots */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: dotsOpacity }]}>
          {DOTS.map(([x, y, size], i) => (
            <View key={`d${i}`} style={[S.dot, {
              left: x, top: y,
              width: size, height: size,
              borderRadius: size / 2,
              backgroundColor: p.dot,
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
                backgroundColor: 'rgba(241,187,3,0.12)',
                transform: [{ rotate: `${angle}deg` }],
              }]} />
            );
          })}
        </Animated.View>

        {/* Corner atmosphere blobs */}
        <View style={[S.blob, { top: -80, right: -80, backgroundColor: p.goldDim }]} />
        <View style={[S.blob, {
          bottom: -100, left: -80,
          backgroundColor: 'rgba(241,187,3,0.08)',
          width: 340, height: 340,
        }]} />

        <View style={S.center}>

          {/* Pulsing gold glow halo — sits behind logo */}
          <Animated.View style={[S.halo, {
            backgroundColor: p.gold,
            transform: [{ scale: glowScale }],
            opacity: glowOpacity,
          }]} />

          {/* Ring border around logo area */}
          <Animated.View style={[S.ring, {
            borderColor: p.goldBdr,
            transform: [{ scale: glowScale }],
            opacity: Animated.multiply(glowOpacity, 0.5 as any),
          }]} />

          {/*
            Logo — transparent background, displayed directly on dark bg.
            Animated.View wraps plain Image (avoids Android Animated.Image clip bug).
          */}
          <Animated.View style={[S.logoWrap, {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          }]}>
            <Image
              source={require('../../../assets/tenderlogo.png')}
              style={S.logoImg}
              resizeMode="contain"
            />
          </Animated.View>

          {/* Text block */}
          <Animated.View style={[S.textBlock, {
            opacity: tagOpacity,
            transform: [{ translateY: tagY }],
          }]}>
            <View style={[S.chip, { backgroundColor: p.goldDim, borderColor: p.goldBdr }]}>
              <View style={[S.chipDot, { backgroundColor: p.gold }]} />
              <Text style={[S.chipText, { color: p.gold }]}>TENDER CENTER</Text>
            </View>
            <Text style={[S.title, { color: p.text }]}>Banana Tenders</Text>
            <Text style={[S.subtitle, { color: p.muted }]}>
              Procurement · Professional · Freelance
            </Text>
          </Animated.View>

          {/* Progress bar + skip hint */}
          <Animated.View style={[S.progressWrap, { opacity: fadeIn }]}>
            <View style={[S.track, { backgroundColor: p.track }]}>
              <Animated.View style={[S.bar, { width: progressWidth, backgroundColor: p.gold }]} />
            </View>
            <Text style={[S.skip, { color: p.muted }]}>Tap anywhere to skip</Text>
          </Animated.View>

        </View>
      </View>
    </Pressable>
  );
};

const S = StyleSheet.create({
  root: { flex: 1 },
  dot:  { position: 'absolute' },
  line: { position: 'absolute', height: 1 },
  blob: { position: 'absolute', width: 280, height: 280, borderRadius: 999 },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 24,
  },

  halo: {
    position: 'absolute',
    width: 260, height: 260,
    borderRadius: 130,
    opacity: 0.14,
  },
  ring: {
    position: 'absolute',
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 1,
  },

  // Outer animated view — no overflow clip, no background
  logoWrap: {
    width: 280,
    height: 187,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  logoImg: {
    width: 280,
    height: 187,
  },

  textBlock: { alignItems: 'center', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 999, borderWidth: 1,
  },
  chipDot:  { width: 6, height: 6, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  title:    { fontSize: 28, fontWeight: '900', letterSpacing: -0.3, textAlign: 'center' },
  subtitle: { fontSize: 13, fontWeight: '500', textAlign: 'center', letterSpacing: 0.3 },

  progressWrap: { alignItems: 'center', gap: 10 },
  track: { width: 200, height: 3, borderRadius: 999, overflow: 'hidden' },
  bar:   { height: '100%', borderRadius: 999 },
  skip:  { fontSize: 11, fontStyle: 'italic' },
});

export default TendersSplashScreen;