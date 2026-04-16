/**
 * mobile/src/screens/freelancers/FreelancerDetailScreen.tsx
 *
 * Full public profile of a freelancer.
 * Company/Org role: can save to shortlist + submit a review.
 * Freelancer role (own profile view): read-only with no review/shortlist actions.
 *
 * Tabs: Overview | Portfolio | Services | Reviews
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  FlatList,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import {
  useFreelancerProfile,
  useFreelancerReviews,
  useToggleShortlist,
  useSubmitReview,
} from '../../hooks/useFreelancerMarketplace';
import { StarRating } from '../../components/freelancers/StarRating';
import { ReviewCard } from '../../components/freelancers/ReviewCard';
import { FreelancersStackParamList } from './FreelancerMarketplaceScreen';
import { FreelancerService, FreelancerCertification, PortfolioItem } from '../../services/freelancerMarketplaceService';

type Props = NativeStackScreenProps<FreelancersStackParamList, 'FreelancerDetail'>;

type Tab = 'overview' | 'portfolio' | 'services' | 'reviews';

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FreelancerDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { freelancerId } = route.params;
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;
  const { role } = useAuthStore();

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [subRatings, setSubRatings] = useState({
    communication: 0,
    quality: 0,
    deadlines: 0,
    professionalism: 0,
  });

  const canInteract = role === 'company' || role === 'organization';

  const { data: profile, isLoading } = useFreelancerProfile(freelancerId);
  const { data: reviewsData, isLoading: reviewsLoading } = useFreelancerReviews(
    freelancerId,
    reviewsPage,
  );
  const { mutate: toggleShortlist, isPending: shortlistPending } = useToggleShortlist();
  const { mutate: submitReview, isPending: reviewPending } = useSubmitReview(freelancerId);

  const handleSubmitReview = useCallback(() => {
    if (reviewRating === 0) {
      Alert.alert('Rating required', 'Please select a star rating.');
      return;
    }
    submitReview(
      {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
        subRatings: Object.fromEntries(
          Object.entries(subRatings).filter(([, v]) => v > 0),
        ) as any,
      },
      {
        onSuccess: () => {
          setShowReviewModal(false);
          setReviewComment('');
          setReviewRating(5);
          setSubRatings({ communication: 0, quality: 0, deadlines: 0, professionalism: 0 });
        },
      },
    );
  }, [reviewRating, reviewComment, subRatings, submitReview]);

  // ── Loading ───────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: 80 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={52} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>
            Freelancer not found
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: colors.primary, fontWeight: '600' }}>Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rating = profile.ratings?.average ?? 0;
  const ratingCount = profile.ratings?.count ?? 0;
  const user = profile.user;

  // ── Tabs ──────────────────────────────────────────────────────────────────────

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'services',  label: 'Services' },
    { id: 'reviews',   label: `Reviews (${ratingCount})` },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* ── Nav bar ── */}
      <View
        style={[
          styles.navbar,
          { backgroundColor: colors.surface, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {user?.name ?? 'Freelancer'}
        </Text>
        {canInteract && (
          <TouchableOpacity
            onPress={() => toggleShortlist(freelancerId)}
            disabled={shortlistPending}
            style={styles.backBtn}
          >
            <Ionicons
              name={profile.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={profile.isSaved ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Profile Hero ── */}
        <View
          style={[
            styles.hero,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View
              style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '22' }]}
            >
              <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
              </Text>
            </View>
          )}

          <Text style={[styles.name, { color: colors.text }]}>
            {user?.name ?? 'Freelancer'}
          </Text>

          {(profile.profession ?? profile.title) ? (
            <Text style={[styles.profession, { color: colors.textSecondary }]}>
              {profile.profession ?? profile.title}
            </Text>
          ) : null}

          {/* Rating row */}
          <View style={styles.ratingRow}>
            <StarRating value={rating} size={18} />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {rating > 0 ? rating.toFixed(1) : '—'}
            </Text>
            <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
              ({ratingCount} reviews)
            </Text>
          </View>

          {/* Meta chips row */}
          <View style={styles.metaRow}>
            {profile.hourlyRate ? (
              <View style={[styles.metaChip, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="cash-outline" size={13} color={colors.primary} />
                <Text style={[styles.metaChipText, { color: colors.primary }]}>
                  {profile.currency ?? '$'}{profile.hourlyRate}/hr
                </Text>
              </View>
            ) : null}

            <View
              style={[
                styles.metaChip,
                {
                  backgroundColor:
                    profile.availability === 'available'
                      ? '#22C55E18'
                      : profile.availability === 'busy'
                      ? '#F59E0B18'
                      : '#EF444418',
                },
              ]}
            >
              <View
                style={[
                  styles.availDot,
                  {
                    backgroundColor:
                      profile.availability === 'available'
                        ? '#22C55E'
                        : profile.availability === 'busy'
                        ? '#F59E0B'
                        : '#EF4444',
                  },
                ]}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: '600',
                  color:
                    profile.availability === 'available'
                      ? '#22C55E'
                      : profile.availability === 'busy'
                      ? '#F59E0B'
                      : '#EF4444',
                  textTransform: 'capitalize',
                }}
              >
                {profile.availability}
              </Text>
            </View>

            {profile.experienceLevel ? (
              <View style={[styles.metaChip, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                <Text style={[styles.metaChipText, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                  {profile.experienceLevel}
                </Text>
              </View>
            ) : null}
          </View>

          {user?.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.locationText, { color: colors.textMuted }]}>
                {user.location}
              </Text>
            </View>
          ) : null}

          {/* Action buttons (company/org only) */}
          {canInteract && (
            <View style={styles.actionRow}>
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={[styles.reviewBtn, { backgroundColor: colors.primary }]}
              >
                <Ionicons name="star-outline" size={16} color="#fff" />
                <Text style={styles.reviewBtnText}>Write Review</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ── Stats row ── */}
        <View
          style={[
            styles.statsRow,
            { backgroundColor: colors.surface, borderBottomColor: colors.border },
          ]}
        >
          {[
            { label: 'Projects', value: String(profile.completedProjects ?? 0) },
            { label: 'Success Rate', value: `${Math.round(profile.successRate ?? 0)}%` },
            { label: 'On-Time', value: `${Math.round(profile.onTimeDelivery ?? 0)}%` },
            { label: 'Profile', value: `${Math.round(profile.profileCompletion ?? 0)}%` },
          ].map((stat) => (
            <View key={stat.label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {stat.value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>
                {stat.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Tabs ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[
                  styles.tabBtn,
                  active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? colors.primary : colors.textMuted },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Tab Content ── */}
        <View style={{ padding: 16 }}>
          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <OverviewTab profile={profile} colors={colors} borderRadius={borderRadius} />
          )}

          {/* PORTFOLIO */}
          {activeTab === 'portfolio' && (
            <PortfolioTab
              items={user?.portfolio ?? []}
              colors={colors}
              borderRadius={borderRadius}
            />
          )}

          {/* SERVICES */}
          {activeTab === 'services' && (
            <ServicesTab
              services={profile.services ?? []}
              certifications={profile.certifications ?? []}
              colors={colors}
              borderRadius={borderRadius}
            />
          )}

          {/* REVIEWS */}
          {activeTab === 'reviews' && (
            <ReviewsTab
              freelancerId={freelancerId}
              reviewsData={reviewsData}
              reviewsLoading={reviewsLoading}
              page={reviewsPage}
              onPageChange={setReviewsPage}
              colors={colors}
              borderRadius={borderRadius}
              shadows={shadows}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Review Modal ── */}
      {showReviewModal && (
        <ReviewModal
          visible={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleSubmitReview}
          isLoading={reviewPending}
          rating={reviewRating}
          setRating={setReviewRating}
          comment={reviewComment}
          setComment={setReviewComment}
          subRatings={subRatings}
          setSubRatings={setSubRatings}
          colors={colors}
          borderRadius={borderRadius}
        />
      )}
    </SafeAreaView>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ profile: any; colors: any; borderRadius: any }> = ({
  profile,
  colors,
  borderRadius,
}) => (
  <View style={{ gap: 16 }}>
    {profile.bio ? (
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {profile.bio}
        </Text>
      </View>
    ) : null}

    {(profile.user?.skills?.length ?? 0) > 0 && (
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Skills</Text>
        <View style={styles.skillsWrap}>
          {profile.user.skills.map((skill: string) => (
            <View
              key={skill}
              style={[
                styles.skillChip,
                { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' },
              ]}
            >
              <Text style={[styles.skillText, { color: colors.primary }]}>{skill}</Text>
            </View>
          ))}
        </View>
      </View>
    )}

    {profile.englishProficiency ? (
      <Row label="English" value={profile.englishProficiency} colors={colors} />
    ) : null}

    {profile.timezone ? (
      <Row label="Timezone" value={profile.timezone} colors={colors} />
    ) : null}

    {profile.user?.website ? (
      <TouchableOpacity
        onPress={() => Linking.openURL(profile.user.website)}
        style={[
          styles.websiteRow,
          { borderColor: colors.border, borderRadius: borderRadius.md },
        ]}
      >
        <Ionicons name="globe-outline" size={16} color={colors.primary} />
        <Text style={[styles.websiteText, { color: colors.primary }]} numberOfLines={1}>
          {profile.user.website}
        </Text>
        <Ionicons name="open-outline" size={14} color={colors.primary} />
      </TouchableOpacity>
    ) : null}
  </View>
);

// ─── Portfolio Tab ────────────────────────────────────────────────────────────

const PortfolioTab: React.FC<{
  items: PortfolioItem[];
  colors: any;
  borderRadius: any;
}> = ({ items, colors, borderRadius }) => {
  if (items.length === 0) {
    return (
      <EmptyState
        icon="images-outline"
        message="No portfolio items"
        colors={colors}
      />
    );
  }
  return (
    <View style={{ gap: 12 }}>
      {items.map((item) => (
        <View
          key={item._id}
          style={[
            styles.portfolioCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          {item.mediaUrls?.length > 0 && (
            <Image
              source={{ uri: item.mediaUrls[0] }}
              style={styles.portfolioImage}
              resizeMode="cover"
            />
          )}
          <View style={{ padding: 12 }}>
            <Text style={[styles.portfolioTitle, { color: colors.text }]}>
              {item.title}
            </Text>
            {item.description ? (
              <Text
                style={[styles.portfolioDesc, { color: colors.textSecondary }]}
                numberOfLines={3}
              >
                {item.description}
              </Text>
            ) : null}
            {item.technologies?.length > 0 && (
              <View style={styles.techRow}>
                {item.technologies.slice(0, 4).map((t) => (
                  <View
                    key={t}
                    style={[
                      styles.techChip,
                      { backgroundColor: colors.inputBg, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.techText, { color: colors.textMuted }]}>{t}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      ))}
    </View>
  );
};

// ─── Services Tab ─────────────────────────────────────────────────────────────

const ServicesTab: React.FC<{
  services: FreelancerService[];
  certifications: FreelancerCertification[];
  colors: any;
  borderRadius: any;
}> = ({ services, certifications, colors, borderRadius }) => (
  <View style={{ gap: 16 }}>
    {services.length > 0 && (
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Services</Text>
        <View style={{ gap: 10 }}>
          {services.map((s) => (
            <View
              key={s._id}
              style={[
                styles.serviceCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.lg,
                },
              ]}
            >
              <Text style={[styles.serviceTitle, { color: colors.text }]}>
                {s.title}
              </Text>
              {s.description ? (
                <Text
                  style={[styles.serviceDesc, { color: colors.textSecondary }]}
                  numberOfLines={2}
                >
                  {s.description}
                </Text>
              ) : null}
              <View style={styles.serviceMeta}>
                {s.price ? (
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>
                    {s.currency ?? '$'}{s.price}
                  </Text>
                ) : null}
                {s.deliveryTime ? (
                  <Text style={[styles.serviceDelivery, { color: colors.textMuted }]}>
                    ⏱ {s.deliveryTime}
                  </Text>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </View>
    )}

    {certifications.length > 0 && (
      <View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Certifications
        </Text>
        <View style={{ gap: 10 }}>
          {certifications.map((c) => (
            <View
              key={c._id}
              style={[
                styles.certCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View
                  style={[
                    styles.certIcon,
                    { backgroundColor: '#FBBF2420' },
                  ]}
                >
                  <Ionicons name="ribbon-outline" size={18} color="#FBBF24" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.certName, { color: colors.text }]}>
                    {c.name}
                  </Text>
                  <Text style={[styles.certIssuer, { color: colors.textMuted }]}>
                    {c.issuedBy}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>
    )}

    {services.length === 0 && certifications.length === 0 && (
      <EmptyState icon="briefcase-outline" message="No services listed" colors={colors} />
    )}
  </View>
);

// ─── Reviews Tab ──────────────────────────────────────────────────────────────

const ReviewsTab: React.FC<{
  freelancerId: string;
  reviewsData: any;
  reviewsLoading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  colors: any;
  borderRadius: any;
  shadows: any;
}> = ({ reviewsData, reviewsLoading, page, onPageChange, colors, borderRadius, shadows }) => {
  if (reviewsLoading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 20 }} />;
  }

  const summary = reviewsData?.summary;
  const reviews = reviewsData?.reviews ?? [];
  const pagination = reviewsData?.pagination;

  return (
    <View style={{ gap: 14 }}>
      {/* Summary */}
      {summary && summary.count > 0 && (
        <View
          style={[
            styles.ratingsSummary,
            {
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: borderRadius.lg,
            },
          ]}
        >
          <Text style={[styles.avgRating, { color: colors.text }]}>
            {summary.average.toFixed(1)}
          </Text>
          <StarRating value={summary.average} size={20} />
          <Text style={[styles.totalReviews, { color: colors.textMuted }]}>
            {summary.count} review{summary.count !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      {reviews.length === 0 ? (
        <EmptyState icon="star-outline" message="No reviews yet" colors={colors} />
      ) : (
        <>
          {reviews.map((review: any) => (
            <ReviewCard key={review._id} review={review} />
          ))}

          {/* Pagination */}
          {(pagination?.totalPages ?? 1) > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                onPress={() => onPageChange(page - 1)}
                disabled={page <= 1}
                style={[
                  styles.pageBtn,
                  { borderColor: colors.border, opacity: page <= 1 ? 0.4 : 1 },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.pageText, { color: colors.textSecondary }]}>
                {page} / {pagination.totalPages}
              </Text>
              <TouchableOpacity
                onPress={() => onPageChange(page + 1)}
                disabled={page >= pagination.totalPages}
                style={[
                  styles.pageBtn,
                  {
                    borderColor: colors.border,
                    opacity: page >= pagination.totalPages ? 0.4 : 1,
                  },
                ]}
              >
                <Ionicons name="chevron-forward" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  isLoading: boolean;
  rating: number;
  setRating: (v: number) => void;
  comment: string;
  setComment: (v: string) => void;
  subRatings: Record<string, number>;
  setSubRatings: (v: any) => void;
  colors: any;
  borderRadius: any;
}> = ({
  visible, onClose, onSubmit, isLoading,
  rating, setRating, comment, setComment,
  subRatings, setSubRatings, colors, borderRadius,
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View
        style={[
          styles.modalSheet,
          { backgroundColor: colors.surface, borderRadius: borderRadius.xxl ?? 24 },
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Write a Review</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Overall rating */}
          <Text style={[styles.reviewLabel, { color: colors.textSecondary }]}>
            Overall Rating *
          </Text>
          <StarRating value={rating} size={36} interactive onChange={setRating} />

          {/* Comment */}
          <Text style={[styles.reviewLabel, { color: colors.textSecondary, marginTop: 16 }]}>
            Comment (optional)
          </Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[
              styles.commentInput,
              {
                backgroundColor: colors.inputBg,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: borderRadius.md,
              },
            ]}
            placeholder="Share your experience working with this freelancer…"
            placeholderTextColor={colors.placeholder}
          />

          {/* Sub-ratings */}
          <Text style={[styles.reviewLabel, { color: colors.textSecondary, marginTop: 16 }]}>
            Detailed Ratings (optional)
          </Text>
          {Object.keys(subRatings).map((key) => (
            <View key={key} style={styles.subRatingRow}>
              <Text
                style={[styles.subRatingLabel, { color: colors.text, textTransform: 'capitalize' }]}
              >
                {key}
              </Text>
              <StarRating
                value={subRatings[key]}
                size={22}
                interactive
                onChange={(v) =>
                  setSubRatings((prev: any) => ({ ...prev, [key]: v }))
                }
              />
            </View>
          ))}

          {/* Submit */}
          <TouchableOpacity
            onPress={onSubmit}
            disabled={isLoading || rating === 0}
            style={[
              styles.submitBtn,
              {
                backgroundColor:
                  isLoading || rating === 0 ? colors.textMuted : colors.primary,
                borderRadius: borderRadius.lg,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Review</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Small helpers ────────────────────────────────────────────────────────────

const Row: React.FC<{ label: string; value: string; colors: any }> = ({
  label, value, colors,
}) => (
  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
    <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.rowValue, { color: colors.text }]}>{value}</Text>
  </View>
);

const EmptyState: React.FC<{ icon: any; message: string; colors: any }> = ({
  icon, message, colors,
}) => (
  <View style={styles.empty}>
    <Ionicons name={icon} size={48} color={colors.textMuted} />
    <Text style={[styles.emptyText, { color: colors.textMuted }]}>{message}</Text>
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  notFoundText: { fontSize: 17, fontWeight: '600' },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 8, width: 44, alignItems: 'center' },
  navTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },
  hero: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    gap: 6,
  },
  avatar: { width: 88, height: 88, borderRadius: 44, marginBottom: 6 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center', marginBottom: 6,
  },
  avatarInitials: { fontSize: 32, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  profession: { fontSize: 14, fontWeight: '500' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  ratingText: { fontSize: 15, fontWeight: '700' },
  ratingCount: { fontSize: 12 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 6 },
  metaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  metaChipText: { fontSize: 12, fontWeight: '600' },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  reviewBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 20,
  },
  reviewBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  stat: { alignItems: 'center', gap: 2 },
  statValue: { fontSize: 16, fontWeight: '700' },
  statLabel: { fontSize: 11 },
  tabBar: { borderBottomWidth: 1 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 12 },
  tabText: { fontSize: 13, fontWeight: '600' },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 8 },
  bodyText: { fontSize: 14, lineHeight: 21 },
  skillsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  skillChip: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 12, borderWidth: 1,
  },
  skillText: { fontSize: 12, fontWeight: '500' },
  websiteRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    padding: 10, borderWidth: 1,
  },
  websiteText: { flex: 1, fontSize: 13 },
  portfolioCard: { borderWidth: 1, overflow: 'hidden' },
  portfolioImage: { width: '100%', height: 160 },
  portfolioTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  portfolioDesc: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  techRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  techChip: {
    paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, borderWidth: 1,
  },
  techText: { fontSize: 11 },
  serviceCard: { padding: 14, borderWidth: 1 },
  serviceTitle: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  serviceDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  serviceMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  servicePrice: { fontSize: 14, fontWeight: '700' },
  serviceDelivery: { fontSize: 12 },
  certCard: { padding: 12, borderWidth: 1 },
  certIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  certName: { fontSize: 13, fontWeight: '600' },
  certIssuer: { fontSize: 11 },
  ratingsSummary: {
    alignItems: 'center', padding: 16, borderWidth: 1, gap: 4,
  },
  avgRating: { fontSize: 36, fontWeight: '800' },
  totalReviews: { fontSize: 12, marginTop: 2 },
  pagination: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 16, marginTop: 8,
  },
  pageBtn: { padding: 8, borderWidth: 1, borderRadius: 8 },
  pageText: { fontSize: 13, fontWeight: '600' },
  rowLabel: { fontSize: 13 },
  rowValue: { fontSize: 13, fontWeight: '600' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    maxHeight: '92%', padding: 20,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  reviewLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  commentInput: {
    borderWidth: 1, padding: 12,
    fontSize: 14, minHeight: 100, marginBottom: 4,
  },
  subRatingRow: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 10,
  },
  subRatingLabel: { fontSize: 13 },
  submitBtn: {
    paddingVertical: 14, alignItems: 'center',
    marginTop: 16, marginBottom: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 40 },
  emptyText: { fontSize: 14, fontWeight: '500' },
});
