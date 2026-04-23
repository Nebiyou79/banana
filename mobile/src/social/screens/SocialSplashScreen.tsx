// src/social/screens/SocialSplashScreen.tsx
// Uses the real Banana logo from assets/logo.png
// Shows "Banana Social" branding with role-based gradient + smooth animations

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, StatusBar, Animated,
  Dimensions, Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../../store/authStore';
import type { SocialStackParamList } from '../navigation/types';

const { width, height } = Dimensions.get('window');

type Nav = NativeStackNavigationProp<SocialStackParamList>;

// Role → gradient pair (top-color / bottom-color)
const ROLE_GRADIENT: Record<string, [string, string, string]> = {
  candidate:    ['#050D1A', '#0D2137', '#1D3557'],
  freelancer:   ['#050D1A', '#062E1F', '#0A4B31'],
  company:      ['#050D1A', '#2A1D00', '#4A3200'],
  organization: ['#050D1A', '#1A0D35', '#2D1657'],
};

const ROLE_ACCENT: Record<string, string> = {
  candidate:    '#3B82F6',
  freelancer:   '#10B981',
  company:      '#F1BB03',
  organization: '#8B5CF6',
};

const ROLE_TAGLINE: Record<string, string> = {
  candidate:    'Your Career Network',
  freelancer:   'Your Freelance Hub',
  company:      'Your Hiring Network',
  organization: 'Your Professional Circle',
};

const SPLASH_MS = 1900;

export const SocialSplashScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const role = (useAuthStore(s => s.role) ?? 'candidate') as string;

  const accent  = ROLE_ACCENT[role]   ?? '#F1BB03';
  const tagline = ROLE_TAGLINE[role]  ?? 'Your Professional Network';
  const grad    = ROLE_GRADIENT[role] ?? ROLE_GRADIENT.candidate;

  // Animated values
  const logoScale   = useRef(new Animated.Value(0.5)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowScale   = useRef(new Animated.Value(0.8)).current;
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const titleY      = useRef(new Animated.Value(20)).current;
  const titleOp     = useRef(new Animated.Value(0)).current;
  const tagY        = useRef(new Animated.Value(16)).current;
  const tagOp       = useRef(new Animated.Value(0)).current;
  const badgeOp     = useRef(new Animated.Value(0)).current;
  const outro       = useRef(new Animated.Value(0)).current;

  // Particle dots (decorative bubbles around logo)
  const particleAnims = useRef(
    Array.from({ length: 6 }, () => ({
      scale:   new Animated.Value(0),
      opacity: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // Particles burst
    particleAnims.forEach((p, i) => {
      setTimeout(() => {
        Animated.parallel([
          Animated.spring(p.scale,   { toValue:1, tension:80, friction:6, useNativeDriver:true }),
          Animated.timing(p.opacity, { toValue:0.6, duration:400, useNativeDriver:true }),
        ]).start();
      }, 300 + i*80);
    });

    // Main sequence
    Animated.sequence([
      // Logo spring in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue:1, tension:70, friction:6, useNativeDriver:true }),
        Animated.timing(logoOpacity, { toValue:1, duration:400, useNativeDriver:true }),
        Animated.timing(glowOpacity, { toValue:1, duration:600, useNativeDriver:true }),
        Animated.spring(glowScale,   { toValue:1, tension:50, friction:8, useNativeDriver:true }),
      ]),
      // Title slides up
      Animated.parallel([
        Animated.spring(titleY, { toValue:0, tension:60, friction:8, useNativeDriver:true }),
        Animated.timing(titleOp, { toValue:1, duration:350, useNativeDriver:true }),
      ]),
      // Tagline + badge
      Animated.parallel([
        Animated.spring(tagY,   { toValue:0, tension:55, friction:8, useNativeDriver:true }),
        Animated.timing(tagOp,  { toValue:1, duration:320, useNativeDriver:true }),
        Animated.timing(badgeOp,{ toValue:1, duration:380, useNativeDriver:true }),
      ]),
    ]).start();

    // Outro + navigate
    const timer = setTimeout(() => {
      Animated.timing(outro, { toValue:1, duration:300, useNativeDriver:true }).start(() => {
        navigation.replace('SocialTabs');
      });
    }, SPLASH_MS);

    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue:1.08, duration:1400, useNativeDriver:true }),
        Animated.timing(glowScale, { toValue:0.96, duration:1400, useNativeDriver:true }),
      ])
    ).start();

    return () => clearTimeout(timer);
  }, []);

  const outerOpacity = outro.interpolate({ inputRange:[0,1], outputRange:[1,0] });

  // Particle positions (circle around logo)
  const PARTICLE_ANGLES = [0, 60, 120, 180, 240, 300];
  const PARTICLE_RADIUS = 90;

  return (
    <Animated.View style={[S.root, { opacity: outerOpacity, backgroundColor: grad[0] }]}>
      <StatusBar barStyle="light-content" backgroundColor={grad[0]} />

      {/* Layered background */}
      <View style={[S.bgLayer1, { backgroundColor: grad[1] }]} />
      <View style={[S.bgLayer2, { backgroundColor: grad[2] }]} />

      {/* Grid pattern overlay */}
      <View style={S.gridOverlay} />

      {/* Particles */}
      {particleAnims.map((p, i) => {
        const angle = (PARTICLE_ANGLES[i] * Math.PI) / 180;
        const px = Math.cos(angle) * PARTICLE_RADIUS;
        const py = Math.sin(angle) * PARTICLE_RADIUS;
        return (
          <Animated.View
            key={i}
            style={[S.particle, {
              backgroundColor: accent,
              left: width/2 + px - 5,
              top: height/2 - 60 + py - 5,
              opacity: p.opacity,
              transform: [{ scale: p.scale }],
            }]}
          />
        );
      })}

      {/* Centre content */}
      <View style={S.centre}>

        {/* Glow halo */}
        <Animated.View style={[S.halo, {
          backgroundColor: accent,
          transform: [{ scale: glowScale }],
          opacity: glowOpacity,
          shadowColor: accent,
        }]} />

        {/* Ring */}
        <Animated.View style={[S.ring, {
          borderColor: accent,
          transform: [{ scale: glowScale }],
          opacity: Animated.multiply(glowOpacity, 0.4 as any),
        }]} />

        {/* Logo */}
        <Animated.Image
          source={require('../../../assets/logo.png')}
          style={[S.logo, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}
          resizeMode="contain"
        />

        {/* "Banana Social" title */}
        <Animated.View style={{ opacity: titleOp, transform: [{ translateY: titleY }], alignItems:'center', marginTop:20 }}>
          <Text style={S.titleBanana}>Banana</Text>
          <Text style={[S.titleSocial, { color: accent }]}>Social</Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[S.tagline, { opacity: tagOp, transform:[{translateY:tagY}] }]}>
          {tagline}
        </Animated.Text>

      </View>

      {/* Bottom badge */}
      <Animated.View style={[S.badgeWrap, { opacity: badgeOp }]}>
        <View style={[S.badge, { borderColor: `${accent}40` }]}>
          <View style={[S.badgeDot, { backgroundColor: accent }]} />
          <Text style={[S.badgeTxt, { color: `${accent}DD` }]}>
            {role.charAt(0).toUpperCase() + role.slice(1)} Network
          </Text>
        </View>
      </Animated.View>

    </Animated.View>
  );
};

