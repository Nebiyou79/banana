/**
 * mobile/src/screens/freelancers/FreelancerMyReviewsScreen.tsx
 *
 * Freelancer-role screen: view all reviews and star ratings given by companies.
 * Accessible from the Freelancer dashboard / More tab.
 * Read-only — no submit action for the freelancer themselves.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useFreelancerReviews,
  useFreelancerProfile,
} from '../../hooks/useFreelancerMarketplace';
import { ReviewCard } from '../../components/freelancer/ReviewCard';
import { StarRating } from '../../components/freelancer/StarRating';
import { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Props = NativeStackScreenProps<FreelancerStackParamList, 'MyReviews'>;

const RatingBar: React.FC<{
  label: string;
  value: number;
  total: number;
  colors: any;
}> = ({ label, value, total, colors }) => {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.ratingBarRow}>
      <Text style={[styles.ratingBarLabel, { color: colors.textMuted }]}>{label}</Text>
      <View style={[styles.ratingBarTrack, { backgroundColor: colors.border }]}>
        <View
          style={[
            styles.ratingBarFill,
            { backgroundColor: '#FBBF24', width: `${pct}%` as any },
          ]}
        />
      </View>
      <Text style={[styles.ratingBarCount, { color: colors.textMuted }]}>{value}</Text>
    </View>
  );
};

export const FreelancerMyReviewsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useThemeStore();
  const { colors, borderRadius, shadows } = theme;
  const { user } = useAuthStore();

  // The freelancer's profile _id is stored in user.freelancerProfileId
  // or resolved via user._id through the profile endpoint.
  // We use useFreelancerProfile with user._id to get the profile._id then use that for reviews.
  const freelancerId = (user as any)?.freelancerProfileId ?? user?._id ?? '';

  const [page, setPage] = useState(1);

  const { data: profile, isLoading: profileLoading } = useFreelancerProfile(freelancerId);
  const { data: reviewsData, isLoading: reviewsLoading } = useFreelancerReviews(
    profile?._id ?? freelancerId,
    page,
  );

  const isLoading = profileLoading && !profile;
  const summary = reviewsData?.summary;
  const reviews = reviewsData?.reviews ?? [];
  const pagination = reviewsData?.pagination;

  // ── Breakdown distribution ─────────────────────────────────────────────────

  const breakdown = summary?.breakdown ?? {};
  const breakdownEntries = Object.entries(breakdown).filter(([, v]) => (v as number) > 0);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>My Reviews</Text>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator
          color={colors.primary}
          size="large"
          style={{ marginTop: 60 }}
        />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        >
          {/* ── Summary Card ── */}
          {summary && (
            <View
              style={[
                styles.summaryCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.xl,
                  ...shadows.md,
                },
              ]}
            >
              <View style={styles.summaryTop}>
                <View style={styles.avgBlock}>
                  <Text style={[styles.avgNumber, { color: colors.text }]}>
                    {summary.average > 0 ? summary.average.toFixed(1) : '—'}
                  </Text>
                  <StarRating value={summary.average} size={22} />
                  <Text style={[styles.totalReviews, { color: colors.textMuted }]}>
                    {summary.count} review{summary.count !== 1 ? 's' : ''}
                  </Text>
                </View>

                {/* Star distribution bars: 5→1 */}
                <View style={styles.barsBlock}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = (breakdown as any)[`star${star}`] ?? 0;
                    return (
                      <RatingBar
                        key={star}
                        label={`${star}★`}
                        value={count}
                        total={summary.count}
                        colors={colors}
                      />
                    );
                  })}
                </View>
              </View>

              {/* Sub-rating averages */}
              {breakdownEntries.length > 0 && (
                <View
                  style={[
                    styles.subRatingsBox,
                    {
                      backgroundColor: colors.background,
                      borderRadius: borderRadius.md,
                      marginTop: 12,
                    },
                  ]}
                >
                  {breakdownEntries.map(([key, val]) => (
                    <View key={key} style={styles.subRatingRow}>
                      <Text
                        style={[
                          styles.subRatingLabel,
                          { color: colors.textSecondary, textTransform: 'capitalize' },
                        ]}
                      >
                        {key}
                      </Text>
                      <View style={styles.subRatingRight}>
                        <StarRating value={val as number} size={13} />
                        <Text style={[styles.subRatingVal, { color: colors.text }]}>
                          {(val as number).toFixed(1)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* ── Reviews list ── */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            All Reviews
          </Text>

          {reviewsLoading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />
          ) : reviews.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="star-outline" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No reviews yet
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textMuted }]}>
                Complete projects with companies to receive your first review.
              </Text>
            </View>
          ) : (
            <>
              {reviews.map((review) => (
                <ReviewCard key={review._id} review={review} />
              ))}

              {/* Pagination */}
              {(pagination?.totalPages ?? 1) > 1 && (
                <View style={styles.pagination}>
                  <TouchableOpacity
                    onPress={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    style={[
                      styles.pageBtn,
                      {
                        borderColor: colors.border,
                        opacity: page <= 1 ? 0.4 : 1,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Ionicons name="chevron-back" size={18} color={colors.text} />
                  </TouchableOpacity>

                  <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                    Page {page} of {pagination?.totalPages}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setPage((p) => Math.min(pagination?.totalPages ?? 1, p + 1))
                    }
                    disabled={page >= (pagination?.totalPages ?? 1)}
                    style={[
                      styles.pageBtn,
                      {
                        borderColor: colors.border,
                        opacity:
                          page >= (pagination?.totalPages ?? 1) ? 0.4 : 1,
                        borderRadius: borderRadius.md,
                      },
                    ]}
                  >
                    <Ionicons name="chevron-forward" size={18} color={colors.text} />
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, width: 40 },
  title: { flex: 1, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  summaryCard: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  summaryTop: {
    flexDirection: 'row',
    gap: 16,
  },
  avgBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    gap: 4,
  },
  avgNumber: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  totalReviews: { fontSize: 11, marginTop: 2 },
  barsBlock: { flex: 1, gap: 4 },
  ratingBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingBarLabel: { fontSize: 11, width: 22, textAlign: 'right' },
  ratingBarTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  ratingBarFill: { height: '100%', borderRadius: 3 },
  ratingBarCount: { fontSize: 11, width: 18, textAlign: 'right' },
  subRatingsBox: { padding: 10, gap: 8 },
  subRatingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subRatingLabel: { fontSize: 12 },
  subRatingRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  subRatingVal: { fontSize: 12, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptyHint: { fontSize: 13, textAlign: 'center', lineHeight: 20, paddingHorizontal: 20 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  pageBtn: { padding: 8, borderWidth: 1 },
  pageText: { fontSize: 13, fontWeight: '600' },
});
