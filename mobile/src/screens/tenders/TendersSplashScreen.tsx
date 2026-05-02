// ─────────────────────────────────────────────────────────────────────────────
//  src/screens/tenders/TendersSplashScreen.tsx
// ─────────────────────────────────────────────────────────────────────────────
//  Brief branded loading screen shown when the user enters the Tenders tab.
//
//  Auto-dismisses to TendersHome after ~900ms.
//  Tap anywhere to skip immediately.
//  Spec: "auto-dismiss after a brief loading period (or be skippable)".
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeStore } from '../../store/themeStore';

// ═════════════════════════════════════════════════════════════════════════════
//  CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const AUTO_DISMISS_MS = 900;
const PROGRESS_MS = 800;

// ═════════════════════════════════════════════════════════════════════════════
//  SCREEN
// ═════════════════════════════════════════════════════════════════════════════

export const TendersSplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const isDark = useThemeStore((s) => s.theme.isDark);

  const palette = isDark
    ? { bg: '#0F172A', surface: '#1E293B', accent: '#60A5FA', text: '#F1F5F9', muted: '#94A3B8', track: '#1E293B' }
    : { bg: '#F8FAFC', surface: '#FFFFFF', accent: '#2563EB', text: '#0F172A', muted: '#64748B', track: '#E2E8F0' };

  const progress = useRef(new Animated.Value(0)).current;
  const fadeIn   = useRef(new Animated.Value(0)).current;
  const dismissed = useRef(false);

  const goHome = useCallback(() => {
    if (dismissed.current) return;
    dismissed.current = true;
    navigation.replace?.('TendersHome');
  }, [navigation]);

  useEffect(() => {
    // Fade in the icon and text
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 220,
      useNativeDriver: true,
      easing: Easing.out(Easing.quad),
    }).start();

    // Drive the progress bar
    Animated.timing(progress, {
      toValue: 1,
      duration: PROGRESS_MS,
      useNativeDriver: false,
      easing: Easing.inOut(Easing.quad),
    }).start();

    // Auto-dismiss
    const timer = setTimeout(goHome, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [fadeIn, progress, goHome]);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Pressable onPress={goHome} style={{ flex: 1 }} accessibilityLabel="Skip splash">
      <SafeAreaView style={[styles.root, { backgroundColor: palette.bg }]}>
        <View style={styles.center}>
          <Animated.View style={[styles.brand, { opacity: fadeIn }]}>
            <View style={[styles.iconWrap, { backgroundColor: palette.accent }]}>
              <Ionicons name="document-text" size={42} color="#FFFFFF" />
            </View>
            <Text style={[styles.title, { color: palette.text }]}>Tender Center</Text>
            <Text style={[styles.tagline, { color: palette.muted }]}>
              Procurement, professional & freelance.
            </Text>
          </Animated.View>

          {/* Progress bar */}
          <View style={[styles.track, { backgroundColor: palette.track }]}>
            <Animated.View
              style={[styles.bar, { width: progressWidth, backgroundColor: palette.accent }]}
            />
          </View>

          <Text style={[styles.skipHint, { color: palette.muted }]}>
            Tap anywhere to skip
          </Text>
        </View>
      </SafeAreaView>
    </Pressable>
  );
};

// ═════════════════════════════════════════════════════════════════════════════
//  STYLES
// ═════════════════════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 28,
  },
  brand: {
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 96, height: 96,
    borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  title:   { fontSize: 22, fontWeight: '800', letterSpacing: 0.3 },
  tagline: { fontSize: 13, fontWeight: '500' },

  track: {
    width: 220,
    height: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 999,
  },

  skipHint: { fontSize: 11, fontStyle: 'italic' },
});

export default TendersSplashScreen;
