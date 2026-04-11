import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export const SplashScreen: React.FC = () => {
  const fadeAnim   = useRef(new Animated.Value(0)).current;
  const scaleAnim  = useRef(new Animated.Value(0.6)).current;
  const slideAnim  = useRef(new Animated.Value(30)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Fade + scale in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 2. Gentle pulse loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.06,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    });
  }, []);

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" backgroundColor="#FBBF24" />
      <LinearGradient
        colors={['#FEF3C7', '#FBBF24', '#D97706']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Background decorative circles */}
        <View style={[styles.circle, styles.circleTopLeft]}  />
        <View style={[styles.circle, styles.circleBottomRight]} />

        {/* Main content */}
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [
                { scale: Animated.multiply(scaleAnim, pulseAnim) },
                { translateY: slideAnim },
              ],
            },
          ]}
        >
          {/* Logo emoji */}
          <View style={styles.logoContainer}>
            <Text style={styles.logoEmoji}>🍌</Text>
          </View>

          {/* App name */}
          <Text style={styles.appName}>Banana</Text>
          <Text style={styles.tagline}>Your Career Platform</Text>
        </Animated.View>

        {/* Bottom version */}
        <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
          <Text style={styles.version}>v1.0.0</Text>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#92400E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  logoEmoji: {
    fontSize: 68,
  },
  appName: {
    fontSize: 48,
    fontWeight: '800',
    color: '#1C1917',
    letterSpacing: -1,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: '500',
    color: '#44403C',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 48,
  },
  version: {
    fontSize: 12,
    color: 'rgba(28,25,23,0.45)',
    fontWeight: '500',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  circleTopLeft: {
    width: 280,
    height: 280,
    top: -80,
    left: -80,
  },
  circleBottomRight: {
    width: 360,
    height: 360,
    bottom: -120,
    right: -100,
  },
});
