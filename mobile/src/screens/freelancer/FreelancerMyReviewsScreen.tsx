/**
 * screens/freelancer/MyReviewsScreen.tsx
 *
 * Fetches reviews via the freelancer marketplace profile.
 * Mirrors the web /dashboard/freelancer/reviews page.
 */
import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useThemeStore } from '../../store/themeStore';
import { useFreelancerProfile } from '../../hooks/useFreelancer';
import { ScreenWrapper, ScreenHeader, EmptyState } from '../../components/shared/UIComponents';
import { StarRating } from '../../components/freelancer/StarRating';
import type { FreelancerReview } from '../../types/freelancer';

const ACCENT = '#F59E0B';

interface ReviewsData {
  reviews: FreelancerReview[];
  summary: { average: number; count: number };
}

export const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { theme }  = useThemeStore();
  const { colors, typography, spacing, borderRadius, shadows } = theme;

  const { data: profile } = useFreelancerProfile();
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [loading, setLoading]         = useState(false);
  const [refreshing, setRefreshing]   = useState(false);

  const profileId = profile?.freelancerProfile?._id ?? profile?._id;

  const fetchReviews = async (silent = false) => {
    if (!profileId) return;
    silent ? setRefreshing(true) : setLoading(true);
    try {
      // Use the marketplace reviews endpoint via direct API call
      const { default: api } = await import('../../lib/api');
      const res = await api.get(`/freelancers/${profileId}/reviews`);
      if (res.data.success) {
        setReviewsData({
          reviews: res.data.data ?? [],
          summary: res.data.summary ?? { average: 0, count: 0 },
        });
      }
    } catch {
      // Silently fail — user may not have a marketplace profile yet
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchReviews(); }, [profileId]);

  const avg   = reviewsData?.summary?.average ?? 0;
  const total = reviewsData?.summary?.count ?? 0;
  const reviews = reviewsData?.reviews ?? [];

  return (
    <ScreenWrapper>
      <ScreenHeader title="My Reviews" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchReviews(true)} tintColor={ACCENT} />}
          contentContainerStyle={{ padding: spacing[4], paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Summary card */}
          <View style={[styles.summaryCard, {
            backgroundColor: ACCENT,
            borderRadius: borderRadius.xl,
          }]}>
            <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 56 }}>
              {avg > 0 ? avg.toFixed(1) : '—'}
            </Text>
            <StarRating value={avg} size={18} color="#fff" />
            <Text style={{ color: '#ffffff90', fontSize: typography.sm, marginTop: 6 }}>
              Based on {total} review{total !== 1 ? 's' : ''}
            </Text>
          </View>

          {/* Reviews list */}
          {reviews.length === 0 ? (
            <EmptyState
              icon="star-outline"
              title="No reviews yet"
              subtitle="Complete projects and deliver great work to start earning reviews from clients."
            />
          ) : (
            reviews.map(review => (
              <ReviewCard key={review._id} review={review} />
            ))
          )}
        </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const ReviewCard: React.FC<{ review: FreelancerReview }> = ({ review }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, typography, spacing, shadows } = theme;
  const [imgErr, setImgErr] = useState(false);

  const company = review.companyId;
  const hasSubRatings = review.subRatings &&
    Object.values(review.subRatings).some(v => v != null && v > 0);

  return (
    <View style={[styles.reviewCard, {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: borderRadius.lg,
      ...shadows.sm,
    }]}>
      {/* Header */}
      <View style={styles.reviewHeader}>
        <View style={styles.companyRow}>
          {company?.logo && !imgErr ? (
            <Image
              source={{ uri: company.logo }}
              style={[styles.companyLogo, { borderColor: colors.border }]}
              resizeMode="cover"
              onError={() => setImgErr(true)}
            />
          ) : (
            <View style={[styles.companyInitials, { backgroundColor: colors.primary + '20' }]}>
              <Text style={{ color: colors.primary, fontSize: 15, fontWeight: '700' }}>
                {company?.name?.charAt(0)?.toUpperCase() ?? 'C'}
              </Text>
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: colors.text }} numberOfLines={1}>
              {company?.name ?? 'Company'}
            </Text>
            <Text style={{ fontSize: 11, marginTop: 1, color: colors.textMuted }}>
              {new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
            </Text>
          </View>
        </View>
        <StarRating value={review.rating} size={16} />
      </View>

      {/* Comment */}
      {review.comment && (
        <Text style={{ fontSize: 13, lineHeight: 19, fontStyle: 'italic', color: colors.textSecondary, marginBottom: 8 }}>
          "{review.comment}"
        </Text>
      )}

      {/* Sub-ratings */}
      {hasSubRatings && (
        <View style={[styles.subRatingsBox, { backgroundColor: colors.background, borderRadius: borderRadius.md }]}>
          {Object.entries(review.subRatings!).map(([key, val]) => {
            if (!val || val === 0) return null;
            return (
              <View key={key} style={styles.subRow}>
                <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>{key}</Text>
                <StarRating value={val} size={12} />
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  summaryCard:    { alignItems: 'center', padding: 24, marginBottom: 20 },
  reviewCard:     { padding: 14, borderWidth: 1, marginBottom: 10 },
  reviewHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  companyRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  companyLogo:    { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  companyInitials:{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subRatingsBox:  { padding: 10, gap: 6 },
  subRow:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});