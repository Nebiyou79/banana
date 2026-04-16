/**
 * mobile/src/components/freelancers/ReviewCard.tsx
 *
 * Displays a single freelancer review — company name, stars, comment, sub-ratings.
 * Used by: FreelancerDetailScreen reviews section, FreelancerMyReviewsScreen
 */

import React, { memo } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { FreelancerReview } from '../../services/freelancerMarketplaceService';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: FreelancerReview;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

export const ReviewCard: React.FC<ReviewCardProps> = memo(({ review }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;

  const company = review.companyId;
  const hasSubRatings =
    review.subRatings &&
    Object.values(review.subRatings).some((v) => v !== undefined && v > 0);

  const subRatingLabels: Record<string, string> = {
    communication: 'Communication',
    quality: 'Quality',
    deadlines: 'Deadlines',
    professionalism: 'Professionalism',
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderRadius: borderRadius.lg,
          ...shadows.sm,
        },
      ]}
    >
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.companyRow}>
          {company?.logo ? (
            <Image
              source={{ uri: company.logo }}
              style={[styles.companyLogo, { borderColor: colors.border }]}
              resizeMode="cover"
            />
          ) : (
            <View
              style={[
                styles.companyInitials,
                { backgroundColor: colors.primary + '20' },
              ]}
            >
              <Text style={[styles.initialsText, { color: colors.primary }]}>
                {company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.companyName, { color: colors.text }]}
              numberOfLines={1}
            >
              {company?.name ?? 'Company'}
            </Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {formatDate(review.createdAt)}
            </Text>
          </View>
        </View>

        <StarRating value={review.rating} size={16} />
      </View>

      {/* ── Comment ── */}
      {review.comment ? (
        <Text style={[styles.comment, { color: colors.textSecondary }]}>
          "{review.comment}"
        </Text>
      ) : null}

      {/* ── Sub-ratings ── */}
      {hasSubRatings && (
        <View
          style={[
            styles.subRatingsBox,
            { backgroundColor: colors.background, borderRadius: borderRadius.md },
          ]}
        >
          {Object.entries(review.subRatings!).map(([key, val]) => {
            if (!val) return null;
            return (
              <View key={key} style={styles.subRow}>
                <Text
                  style={[styles.subLabel, { color: colors.textMuted }]}
                >
                  {subRatingLabels[key] ?? key}
                </Text>
                <StarRating value={val} size={12} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
});

ReviewCard.displayName = 'ReviewCard';

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1, marginBottom: 10 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  companyLogo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  companyInitials: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: { fontSize: 15, fontWeight: '700' },
  companyName: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 11, marginTop: 1 },
  comment: {
    fontSize: 13,
    lineHeight: 19,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  subRatingsBox: { padding: 10, gap: 6 },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  subLabel: { fontSize: 12 },
});