const S = StyleSheet.create({
  root: { flex:1, alignItems:'center', justifyContent:'center' },

  bgLayer1: { position:'absolute', top:0, left:0, right:0, bottom:0, opacity:0.7 },
  bgLayer2: { position:'absolute', bottom:0, left:0, right:0, height:height*0.4, opacity:0.5 },

  gridOverlay: {
    position:'absolute', top:0, left:0, right:0, bottom:0,
    opacity:0.04,
    // Visual grid via repeated background
  },

  particle: { position:'absolute', width:10, height:10, borderRadius:5 },

  centre: { alignItems:'center', flex:1, justifyContent:'center' },

  halo: {
    position:'absolute', width:200, height:200, borderRadius:100,
    opacity:0.15,
    shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:60, elevation:25,
  },
  ring: {
    position:'absolute', width:230, height:230, borderRadius:115,
    borderWidth:1,
  },

  logo: { width:160, height:160, zIndex:1 },

  titleBanana: { fontSize:40, fontWeight:'900', color:'#F8FAFC', letterSpacing:-0.5 },
  titleSocial: { fontSize:36, fontWeight:'900', letterSpacing:2, marginTop:-6 },

  tagline: {
    marginTop:12, fontSize:15,
    color:'rgba(255,255,255,0.55)',
    letterSpacing:0.5,
    textAlign:'center',
  },

  badgeWrap: { position:'absolute', bottom:56, left:0, right:0, alignItems:'center' },
  badge: {
    flexDirection:'row', alignItems:'center', gap:8,
    borderWidth:1, borderRadius:24,
    paddingHorizontal:18, paddingVertical:9,
    backgroundColor:'rgba(255,255,255,0.05)',
  },
  badgeDot: { width:8, height:8, borderRadius:4 },
  badgeTxt: { fontSize:13, fontWeight:'700', letterSpacing:0.5 },
});

export default SocialSplashScreen;