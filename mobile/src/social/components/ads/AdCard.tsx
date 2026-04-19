import { Ionicons } from '@expo/vector-icons';
import React, { memo } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFadeIn, usePressScale } from '../../theme/animations';
import { useSocialTheme } from '../../theme/socialTheme';
import type { AdConfig } from '../../types';

interface Props {
  ad: AdConfig;
  onPress?: (ad: AdConfig) => void;
}

/**
 * Sponsored card tuned to the current role's palette. CTA label routes
 * into an in-app destination via `ad.ctaRoute` — never an external purchase.
 */
const AdCard: React.FC<Props> = memo(({ ad, onPress }) => {
  const theme = useSocialTheme();
  const { scale, onPressIn, onPressOut } = usePressScale(0.97);
  const opacity = useFadeIn(50, 250);

  const handlePress = () => onPress?.(ad);

  return (
    <Animated.View
      style={{ transform: [{ scale }], opacity, marginBottom: 8 }}
    >
      <TouchableOpacity
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={[
          styles.card,
          {
            backgroundColor: theme.dark ? theme.cardAlt : theme.adBg,
            borderColor: theme.adBorder,
            borderTopColor: theme.border,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.sponsoredRow}>
          <Text style={[styles.sponsored, { color: theme.muted }]}>
            Sponsored
          </Text>
        </View>

        <View style={styles.body}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${theme.primary}22` },
            ]}
          >
            <Ionicons name={ad.icon as any} size={22} color={theme.primary} />
          </View>

          <View style={styles.textBlock}>
            <Text
              style={[styles.title, { color: theme.text }]}
              numberOfLines={2}
            >
              {ad.title}
            </Text>
            <Text
              style={[styles.subtitle, { color: theme.subtext }]}
              numberOfLines={2}
            >
              {ad.subtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handlePress}
          style={[styles.cta, { backgroundColor: theme.primary }]}
          activeOpacity={0.85}
          accessibilityLabel={ad.ctaText}
        >
          <Text style={styles.ctaText}>{ad.ctaText}</Text>
          <Ionicons name="arrow-forward" size={15} color="#fff" />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

AdCard.displayName = 'AdCard';

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderWidth: 1,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
  },
  sponsoredRow: { marginBottom: 8 },
  sponsored: {
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  body: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 18 },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  ctaText: { color: '#fff', fontSize: 13, fontWeight: '700' },
});

export default AdCard;