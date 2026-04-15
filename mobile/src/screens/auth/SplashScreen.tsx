// src/screens/SplashScreen.tsx
// Static, zero-animation splash. Works without Reanimated.

import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export const SplashScreen: React.FC = () => {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" backgroundColor="#F1BB03" />
      <LinearGradient
        colors={['#FEF3C7', '#F1BB03', '#D97706']}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circleTopLeft]} />
        <View style={[styles.circle, styles.circleBottomRight]} />

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.logoBg}>
            <Text style={styles.logoEmoji}>🍌</Text>
          </View>
          <Text style={styles.appName}>Banana</Text>
          <Text style={styles.tagline}>Your Career Platform</Text>
        </View>

        {/* Version */}
        <Text style={styles.version}>v1.0.0</Text>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  root:     { flex: 1 },
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  circle: {
    position:        'absolute',
    borderRadius:    9999,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  circleTopLeft: {
    width:  280,
    height: 280,
    top:    -80,
    left:   -80,
  },
  circleBottomRight: {
    width:  360,
    height: 360,
    bottom: -120,
    right:  -100,
  },

  content: {
    alignItems: 'center',
  },
  logoBg: {
    width:           120,
    height:          120,
    borderRadius:    36,
    backgroundColor: 'rgba(255,255,255,0.35)',
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    24,
    shadowColor:     '#92400E',
    shadowOffset:    { width: 0, height: 8 },
    shadowOpacity:   0.22,
    shadowRadius:    16,
    elevation:       10,
  },
  logoEmoji: { fontSize: 64 },
  appName: {
    fontSize:      46,
    fontWeight:    '800',
    color:         '#1C1917',
    letterSpacing: -1,
    marginBottom:  6,
  },
  tagline: {
    fontSize:      16,
    fontWeight:    '500',
    color:         '#44403C',
    letterSpacing: 0.5,
  },
  version: {
    position:  'absolute',
    bottom:    48,
    fontSize:  12,
    color:     'rgba(28,25,23,0.40)',
    fontWeight:'500',
  },
});

export default SplashScreen;
