/**
 * screens/freelancer/MyReviewsScreen.tsx
 * 
 * FIX: Handle API response structure correctly - the endpoint returns
 * data.reviews array, not data directly.
 */

import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Image, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { ScreenWrapper, EmptyState } from '../../components/shared/UIComponents';
import { StarRating } from '../../components/freelancer/StarRating';
import api from '../../lib/api';
import { ScreenHeader } from '../../components/freelancer/ScreenHeader';

interface FreelancerReview {
  _id: string;
  rating: number;
  comment?: string;
  subRatings?: {
    communication?: number;
    quality?: number;
    deadlines?: number;
    professionalism?: number;
  };
  createdAt: string;
  companyId: {
    _id: string;
    name: string;
    logo?: string;
  };
}

interface ReviewsResponse {
  reviews: FreelancerReview[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  summary: {
    average: number;
    count: number;
    breakdown: Record<string, number>;
  };
}

export const MyReviewsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { colors, radius, spacing } = useTheme();

  const [reviewsData, setReviewsData] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = async (silent = false) => {
    silent ? setRefreshing(true) : setLoading(true);
    setError(null);
    
    try {
      // Use the dedicated /me/reviews endpoint
      const res = await api.get('/freelancers/me/reviews');
      
      if (res.data && res.data.success) {
        // Extract data from the response
        const responseData = res.data.data || {};
        
        // Ensure reviews is always an array
        const reviews = Array.isArray(responseData.reviews) ? responseData.reviews : [];
        
        setReviewsData({
          reviews: reviews,
          pagination: responseData.pagination || {
            total: 0,
            page: 1,
            limit: 10,
            totalPages: 0,
          },
          summary: responseData.summary || {
            average: 0,
            count: 0,
            breakdown: {},
          },
        });
      } else {
        // Handle unsuccessful response
        setReviewsData({
          reviews: [],
          pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
          summary: { average: 0, count: 0, breakdown: {} },
        });
        if (res.data?.message) {
          setError(res.data.message);
        }
      }
    } catch (err: any) {
      console.log('Failed to fetch reviews:', err);
      setError(err?.message || 'Failed to load reviews');
      setReviewsData({
        reviews: [],
        pagination: { total: 0, page: 1, limit: 10, totalPages: 0 },
        summary: { average: 0, count: 0, breakdown: {} },
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const avg = reviewsData?.summary?.average ?? 0;
  const total = reviewsData?.summary?.count ?? 0;
  const reviews = reviewsData?.reviews ?? [];

  if (loading && !reviewsData) {
    return (
      <ScreenWrapper>
        <ScreenHeader title="My Reviews" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <ScreenHeader title="My Reviews" onBack={() => navigation.goBack()} />

      <ScrollView
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={() => fetchReviews(true)} 
            tintColor={colors.warning} 
          />
        }
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary card */}
        <View style={[styles.summaryCard, {
          backgroundColor: colors.warning,
          borderRadius: radius.xl,
        }]}>
          <Text style={{ color: '#fff', fontSize: 48, fontWeight: '900', lineHeight: 56 }}>
            {avg > 0 ? avg.toFixed(1) : '—'}
          </Text>
          <StarRating value={avg} size={18} color="#fff" />
          <Text style={{ color: withAlpha('#fff', 0.56), fontSize: FONT_SIZE.sm, marginTop: 6 }}>
            Based on {total} review{total !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Error state */}
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.danger + '15', borderRadius: radius.md }]}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
            <TouchableOpacity onPress={() => fetchReviews(false)}>
              <Text style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reviews list */}
        {reviews.length === 0 && !error ? (
          <EmptyState
            icon="star-outline"
            title="No reviews yet"
            subtitle="Complete projects and deliver great work to start earning reviews from clients."
          />
        ) : (
          reviews.map((review) => (
            <ReviewCard key={review._id} review={review} />
          ))
        )}
      </ScrollView>
    </ScreenWrapper>
  );
};

const ReviewCard: React.FC<{ review: FreelancerReview }> = ({ review }) => {
  const { colors, radius } = useTheme();
  const [imgErr, setImgErr] = useState(false);

  const company = review.companyId;
  const hasSubRatings = review.subRatings &&
    Object.values(review.subRatings).some(v => v != null && v > 0);

  return (
    <View style={[styles.reviewCard, {
      backgroundColor: colors.bgCard,
      borderColor: colors.border,
      borderRadius: radius.lg,
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
            <View style={[styles.companyInitials, { backgroundColor: withAlpha(colors.primary, 0.12) }]}>
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
        <View style={[styles.subRatingsBox, { backgroundColor: colors.bg, borderRadius: radius.md }]}>
          {Object.entries(review.subRatings!).map(([key, val]) => {
            if (!val || val === 0) return null;
            return (
              <View key={key} style={styles.subRow}>
                <Text style={{ fontSize: 12, color: colors.textMuted, textTransform: 'capitalize' }}>
                  {key}
                </Text>
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
  summaryCard: { alignItems: 'center', padding: 24, marginBottom: 20 },
  reviewCard: { padding: 14, borderWidth: 1, marginBottom: 10 },
  reviewHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start', 
    marginBottom: 8 
  },
  companyRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  companyLogo: { width: 36, height: 36, borderRadius: 18, borderWidth: 1 },
  companyInitials: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  subRatingsBox: { padding: 10, gap: 6 },
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  errorContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8, 
    padding: 12, 
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  errorText: { fontSize: 13, flex: 1 },
});