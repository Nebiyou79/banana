// src/components/products/ProductSkeleton.tsx
// Loading placeholder for product cards. md = full grid card, sm = horizontal rail.

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const ProductSkeleton: React.FC<Props> = ({ size = 'md', style }) => {
  const { colors: c, radius } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const isSm = size === 'sm';
  const imgH = isSm ? 90 : 170;

  return (
    <View style={[s.card, { backgroundColor: c.bgCard, borderColor: c.border, borderRadius: radius.lg }, style]}>
      <Animated.View style={[
        s.img,
        {
          height: imgH,
          backgroundColor: c.skeleton,
          borderTopLeftRadius: radius.lg,
          borderTopRightRadius: radius.lg,
          opacity,
        },
      ]} />
      <View style={[s.body, { padding: isSm ? 8 : 12 }]}>
        <Animated.View style={[s.line, { width: '60%', backgroundColor: c.skeleton, opacity }]} />
        <Animated.View style={[s.line, { width: '90%', backgroundColor: c.skeleton, opacity, marginTop: 8 }]} />
        <Animated.View style={[s.line, { width: '40%', height: 14, backgroundColor: c.skeleton, opacity, marginTop: 12 }]} />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: { borderWidth: 1, overflow: 'hidden' },
  img:  {},
  body: {},
  line: { height: 10, borderRadius: 4 },
});

export default ProductSkeleton;