/**
 * mobile/src/components/products/ProductSkeleton.tsx
 * Loading placeholder for product cards. Used by both owner and public lists.
 * Two variants matching the two card sizes (md = full grid card, sm = horizontal rail).
 */
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export const ProductSkeleton: React.FC<Props> = ({ size = 'md', style }) => {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  const isSm = size === 'sm';
  const imgH = isSm ? 90 : 170;

  return (
    <View
      style={[
        s.card,
        { backgroundColor: colors.bgCard ?? colors.bgSurface, borderColor: colors.borderPrimary },
        style,
      ]}
    >
      <Animated.View
        style={[s.img, { height: imgH, backgroundColor: colors.skeleton, opacity }]}
      />
      <View style={s.body}>
        <Animated.View
          style={[s.line, { width: '60%', backgroundColor: colors.skeleton, opacity }]}
        />
        <Animated.View
          style={[s.line, { width: '90%', backgroundColor: colors.skeleton, opacity, marginTop: 8 }]}
        />
        <Animated.View
          style={[s.line, { width: '40%', backgroundColor: colors.skeleton, opacity, marginTop: 12, height: 14 }]}
        />
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, overflow: 'hidden' },
  img: { borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  body: { padding: 12 },
  line: { height: 10, borderRadius: 4 },
});