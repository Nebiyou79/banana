// ReviewCard.tsx
import React, { memo, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { FreelancerReview } from '../../services/freelancerMarketplaceService';
import { StarRating } from './StarRating';

interface ReviewCardProps {
  review: FreelancerReview;
}

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  } catch { return ''; }
};

export const ReviewCard: React.FC<ReviewCardProps> = memo(({ review }) => {
  const { colors, radius, shadows, type } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const company = review.companyId;
  const hasSubRatings = review.subRatings && Object.values(review.subRatings).some((v) => v !== undefined && v > 0);

  const subRatingLabels: Record<string, string> = {
    communication: 'Communication',
    quality: 'Quality',
    deadlines: 'Deadlines',
    professionalism: 'Professionalism',
  };

  return (
    <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
      <View style={[styles.card, { backgroundColor: colors.bgCard, borderColor: colors.borderPrimary, borderRadius: radius.lg, ...shadows.sm }]}>
        <View style={styles.header}>
          <View style={styles.companyRow}>
            {company?.logo ? (
              <Image source={{ uri: company.logo }} style={[styles.companyLogo, { borderColor: colors.borderPrimary }]} resizeMode="cover" />
            ) : (
              <View style={[styles.companyInitials, { backgroundColor: colors.accentBg }]}>
                <Text style={[styles.initialsText, type.body, { color: colors.accent }]}>
                  {company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
                </Text>
              </View>
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.companyName, type.bodySm, { color: colors.textPrimary }]} numberOfLines={1}>
                {company?.name ?? 'Company'}
              </Text>
              <Text style={[styles.date, type.caption, { color: colors.textMuted }]}>
                {formatDate(review.createdAt)}
              </Text>
            </View>
          </View>
          <StarRating value={review.rating} size={16} />
        </View>

        {review.comment ? (
          <Text style={[styles.comment, type.bodySm, { color: colors.textSecondary }]}>
            "{review.comment}"
          </Text>
        ) : null}

        {hasSubRatings && (
          <View style={[styles.subRatingsBox, { backgroundColor: colors.bgSecondary, borderRadius: radius.md }]}>
            {Object.entries(review.subRatings!).map(([key, val]) => {
              if (!val) return null;
              return (
                <View key={key} style={styles.subRow}>
                  <Text style={[styles.subLabel, type.caption, { color: colors.textMuted }]}>
                    {subRatingLabels[key] ?? key}
                  </Text>
                  <StarRating value={val} size={12} />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </Animated.View>
  );
});

ReviewCard.displayName = 'ReviewCard';

const styles = StyleSheet.create({
  card: { padding: 14, borderWidth: 1, marginBottom: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  companyLogo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  companyInitials: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  initialsText: { fontWeight: '700', fontSize: 15 },
  companyName: { fontWeight: '600' },
  date: { marginTop: 1 },
  comment: { lineHeight: 19, fontStyle: 'italic', marginBottom: 8 },
  subRatingsBox: { padding: 10, gap: 6 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  subLabel: { fontWeight: '500' },
});