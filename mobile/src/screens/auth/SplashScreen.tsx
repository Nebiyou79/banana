// src/screens/auth/SplashScreen.tsx
// Uses the real Banana logo from assets/logo.png
// Dark navy background, constellation dots, gold glow halo, spring entrance

import React, { useEffect, useRef } from 'react';
import {
  View, StyleSheet, StatusBar, Animated,
  Dimensions, Image, Text,
} from 'react-native';

const { width, height } = Dimensions.get('window');

const NAVY = '#050D1A';
const GOLD = '#F1BB03';

// Constellation dots (decorative)
const DOTS = [
  [30, 80], [100, 40], [200, 120], [300, 60], [350, 180],
  [60, 250], [280, 300], [150, 400], [320, 450],
  [40, 550], [180, 600], [340, 680], [80, 720],
];

// Connection lines between some dot pairs (decorative)
const LINES = [
  { x1:30,y1:80,  x2:100,y2:40  },
  { x1:100,y1:40, x2:200,y2:120 },
  { x1:200,y1:120,x2:300,y2:60  },
  { x1:300,y1:60, x2:350,y2:180 },
  { x1:280,y1:300,x2:320,y2:450 },
];

export const SplashScreen: React.FC = () => {
  const glowScale   = useRef(new Animated.Value(0.85)).current;
  const glowOpacity = useRef(new Animated.Value(0.3)).current;
  const logoScale   = useRef(new Animated.Value(0.6)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const tagOpacity  = useRef(new Animated.Value(0)).current;
  const spinnerOp   = useRef(new Animated.Value(0)).current;
  const dotsOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Dots fade in
    Animated.timing(dotsOpacity, { toValue:1, duration:800, useNativeDriver:true }).start();

    // Main sequence
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale,   { toValue:1,   tension:60, friction:7, useNativeDriver:true }),
        Animated.timing(logoOpacity, { toValue:1,   duration:500, useNativeDriver:true }),
      ]),
      Animated.timing(textOpacity,  { toValue:1, duration:350, useNativeDriver:true }),
      Animated.timing(tagOpacity,   { toValue:1, duration:300, useNativeDriver:true }),
      Animated.timing(spinnerOp,    { toValue:1, duration:300, useNativeDriver:true }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(glowScale,   { toValue:1.12, duration:1600, useNativeDriver:true }),
          Animated.timing(glowOpacity, { toValue:0.7,  duration:1600, useNativeDriver:true }),
        ]),
        Animated.parallel([
          Animated.timing(glowScale,   { toValue:0.85, duration:1600, useNativeDriver:true }),
          Animated.timing(glowOpacity, { toValue:0.3,  duration:1600, useNativeDriver:true }),
        ]),
      ]),
    ).start();
  }, []);

  return (
    <View style={S.root}>
      <StatusBar barStyle="light-content" backgroundColor={NAVY} />

      {/* Constellation layer */}
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: dotsOpacity }]}>
        {/* Dots */}
        {DOTS.map(([x, y], i) => (
          <View key={`d${i}`} style={[S.dot, { left:x, top:y, opacity: 0.2 + (i%3)*0.08 }]} />
        ))}
        {/* Lines */}
        {LINES.map((l, i) => {
          const dx = l.x2 - l.x1;
          const dy = l.y2 - l.y1;
          const len = Math.sqrt(dx*dx + dy*dy);
          const angle = Math.atan2(dy, dx) * (180/Math.PI);
          return (
            <View key={`l${i}`} style={[S.line, {
              width: len, left: l.x1, top: l.y1,
              transform: [{ rotate: `${angle}deg` }],
            }]} />
          );
        })}
      </Animated.View>

      {/* Corner glow blobs */}
      <View style={[S.blob, { top:-100, right:-80, backgroundColor:'rgba(241,187,3,0.06)' }]} />
      <View style={[S.blob, { bottom:-120, left:-100, backgroundColor:'rgba(59,130,246,0.05)', width:350, height:350 }]} />

      {/* Centre content */}
      <View style={S.centre}>
        {/* Glow halo behind logo */}
        <Animated.View style={[S.halo, { transform:[{scale:glowScale}], opacity:glowOpacity }]} />

        {/* Logo image */}
        <Animated.View style={[S.logoWrap, { opacity:logoOpacity, transform:[{scale:logoScale}] }]}>
          <Image
            source={require('../../../assets/logo.png')}
            style={S.logoImg}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.Text style={[S.tagline, { opacity:tagOpacity }]}>
          Connecting Professionals
        </Animated.Text>
      </View>

      {/* Bottom spinner + version */}
      <Animated.View style={[S.bottom, { opacity:spinnerOp }]}>
        <View style={S.spinner} />
        <Text style={S.version}>v1.0.0</Text>
      </Animated.View>
    </View>
  );
};

const S = StyleSheet.create({
  root: { flex:1, backgroundColor:NAVY, alignItems:'center', justifyContent:'center' },

  // Constellation
  dot:  { position:'absolute', width:4, height:4, borderRadius:2, backgroundColor:GOLD },
  line: { position:'absolute', height:1, backgroundColor:'rgba(241,187,3,0.18)', transformOrigin:'0 0' },

  // Blobs
  blob: { position:'absolute', width:300, height:300, borderRadius:999 },

  // Centre
  centre: { alignItems:'center', flex:1, justifyContent:'center' },
  halo: {
    position:'absolute', width:220, height:220, borderRadius:110,
    backgroundColor:GOLD, opacity:0.15,
    shadowColor:GOLD, shadowOffset:{width:0,height:0}, shadowOpacity:1, shadowRadius:80, elevation:30,
  },
  logoWrap: { alignItems:'center', justifyContent:'center' },
  logoImg:  { width:200, height:200 },

  tagline: {
    marginTop:8, fontSize:14, color:'rgba(241,187,3,0.6)',
    letterSpacing:2, textTransform:'uppercase',
  },

  // Bottom
  bottom: { position:'absolute', bottom:48, alignItems:'center', gap:10 },
  spinner: {
    width:32, height:32, borderRadius:16,
    borderWidth:2.5,
    borderColor:'rgba(241,187,3,0.15)',
    borderTopColor:GOLD,
  },
  version: { fontSize:12, color:'rgba(241,187,3,0.35)' },
});

export default SplashScreen;