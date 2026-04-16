/**
 * mobile/src/components/freelancers/FreelancerCard.tsx
 *
 * Reusable card for a freelancer list item.
 * Shows avatar, name, profession, rating, hourly rate, availability badge,
 * skills, and an optional "Saved" bookmark icon.
 * Used by: FreelancerMarketplaceScreen, ShortlistScreen
 */

import React, { memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { FreelancerListItem, AvailabilityStatus } from '../../services/freelancerMarketplaceService';

// ─── Availability config ──────────────────────────────────────────────────────

const AVAILABILITY_CONFIG: Record<
  AvailabilityStatus,
  { label: string; color: string }
> = {
  available:   { label: 'Available',   color: '#22C55E' },
  busy:        { label: 'Busy',        color: '#F59E0B' },
  unavailable: { label: 'Unavailable', color: '#EF4444' },
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface FreelancerCardProps {
  freelancer: FreelancerListItem;
  onPress: () => void;
  onToggleShortlist?: () => void;
  isShortlistLoading?: boolean;
  style?: ViewStyle;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FreelancerCard: React.FC<FreelancerCardProps> = memo(
  ({ freelancer, onPress, onToggleShortlist, isShortlistLoading, style }) => {
    const { theme } = useThemeStore();
    const { colors, borderRadius, spacing, shadows } = theme;

    const availability = freelancer.availability ?? 'unavailable';
    const avConfig = AVAILABILITY_CONFIG[availability];
    const rating = freelancer.ratings?.average ?? 0;
    const ratingCount = freelancer.ratings?.count ?? 0;
    const skills = freelancer.skills?.slice(0, 3) ?? [];

    const initials = freelancer.user?.name
      ? freelancer.user.name
          .split(' ')
          .map((w) => w[0])
          .join('')
          .toUpperCase()
          .slice(0, 2)
      : '?';

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.xl,
            ...shadows.sm,
          },
          style,
        ]}
      >
        {/* ── Top Row: Avatar + Save ── */}
        <View style={styles.topRow}>
          {/* Avatar */}
          {freelancer.user?.avatar ? (
            <Image
              source={{ uri: freelancer.user.avatar }}
              style={[styles.avatar, { borderColor: colors.border }]}
            />
          ) : (
            <View
              style={[
                styles.avatarPlaceholder,
                { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44' },
              ]}
            >
              <Text style={[styles.initials, { color: colors.primary }]}>
                {initials}
              </Text>
            </View>
          )}

          {/* Save button */}
          {onToggleShortlist && (
            <TouchableOpacity
              onPress={onToggleShortlist}
              disabled={isShortlistLoading}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.saveBtn}
            >
              <Ionicons
                name={freelancer.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={freelancer.isSaved ? colors.primary : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>

        {/* ── Name + Profession ── */}
        <Text
          style={[styles.name, { color: colors.text }]}
          numberOfLines={1}
        >
          {freelancer.user?.name ?? 'Freelancer'}
        </Text>
        {(freelancer.profession ?? freelancer.title) ? (
          <Text
            style={[styles.profession, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {freelancer.profession ?? freelancer.title}
          </Text>
        ) : null}

        {/* ── Rating + Rate ── */}
        <View style={styles.metaRow}>
          <View style={styles.ratingPill}>
            <Ionicons name="star" size={12} color="#FBBF24" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </Text>
            {ratingCount > 0 && (
              <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                ({ratingCount})
              </Text>
            )}
          </View>

          {freelancer.hourlyRate ? (
            <Text style={[styles.rate, { color: colors.primary }]}>
              {freelancer.currency ?? '$'}
              {freelancer.hourlyRate}/hr
            </Text>
          ) : null}
        </View>

        {/* ── Availability badge ── */}
        <View
          style={[
            styles.availBadge,
            { backgroundColor: avConfig.color + '1A' },
          ]}
        >
          <View
            style={[styles.dot, { backgroundColor: avConfig.color }]}
          />
          <Text style={[styles.availText, { color: avConfig.color }]}>
            {avConfig.label}
          </Text>
        </View>

        {/* ── Skills chips ── */}
        {skills.length > 0 && (
          <View style={styles.skillsRow}>
            {skills.map((skill) => (
              <View
                key={skill}
                style={[
                  styles.skillChip,
                  { backgroundColor: colors.inputBg, borderColor: colors.border },
                ]}
              >
                <Text
                  style={[styles.skillText, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {skill}
                </Text>
              </View>
            ))}
            {(freelancer.skills?.length ?? 0) > 3 && (
              <Text style={[styles.moreSkills, { color: colors.textMuted }]}>
                +{(freelancer.skills?.length ?? 0) - 3}
              </Text>
            )}
          </View>
        )}

        {/* ── Location ── */}
        {freelancer.user?.location ? (
          <View style={styles.locationRow}>
            <Ionicons name="location-outline" size={12} color={colors.textMuted} />
            <Text
              style={[styles.locationText, { color: colors.textMuted }]}
              numberOfLines={1}
            >
              {freelancer.user.location}
            </Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  },
);

FreelancerCard.displayName = 'FreelancerCard';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

export const FreelancerCardSkeleton: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.xl, ...shadows.sm },
      ]}
    >
      <View style={[styles.skeletonLine, { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '70%', height: 14, marginTop: 10, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '50%', height: 12, marginTop: 6, backgroundColor: colors.skeleton }]} />
      <View style={[styles.skeletonLine, { width: '40%', height: 10, marginTop: 8, backgroundColor: colors.skeleton }]} />
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderWidth: 1,
    gap: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { fontSize: 18, fontWeight: '700' },
  saveBtn: { padding: 4 },
  name: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  profession: { fontSize: 13, fontWeight: '500', marginBottom: 8 },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: 13, fontWeight: '700' },
  ratingCount: { fontSize: 11 },
  rate: { fontSize: 13, fontWeight: '700' },
  availBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginBottom: 10,
    gap: 5,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  availText: { fontSize: 11, fontWeight: '600' },
  skillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginBottom: 8,
  },
  skillChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  skillText: { fontSize: 11, fontWeight: '500' },
  moreSkills: { fontSize: 11, alignSelf: 'center' },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  locationText: { fontSize: 11 },
  skeletonLine: { borderRadius: 6 },
});
