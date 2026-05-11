import React, { memo, useRef, useEffect, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, Image, StyleSheet,
  Animated, ViewStyle, ActivityIndicator, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import type { FreelancerListItem, AvailabilityStatus } from '../../services/freelancerMarketplaceService';

interface FreelancerCardProps {
  freelancer: FreelancerListItem;
  onPress: () => void;
  onToggleShortlist?: () => void;
  isShortlistLoading?: boolean;
  style?: ViewStyle;
}

// ─── Availability config — no empty strings ───────────────────────────────────
const buildAvailabilityConfig = (c: any): Record<AvailabilityStatus, { label: string; color: string }> => ({
  available:       { label: 'Available',     color: c.success },
  busy:            { label: 'Busy',          color: c.warning },
  unavailable:     { label: 'Unavailable',   color: c.danger  },
  'part-time':     { label: 'Part-time',     color: c.warning },
  'not-available': { label: 'Not Available', color: c.danger  },
});

export const FreelancerCard: React.FC<FreelancerCardProps> = memo(
  ({ freelancer, onPress, onToggleShortlist, isShortlistLoading, style }) => {
    const { colors: c, radius, shadows, type, spacing } = useTheme();
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim  = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(6)).current;

    const styles = useMemo(() => makeStyles(c, radius, spacing, shadows), [c, radius, spacing, shadows]);
    const AVAILABILITY_CONFIG = useMemo(() => buildAvailabilityConfig(c), [c]);

    useEffect(() => {
      Animated.parallel([
        Animated.timing(fadeAnim,  { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }, []);

    const availability = (freelancer.availability ?? 'unavailable') as AvailabilityStatus;
    const avConfig = AVAILABILITY_CONFIG[availability] ?? AVAILABILITY_CONFIG.unavailable;
    const rating = freelancer.ratings?.average ?? 0;
    const ratingCount = freelancer.ratings?.count ?? 0;
    const skills = freelancer.skills?.slice(0, 3) ?? [];
    const initials = freelancer.user?.name
      ? freelancer.user.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2)
      : '?';

    return (
      <Animated.View style={[
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: scaleAnim }] },
      ]}>
        <Pressable
          onPress={onPress}
          onPressIn={() =>
            Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
          onPressOut={() =>
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, speed: 50, bounciness: 4 }).start()}
          style={[styles.card, style]}
          accessibilityRole="button"
          accessibilityLabel={`Freelancer: ${freelancer.user?.name ?? ''}`}
        >
          <View style={styles.topRow}>
            {freelancer.user?.avatar ? (
              <Image
                source={{ uri: freelancer.user.avatar }}
                style={styles.avatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={[styles.initials, { color: c.primary }]}>{initials}</Text>
              </View>
            )}

            {onToggleShortlist && (
              <TouchableOpacity
                onPress={onToggleShortlist}
                disabled={isShortlistLoading}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.saveBtn}
                accessibilityLabel={freelancer.isSaved ? 'Remove from shortlist' : 'Add to shortlist'}
                accessibilityRole="button"
              >
                {isShortlistLoading
                  ? <ActivityIndicator size="small" color={c.primary} />
                  : <Ionicons
                      name={freelancer.isSaved ? 'bookmark' : 'bookmark-outline'}
                      size={22}
                      color={freelancer.isSaved ? c.primary : c.textMuted}
                    />}
              </TouchableOpacity>
            )}
          </View>

          <Text style={[type.h3, styles.name, { color: c.text }]} numberOfLines={1}>
            {freelancer.user?.name ?? 'Freelancer'}
          </Text>
          {(freelancer.profession ?? freelancer.title) ? (
            <Text style={[type.bodySm, styles.profession, { color: c.textSecondary }]} numberOfLines={1}>
              {freelancer.profession ?? freelancer.title}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.ratingPill}>
              <Ionicons name="star" size={12} color="#FBBF24" />
              <Text style={[type.caption, { color: c.text, fontWeight: '700' }]}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </Text>
              {ratingCount > 0 && (
                <Text style={[type.caption, { color: c.textMuted }]}>({ratingCount})</Text>
              )}
            </View>
            {freelancer.hourlyRate ? (
              <Text style={[type.caption, { color: c.primary, fontWeight: '700' }]}>
                {freelancer.currency ?? '$'}{freelancer.hourlyRate}/hr
              </Text>
            ) : null}
          </View>

          <View style={[styles.availBadge, { backgroundColor: withAlpha(avConfig.color, 0.14) }]}>
            <View style={[styles.dot, { backgroundColor: avConfig.color }]} />
            <Text style={[type.caption, { color: avConfig.color, fontWeight: '600' }]}>
              {avConfig.label}
            </Text>
          </View>

          {skills.length > 0 && (
            <View style={styles.skillsRow}>
              {skills.map((skill: string) => (
                <View key={skill} style={[styles.skillChip, { backgroundColor: withAlpha(c.text, 0.07), borderColor: c.border }]}>
                  <Text style={[type.caption, { color: c.textSecondary, fontWeight: '500' }]} numberOfLines={1}>
                    {skill}
                  </Text>
                </View>
              ))}
              {(freelancer.skills?.length ?? 0) > 3 && (
                <Text style={[type.caption, { color: c.textMuted }]}>
                  +{(freelancer.skills?.length ?? 0) - 3}
                </Text>
              )}
            </View>
          )}

          {freelancer.user?.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color={c.textMuted} />
              <Text style={[type.caption, { color: c.textMuted }]} numberOfLines={1}>
                {freelancer.user.location}
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Animated.View>
    );
  },
);

FreelancerCard.displayName = 'FreelancerCard';

export const FreelancerCardSkeleton: React.FC = () => {
  const { colors: c, radius, shadows } = useTheme();
  const styles = useMemo(() => makeStyles(c, radius, {}, shadows), [c, radius, shadows]);
  return (
    <View style={styles.card}>
      <View style={[styles.skeletonLine, { width: 56, height: 56, borderRadius: 28, backgroundColor: c.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 14, marginTop: 10, backgroundColor: c.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 6, backgroundColor: c.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 10, marginTop: 8, backgroundColor: c.skeleton }]} />
    </View>
  );
};

const makeStyles = (c: any, radius: any, spacing: any, shadows: any) =>
  StyleSheet.create({
    card: {
      padding: 14,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.xl,
      backgroundColor: c.bgCard,
      ...shadows.sm,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 10,
    },
    avatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 1.5, borderColor: c.border },
    avatarPlaceholder: {
      width: 56, height: 56, borderRadius: 28,
      borderWidth: 1, borderColor: c.primary,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: withAlpha(c.primary, 0.12),
    },
    initials: { fontSize: 18, fontWeight: '700' },
    saveBtn: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', padding: 4 },
    name: { marginBottom: 2, fontWeight: '700' },
    profession: { marginBottom: 8, fontWeight: '500' },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
    availBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 12, marginBottom: 10, gap: 5,
    },
    dot: { width: 6, height: 6, borderRadius: 3 },
    skillsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
    skillChip: {
      paddingHorizontal: 8, paddingVertical: 3,
      borderRadius: 10, borderWidth: 1,
    },
    locationRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
    skeletonLine: { borderRadius: 6 },
  });