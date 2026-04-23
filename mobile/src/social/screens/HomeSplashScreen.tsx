// src/social/screens/HomeSplashScreen.tsx
// Uses real Banana logo asset. Beautiful animated transition.

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, Animated, Image, Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

const ROLE_ROOT: Record<string, string> = {
  candidate:    'CandidateRoot',
  freelancer:   'FreelancerRoot',
  company:      'CompanyRoot',
  organization: 'OrganizationRoot',
};

const ROLE_COLOR: Record<string, string> = {
  candidate:    '#3B82F6',
  freelancer:   '#10B981',
  company:      '#F1BB03',
  organization: '#8B5CF6',
};

const ROLE_LABEL: Record<string, string> = {
  candidate:    'Returning to Jobs',
  freelancer:   'Returning to Projects',
  company:      'Returning to Hiring',
  organization: 'Returning to Tenders',
};

export const HomeSplashScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const role = (useAuthStore(s => s.role) ?? 'candidate') as string;
  const accent = ROLE_COLOR[role] ?? '#F1BB03';
  const label  = ROLE_LABEL[role] ?? 'Returning…';

  const logoScale   = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const glowAnim    = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const barWidth    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Logo pops in
      Animated.parallel([
        Animated.spring(logoScale,   { toValue:1,   tension:70, friction:6, useNativeDriver:true }),
        Animated.timing(logoOpacity, { toValue:1,   duration:350, useNativeDriver:true }),
        Animated.timing(glowAnim,    { toValue:1,   duration:400, useNativeDriver:true }),
      ]),
      // Text fades in
      Animated.timing(textOpacity, { toValue:1, duration:300, useNativeDriver:true }),
      // Progress bar fills
      Animated.timing(barWidth,    { toValue:1, duration:700, useNativeDriver:false }),
    ]).start();

    // Navigate after 950ms
    const t = setTimeout(() => {
      Animated.timing(logoOpacity, { toValue:0, duration:200, useNativeDriver:true }).start(() => {
        try {
          navigation.getParent()?.getParent()?.reset({
            index:0, routes:[{ name: ROLE_ROOT[role] ?? 'CandidateRoot' }],
          });
        } catch {
          navigation.goBack();
        }
      });
    }, 950);

    return () => clearTimeout(t);
  }, []);

  const glowOpacity = glowAnim.interpolate({ inputRange:[0,1], outputRange:[0,0.2] });
  const barPx = barWidth.interpolate({ inputRange:[0,1], outputRange:[0, width*0.55] });

  return (
    <View style={[S.root, { backgroundColor:'#050D1A' }]}>
      {/* Ambient glow */}
      <Animated.View style={[S.ambient, { backgroundColor:accent, opacity:glowOpacity }]} />

      <Animated.View style={[S.card, { opacity:logoOpacity, transform:[{scale:logoScale}] }]}>
        {/* Glow ring */}
        <View style={[S.ring, { borderColor:`${accent}40` }]} />

        {/* Logo */}
        <Image
          source={require('../../../assets/logo.png')}
          style={S.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[S.bottom, { opacity:textOpacity }]}>
        <Text style={S.label}>{label}</Text>

        {/* Progress bar */}
        <View style={S.barTrack}>
          <Animated.View style={[S.barFill, { width:barPx, backgroundColor:accent }]} />
        </View>
      </Animated.View>
    </View>
  );
};

const S = StyleSheet.create({
  root: { flex:1, alignItems:'center', justifyContent:'center' },

  ambient: {
    position:'absolute', width:300, height:300, borderRadius:150,
    shadowColor:'#F1BB03', shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:60, elevation:20,
  },

  card: { alignItems:'center', justifyContent:'center', position:'relative' },

  ring: {
    position:'absolute', width:180, height:180, borderRadius:90,
    borderWidth:1.5,
  },

  logo: { width:140, height:140 },

  bottom: { position:'absolute', bottom:60, alignItems:'center', gap:14 },
  label:  { fontSize:14, color:'rgba(255,255,255,0.5)', letterSpacing:0.5 },

  barTrack: { width:width*0.55, height:3, borderRadius:2, backgroundColor:'rgba(255,255,255,0.08)', overflow:'hidden' },
  barFill:  { height:3, borderRadius:2 },
});

export default HomeSplashScreen;