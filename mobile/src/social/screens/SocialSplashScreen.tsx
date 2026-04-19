import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import type { SocialStackParamList } from '../navigation/types';
import {
  ROLE_COLORS,
  ROLE_SPLASH_LABELS,
} from '../theme/socialTheme';
import type { UserRole } from '../types';

const SPLASH_DURATION_MS = 1800;

/**
 * Role-gradient splash shown once on entering the Social tab. Smooth
 * Animated entrance: logo scale-in → title fade → tagline slide-up →
 * network-name badge fade. Auto-advances to SocialTabs after ~1.8s.
 */
const SocialSplashScreen: React.FC = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<SocialStackParamList>>();
  const role = (useAuthStore((s) => s.role) ?? 'candidate') as UserRole;
  const labels = ROLE_SPLASH_LABELS[role];
  const gradient = ROLE_COLORS[role].splashGradient;

  // Animated values
  const logoScale = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(24)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const outro = useRef(new Animated.Value(0)).current; // 0..1 for exit fade

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(titleOpacity, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(taglineY, {
          toValue: 0,
          duration: 320,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(badgeOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    const timer = setTimeout(() => {
      Animated.timing(outro, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        navigation.replace('SocialTabs');
      });
    }, SPLASH_DURATION_MS);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rootOpacity = outro.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });

  return (
    <Animated.View style={[styles.root, { opacity: rootOpacity }]}>
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.center}>
          <Animated.Text
            style={[
              styles.logo,
              {
                opacity: logoOpacity,
                transform: [{ scale: logoScale }],
              },
            ]}
          >
            🍌
          </Animated.Text>

          <Animated.Text
            style={[styles.title, { opacity: titleOpacity }]}
          >
            Banana Social
          </Animated.Text>

          <Animated.Text
            style={[
              styles.tagline,
              {
                opacity: taglineOpacity,
                transform: [{ translateY: taglineY }],
              },
            ]}
          >
            {labels.tagline}
          </Animated.Text>
        </View>

        <Animated.View style={[styles.badgeWrap, { opacity: badgeOpacity }]}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{labels.network}</Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  logo: { fontSize: 72, marginBottom: 16 },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.88)',
    marginTop: 12,
    textAlign: 'center',
    lineHeight: 21,
  },
  badgeWrap: {
    position: 'absolute',
    bottom: 64,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  badge: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    color: 'rgba(255,255,255,0.95)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});

export default SocialSplashScreen;