// src/social/components/ads/AdCard.tsx
import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFadeIn, usePressScale } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
import type { AdConfig } from '../../types';

interface Props {
  ad: AdConfig;
  onPress?: (ad: AdConfig) => void;
}

const AdCard: React.FC<Props> = memo(({ ad, onPress }) => {
  const theme = useSocialTheme();
  const { colors, spacing, radius, type, dark, withAlpha } = theme;
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);
  const opacity = useFadeIn(50, 250);

  const handlePress = () => onPress?.(ad);

  // Dark mode: vibrant primary accent
  // Light mode: clean accent
  const accentColor = colors.primary;
  const accentOpacity = dark ? 0.16 : 0.10;
  const borderAccentOpacity = dark ? 0.3 : 0.22;

  return (
    <Animated.View style={{ 
      transform: [{ scale }], 
      opacity, 
      marginHorizontal: spacing.md, 
      marginBottom: spacing.sm 
    }}>
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.92}
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: dark ? withAlpha(accentColor, 0.3) : colors.border,
            borderLeftColor: accentColor,
            borderRadius: radius.md,
            padding: spacing.md,
          },
        ]}
      >
        <View style={[styles.sponsoredRow, { marginBottom: spacing.sm }]}>
          <View style={[styles.sponsoredPill, {
            backgroundColor: withAlpha(accentColor, accentOpacity),
            borderColor: withAlpha(accentColor, borderAccentOpacity),
            borderRadius: radius.sm,
          }]}>
            <Text style={[styles.sponsored, { color: accentColor }]}>Sponsored</Text>
          </View>
        </View>

        <View style={[styles.body, { gap: spacing.sm, marginBottom: spacing.sm }]}>
          <View style={[styles.iconCircle, {
            backgroundColor: withAlpha(accentColor, accentOpacity),
            borderRadius: radius.sm,
          }]}>
            <Ionicons name={ad.icon as any} size={22} color={accentColor} />
          </View>
          <View style={styles.textBlock}>
            <Text style={[type.bodySm, { color: colors.text }]} numberOfLines={1}>
              {ad.title}
            </Text>
            <Text style={[type.bodySm, { color: colors.text, marginTop: 2 }]} numberOfLines={2}>
              {ad.subtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePress}
          style={[styles.cta, {
            backgroundColor: accentColor,
            borderRadius: radius.sm,
            paddingVertical: spacing.sm + 2,
            paddingHorizontal: spacing.md,
            minHeight: 44,
          }]}
          activeOpacity={0.85}
          accessibilityLabel={ad.ctaText}
          accessibilityRole="button"
        >
          <Text style={[type.caption, { color: '#FFFFFF' }]}>{ad.ctaText}</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

AdCard.displayName = 'AdCard';

const styles = StyleSheet.create({
  card: { 
    borderWidth: 1, 
    borderLeftWidth: 3, 
    overflow: 'hidden' 
  },
  sponsoredRow: {},
  sponsoredPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderWidth: StyleSheet.hairlineWidth,
  },
  sponsored: { 
    fontSize: 9, 
    textTransform: 'uppercase', 
    letterSpacing: 0.8, 
    fontWeight: '700' 
  },
  body: { 
    flexDirection: 'row', 
    alignItems: 'flex-start' 
  },
  iconCircle: { 
    width: 44, 
    height: 44, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexShrink: 0 
  },
  textBlock: { 
    flex: 1 
  },
  cta: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 6 
  },
});

export default AdCard;