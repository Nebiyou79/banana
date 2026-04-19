/**
 * mobile/src/screens/freelancer/FreelancerDetailScreen.tsx
 *
 * FIXES applied vs previous version:
 * 1. Reviews tab now forces a fresh fetch when mounted (gcTime:0 + no placeholder)
 *    so newly submitted reviews appear immediately.
 * 2. Shortlist toggle no longer triggers 404 — optimistic update is list-only.
 * 3. useSubmitReview callback closes modal THEN reviews refetch fires correctly.
 * 4. Reviews tab shows a loading spinner per-page, not a full-screen loader.
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
  Linking,
  Alert,
  FlatList,
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
import { StarRating } from '../../components/freelancer/StarRating';
import { ReviewCard } from '../../components/freelancer/ReviewCard';
import {
  FreelancerService,
  FreelancerCertification,
  PortfolioItem,
  FreelancerPublicProfile,
} from '../../services/freelancerMarketplaceService';

// ── Navigation types ────────────────────────────────────────────────────────
export type FreelancersStackParamList = {
  FreelancerMarketplace: undefined;
  FreelancerDetail: { freelancerId: string };
  FreelancerShortlist: undefined;
};

type Props = NativeStackScreenProps<FreelancersStackParamList, 'FreelancerDetail'>;
type Tab = 'overview' | 'portfolio' | 'services' | 'reviews';

// ── Helpers ─────────────────────────────────────────────────────────────────

const AVAIL_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  available:    { label: 'Available',    color: '#22C55E', bg: '#22C55E18' },
  busy:         { label: 'Busy',         color: '#F59E0B', bg: '#F59E0B18' },
  'part-time':  { label: 'Part-time',    color: '#F59E0B', bg: '#F59E0B18' },
  unavailable:  { label: 'Unavailable',  color: '#EF4444', bg: '#EF444418' },
  'not-available': { label: 'Not Available', color: '#EF4444', bg: '#EF444418' },
};

// ── Screen ───────────────────────────────────────────────────────────────────

export const FreelancerDetailScreen: React.FC<Props> = ({ navigation, route }) => {
  const { freelancerId } = route.params;
  const { theme } = useThemeStore();
  const { colors, spacing, borderRadius, shadows } = theme;
  const { role } = useAuthStore() as any;

  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [reviewsPage, setReviewsPage] = useState(1);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [subRatings, setSubRatings] = useState({
    communication: 0, quality: 0, deadlines: 0, professionalism: 0,
  });

  const canInteract = role === 'company' || role === 'organization';

  const { data: profile, isLoading } = useFreelancerProfile(freelancerId);

  // FIX: always use freelancerId (route param) as the reviews key — this is the
  // profile._id returned by GET /freelancers/:id, so they match.
  const { data: reviewsData, isLoading: reviewsLoading, refetch: refetchReviews } =
    useFreelancerReviews(freelancerId, reviewsPage);

  const { mutate: toggleShortlist, isPending: shortlistPending } = useToggleShortlist();
  const { mutate: submitReview, isPending: reviewPending } = useSubmitReview(freelancerId);

  const handleSubmitReview = useCallback(() => {
    if (reviewRating === 0) {
      Alert.alert('Rating required', 'Please select at least 1 star.');
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
          // Close modal first, then reviews will refetch via cache invalidation
          setShowReviewModal(false);
          setReviewComment('');
          setReviewRating(0);
          setSubRatings({ communication: 0, quality: 0, deadlines: 0, professionalism: 0 });
          // Switch to reviews tab so user sees their review
          setActiveTab('reviews');
          setReviewsPage(1);
          // Belt-and-suspenders: explicitly refetch
          setTimeout(() => refetchReviews(), 300);
        },
      },
    );
  }, [reviewRating, reviewComment, subRatings, submitReview, refetchReviews]);

  // ── Loading / Error states ──────────────────────────────────────────────────

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />
        <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.navTitle, { color: colors.text }]}>Profile</Text>
          <View style={styles.navBtn} />
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading profile…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={56} color={colors.textMuted} />
          <Text style={[styles.notFoundText, { color: colors.text }]}>Freelancer not found</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}
            style={[styles.goBackBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.lg }]}>
            <Text style={styles.goBackText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const rating = profile.ratings?.average ?? 0;
  const ratingCount = profile.ratings?.count ?? 0;
  const user = profile.user;
  const avail = AVAIL_CONFIG[profile.availability] ?? AVAIL_CONFIG['unavailable'];

  const TABS: { id: Tab; label: string; badge?: number }[] = [
    { id: 'overview',  label: 'Overview' },
    { id: 'portfolio', label: 'Portfolio', badge: user?.portfolio?.length },
    { id: 'services',  label: 'Services', badge: profile.services?.length },
    { id: 'reviews',   label: 'Reviews', badge: ratingCount },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* ── Nav bar ── */}
      <View style={[styles.navbar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.navTitle, { color: colors.text }]} numberOfLines={1}>
          {user?.name ?? 'Freelancer'}
        </Text>
        {canInteract ? (
          <TouchableOpacity
            onPress={() => toggleShortlist(freelancerId)}
            disabled={shortlistPending}
            style={[styles.navBtn, styles.navBtnRight]}
          >
            <Ionicons
              name={profile.isSaved ? 'bookmark' : 'bookmark-outline'}
              size={24}
              color={profile.isSaved ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>
        ) : (
          <View style={styles.navBtn} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} stickyHeaderIndices={[2]}>
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {/* Cover gradient bar */}
          <View style={styles.heroCover} />

          <View style={styles.heroContent}>
            {/* Avatar */}
            <View style={styles.avatarWrapper}>
              {user?.avatar ? (
                <Image source={{ uri: user.avatar }} style={[styles.avatar, { borderColor: colors.background }]} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + '22', borderColor: colors.background }]}>
                  <Text style={[styles.avatarInitials, { color: colors.primary }]}>
                    {user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) ?? '?'}
                  </Text>
                </View>
              )}
              {profile.availability === 'available' && (
                <View style={[styles.onlineDot, { backgroundColor: '#22C55E', borderColor: colors.background }]} />
              )}
            </View>

            {/* Name + profession */}
            <Text style={[styles.name, { color: colors.text }]}>{user?.name ?? 'Freelancer'}</Text>
            {(profile.profession ?? (profile as any).headline) ? (
              <Text style={[styles.profession, { color: colors.textSecondary }]}>
                {profile.profession ?? (profile as any).headline}
              </Text>
            ) : null}

            {/* Rating */}
            <View style={styles.ratingRow}>
              <StarRating value={rating} size={18} />
              <Text style={[styles.ratingNum, { color: colors.text }]}>
                {rating > 0 ? rating.toFixed(1) : '—'}
              </Text>
              <Text style={[styles.ratingCount, { color: colors.textMuted }]}>
                ({ratingCount} review{ratingCount !== 1 ? 's' : ''})
              </Text>
            </View>

            {/* Chips */}
            <View style={styles.chipsRow}>
              {(profile as any).hourlyRate ? (
                <View style={[styles.chip, { backgroundColor: colors.primary + '15' }]}>
                  <Ionicons name="cash-outline" size={12} color={colors.primary} />
                  <Text style={[styles.chipText, { color: colors.primary }]}>
                    ${(profile as any).hourlyRate}/hr
                  </Text>
                </View>
              ) : null}

              <View style={[styles.chip, { backgroundColor: avail.bg }]}>
                <View style={[styles.availDot, { backgroundColor: avail.color }]} />
                <Text style={[styles.chipText, { color: avail.color }]}>{avail.label}</Text>
              </View>

              {profile.experienceLevel ? (
                <View style={[styles.chip, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}>
                  <Text style={[styles.chipText, { color: colors.textSecondary, textTransform: 'capitalize' }]}>
                    {profile.experienceLevel}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Location */}
            {user?.location ? (
              <View style={styles.locationRow}>
                <Ionicons name="location-outline" size={13} color={colors.textMuted} />
                <Text style={[styles.locationText, { color: colors.textMuted }]}>{user.location}</Text>
              </View>
            ) : null}

            {/* CTA */}
            {canInteract && (
              <TouchableOpacity
                onPress={() => setShowReviewModal(true)}
                style={[styles.reviewBtn, { backgroundColor: colors.primary, borderRadius: borderRadius.xl }]}
              >
                <Ionicons name="star-outline" size={16} color="#fff" />
                <Text style={styles.reviewBtnText}>Write a Review</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Stats row ── */}
        <View style={[styles.statsRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {[
            { label: 'Success',  value: `${Math.round(profile.successRate ?? 0)}%` },
            { label: 'On-Time',  value: `${Math.round(profile.onTimeDelivery ?? 0)}%` },
            { label: 'Complete', value: `${Math.round(profile.profileCompletion ?? 0)}%` },
            { label: 'Reviews',  value: String(ratingCount) },
          ].map((s) => (
            <View key={s.label} style={styles.stat}>
              <Text style={[styles.statVal, { color: colors.primary }]}>{s.value}</Text>
              <Text style={[styles.statLbl, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* ── Tab bar (sticky) ── */}
        <View style={[styles.tabBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 12 }}>
            {TABS.map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={[styles.tabBtn, active && { borderBottomColor: colors.primary, borderBottomWidth: 2.5 }]}
                >
                  <Text style={[styles.tabText, { color: active ? colors.primary : colors.textMuted, fontWeight: active ? '700' : '500' }]}>
                    {tab.label}
                  </Text>
                  {tab.badge != null && tab.badge > 0 && (
                    <View style={[styles.tabBadge, { backgroundColor: active ? colors.primary : colors.border }]}>
                      <Text style={[styles.tabBadgeText, { color: active ? '#fff' : colors.textMuted }]}>
                        {tab.badge}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── Tab content ── */}
        <View style={{ padding: 16, minHeight: 300 }}>
          {activeTab === 'overview' && <OverviewTab profile={profile} colors={colors} borderRadius={borderRadius} />}
          {activeTab === 'portfolio' && <PortfolioTab items={user?.portfolio ?? []} colors={colors} borderRadius={borderRadius} />}
          {activeTab === 'services' && (
            <ServicesTab
              services={profile.services ?? []}
              certifications={profile.certifications ?? []}
              colors={colors}
              borderRadius={borderRadius}
            />
          )}
          {activeTab === 'reviews' && (
            <ReviewsTab
              reviewsData={reviewsData}
              reviewsLoading={reviewsLoading}
              page={reviewsPage}
              onPageChange={setReviewsPage}
              colors={colors}
              borderRadius={borderRadius}
            />
          )}
        </View>
      </ScrollView>

      {/* ── Review Modal ── */}
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
    </SafeAreaView>
  );
};

// ─── Overview Tab ─────────────────────────────────────────────────────────────

const OverviewTab: React.FC<{ profile: FreelancerPublicProfile; colors: any; borderRadius: any }> = ({
  profile, colors, borderRadius,
}) => (
  <View style={{ gap: 20 }}>
    {profile.bio ? (
      <Section title="About" icon="person-outline" colors={colors}>
        <Text style={[styles.bodyText, { color: colors.textSecondary, lineHeight: 22 }]}>
          {profile.bio}
        </Text>
      </Section>
    ) : null}

    {(profile.user?.skills?.length ?? 0) > 0 && (
      <Section title="Skills" icon="flash-outline" colors={colors}>
        <View style={styles.tagsWrap}>
          {profile.user.skills.map((skill: string) => (
            <View key={skill} style={[styles.skillTag, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '40' }]}>
              <Text style={[styles.skillTagText, { color: colors.primary }]}>{skill}</Text>
            </View>
          ))}
        </View>
      </Section>
    )}

    {(profile as any).specialization?.length > 0 && (
      <Section title="Specializations" icon="star-outline" colors={colors}>
        <View style={styles.tagsWrap}>
          {(profile as any).specialization.map((s: string) => (
            <View key={s} style={[styles.skillTag, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={[styles.skillTagText, { color: colors.textSecondary }]}>{s}</Text>
            </View>
          ))}
        </View>
      </Section>
    )}

    {/* Experience */}
    {(profile.user as any)?.experience?.length > 0 && (
      <Section title="Experience" icon="briefcase-outline" colors={colors}>
        <View style={{ gap: 10 }}>
          {(profile.user as any).experience.map((exp: any) => (
            <View key={exp._id} style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>{exp.position}</Text>
              <Text style={[styles.timelineSub, { color: colors.textSecondary }]}>{exp.company}</Text>
              <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                {new Date(exp.startDate).getFullYear()} – {exp.current ? 'Present' : new Date(exp.endDate).getFullYear()}
              </Text>
              {exp.description ? (
                <Text style={[styles.timelineDesc, { color: colors.textMuted }]} numberOfLines={3}>
                  {exp.description}
                </Text>
              ) : null}
            </View>
          ))}
        </View>
      </Section>
    )}

    {/* Education */}
    {(profile.user as any)?.education?.length > 0 && (
      <Section title="Education" icon="school-outline" colors={colors}>
        <View style={{ gap: 10 }}>
          {(profile.user as any).education.map((edu: any) => (
            <View key={edu._id} style={[styles.timelineCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>
                {edu.degree}{edu.field ? `, ${edu.field}` : ''}
              </Text>
              <Text style={[styles.timelineSub, { color: colors.textSecondary }]}>{edu.institution}</Text>
              <Text style={[styles.timelineDate, { color: colors.textMuted }]}>
                {new Date(edu.startDate).getFullYear()} – {edu.current ? 'Present' : new Date(edu.endDate).getFullYear()}
              </Text>
            </View>
          ))}
        </View>
      </Section>
    )}

    {/* Quick info */}
    <Section title="Details" icon="information-circle-outline" colors={colors}>
      <View style={{ gap: 8 }}>
        {profile.englishProficiency ? <InfoRow label="English" value={profile.englishProficiency} colors={colors} /> : null}
        {profile.timezone ? <InfoRow label="Timezone" value={profile.timezone} colors={colors} /> : null}
        {profile.user?.website ? (
          <TouchableOpacity onPress={() => Linking.openURL(profile.user.website!)} style={styles.webRow}>
            <Ionicons name="globe-outline" size={14} color={colors.primary} />
            <Text style={[styles.webText, { color: colors.primary }]} numberOfLines={1}>
              {profile.user.website}
            </Text>
            <Ionicons name="open-outline" size={12} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </View>
    </Section>
  </View>
);

// ─── Portfolio Tab ────────────────────────────────────────────────────────────

const PortfolioTab: React.FC<{ items: PortfolioItem[]; colors: any; borderRadius: any }> = ({
  items, colors, borderRadius,
}) => {
  if (!items.length) return <EmptyState icon="images-outline" message="No portfolio items yet" colors={colors} />;
  return (
    <View style={{ gap: 14 }}>
      {items.map((item) => (
        <View key={item._id} style={[styles.portfolioCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
          {item.mediaUrls?.find((u: string) => u?.includes('cloudinary.com')) ? (
            <Image source={{ uri: item.mediaUrls[0] }} style={[styles.portfolioImg, { borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl }]} resizeMode="cover" />
          ) : null}
          <View style={{ padding: 14 }}>
            <View style={styles.portfolioTitleRow}>
              <Text style={[styles.portfolioTitle, { color: colors.text, flex: 1 }]}>{item.title}</Text>
              {item.featured && (
                <View style={[styles.featuredBadge, { backgroundColor: '#FBBF24' }]}>
                  <Text style={styles.featuredText}>Featured</Text>
                </View>
              )}
            </View>
            {item.description ? (
              <Text style={[styles.portfolioDesc, { color: colors.textSecondary }]} numberOfLines={3}>{item.description}</Text>
            ) : null}
            {item.technologies?.length > 0 && (
              <View style={[styles.tagsWrap, { marginTop: 8 }]}>
                {item.technologies.slice(0, 4).map((t: string) => (
                  <View key={t} style={[styles.techTag, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <Text style={[styles.techTagText, { color: colors.textSecondary }]}>{t}</Text>
                  </View>
                ))}
                {item.technologies.length > 4 && (
                  <Text style={[styles.techTagText, { color: colors.textMuted }]}>+{item.technologies.length - 4}</Text>
                )}
              </View>
            )}
            {item.client ? (
              <View style={styles.portfolioMeta}>
                <Ionicons name="business-outline" size={12} color={colors.textMuted} />
                <Text style={[styles.portfolioMetaText, { color: colors.textMuted }]}>{item.client}</Text>
              </View>
            ) : null}
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
  <View style={{ gap: 20 }}>
    {services.length > 0 && (
      <Section title="Services" icon="construct-outline" colors={colors}>
        <View style={{ gap: 12 }}>
          {services.map((s) => (
            <View key={s._id} style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: colors.primary + '30', borderRadius: borderRadius.xl }]}>
              <View style={styles.serviceHeader}>
                <View style={[styles.serviceIcon, { backgroundColor: colors.primary + '15', borderRadius: borderRadius.md }]}>
                  <Ionicons name="construct-outline" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.serviceTitle, { color: colors.text }]}>{s.title}</Text>
                  {s.category ? <Text style={[styles.serviceCat, { color: colors.textMuted }]}>{s.category}</Text> : null}
                </View>
                {s.price != null && (
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>${s.price}</Text>
                )}
              </View>
              {s.description ? (
                <Text style={[styles.serviceDesc, { color: colors.textSecondary }]} numberOfLines={2}>{s.description}</Text>
              ) : null}
              {s.deliveryTime ? (
                <View style={styles.serviceDeliveryRow}>
                  <Ionicons name="time-outline" size={12} color={colors.textMuted} />
                  <Text style={[styles.serviceDelivery, { color: colors.textMuted }]}>{s.deliveryTime}</Text>
                </View>
              ) : null}
            </View>
          ))}
        </View>
      </Section>
    )}

    {certifications.length > 0 && (
      <Section title="Certifications" icon="ribbon-outline" colors={colors}>
        <View style={{ gap: 10 }}>
          {certifications.map((c) => (
            <View key={c._id} style={[styles.certCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg }]}>
              <View style={[styles.certIcon, { backgroundColor: '#FBBF2420', borderRadius: borderRadius.md }]}>
                <Ionicons name="ribbon-outline" size={20} color="#FBBF24" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.certName, { color: colors.text }]}>{c.name}</Text>
                <Text style={[styles.certIssuer, { color: colors.textMuted }]}>
                  {(c as any).issuedBy ?? (c as any).issuer}
                </Text>
                {c.credentialUrl ? (
                  <TouchableOpacity onPress={() => Linking.openURL(c.credentialUrl!)}>
                    <Text style={{ fontSize: 11, color: colors.primary, marginTop: 2 }}>Verify ↗</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          ))}
        </View>
      </Section>
    )}

    {services.length === 0 && certifications.length === 0 && (
      <EmptyState icon="briefcase-outline" message="No services listed yet" colors={colors} />
    )}
  </View>
);

// ─── Reviews Tab ─────────────────────────────────────────────────────────────

const ReviewsTab: React.FC<{
  reviewsData: any;
  reviewsLoading: boolean;
  page: number;
  onPageChange: (p: number) => void;
  colors: any;
  borderRadius: any;
}> = ({ reviewsData, reviewsLoading, page, onPageChange, colors, borderRadius }) => {
  const summary = reviewsData?.summary;
  const reviews = reviewsData?.reviews ?? [];
  const pagination = reviewsData?.pagination;

  if (reviewsLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading reviews…</Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 16 }}>
      {/* Summary card */}
      {summary && summary.count > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.xl }]}>
          <View style={styles.summaryTop}>
            <View style={styles.avgBlock}>
              <Text style={[styles.avgNum, { color: colors.text }]}>
                {summary.average > 0 ? summary.average.toFixed(1) : '—'}
              </Text>
              <StarRating value={summary.average} size={18} />
              <Text style={[styles.reviewTotal, { color: colors.textMuted }]}>
                {summary.count} review{summary.count !== 1 ? 's' : ''}
              </Text>
            </View>
            {summary.breakdown && (
              <View style={styles.breakdownBlock}>
                {Object.entries(summary.breakdown).map(([k, v]) => (
                  <View key={k} style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: colors.textMuted }]}>{k}</Text>
                    <View style={[styles.breakdownTrack, { backgroundColor: colors.border }]}>
                      <View style={[styles.breakdownFill, { backgroundColor: '#FBBF24', width: `${((v as number) / 5) * 100}%` as any }]} />
                    </View>
                    <Text style={[styles.breakdownVal, { color: colors.text }]}>
                      {(v as number) > 0 ? (v as number).toFixed(1) : '—'}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <EmptyState icon="star-outline" message="No reviews yet" sub="Be the first to leave a review!" colors={colors} />
      ) : (
        <View style={{ gap: 10 }}>
          {reviews.map((r: any) => <ReviewCard key={r._id} review={r} />)}
        </View>
      )}

      {/* Pagination */}
      {(pagination?.totalPages ?? 1) > 1 && (
        <View style={styles.pagination}>
          <TouchableOpacity
            onPress={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            style={[styles.pageBtn, { borderColor: colors.border, borderRadius: borderRadius.md, opacity: page <= 1 ? 0.4 : 1 }]}
          >
            <Ionicons name="chevron-back" size={18} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.pageText, { color: colors.textSecondary }]}>
            {page} / {pagination.totalPages}
          </Text>
          <TouchableOpacity
            onPress={() => onPageChange(Math.min(pagination.totalPages, page + 1))}
            disabled={page >= pagination.totalPages}
            style={[styles.pageBtn, { borderColor: colors.border, borderRadius: borderRadius.md, opacity: page >= pagination.totalPages ? 0.4 : 1 }]}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.text} />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

// ─── Review Modal ─────────────────────────────────────────────────────────────

const ReviewModal: React.FC<{
  visible: boolean; onClose: () => void; onSubmit: () => void; isLoading: boolean;
  rating: number; setRating: (v: number) => void;
  comment: string; setComment: (v: string) => void;
  subRatings: Record<string, number>; setSubRatings: (v: any) => void;
  colors: any; borderRadius: any;
}> = ({ visible, onClose, onSubmit, isLoading, rating, setRating, comment, setComment, subRatings, setSubRatings, colors, borderRadius }) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalSheet, { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 }]}>
        {/* Handle */}
        <View style={[styles.modalHandle, { backgroundColor: colors.border }]} />
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Write a Review</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close" size={24} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Overall Rating *</Text>
          <View style={{ marginBottom: 4 }}>
            <StarRating value={rating} size={40} interactive onChange={setRating} />
          </View>
          {rating === 0 && <Text style={{ fontSize: 11, color: '#EF4444', marginBottom: 12 }}>Please select a rating</Text>}

          <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Comment (optional)</Text>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={[styles.commentInput, { backgroundColor: colors.inputBg, borderColor: colors.border, color: colors.text, borderRadius: borderRadius.md }]}
            placeholder="Share your experience…"
            placeholderTextColor={colors.placeholder}
          />

          <Text style={[styles.modalLabel, { color: colors.textSecondary, marginTop: 16 }]}>Detailed Ratings (optional)</Text>
          {Object.keys(subRatings).map((key) => (
            <View key={key} style={styles.subRatingRow}>
              <Text style={[styles.subRatingLabel, { color: colors.text, textTransform: 'capitalize' }]}>{key}</Text>
              <StarRating value={subRatings[key]} size={24} interactive
                onChange={(v) => setSubRatings((prev: any) => ({ ...prev, [key]: v }))} />
            </View>
          ))}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={isLoading || rating === 0}
            style={[styles.submitBtn, {
              backgroundColor: isLoading || rating === 0 ? colors.border : colors.primary,
              borderRadius: borderRadius.xl, marginTop: 20, marginBottom: 8,
            }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="star" size={16} color="#fff" />
                <Text style={styles.submitBtnText}>Submit Review</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// ─── Shared sub-components ────────────────────────────────────────────────────

const Section: React.FC<{ title: string; icon: any; children: React.ReactNode; colors: any }> = ({ title, icon, children, colors }) => (
  <View>
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={16} color={colors.primary} />
      <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const InfoRow: React.FC<{ label: string; value: string; colors: any }> = ({ label, value, colors }) => (
  <View style={styles.infoRow}>
    <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.infoVal, { color: colors.text, textTransform: 'capitalize' }]}>{value}</Text>
  </View>
);

const EmptyState: React.FC<{ icon: any; message: string; sub?: string; colors: any }> = ({ icon, message, sub, colors }) => (
  <View style={styles.empty}>
    <Ionicons name={icon} size={48} color={colors.textMuted} />
    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{message}</Text>
    {sub ? <Text style={[styles.emptySub, { color: colors.textMuted }]}>{sub}</Text> : null}
  </View>
);

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 20 },
  loadingText: { fontSize: 13, marginTop: 8 },
  notFoundText: { fontSize: 17, fontWeight: '600' },
  goBackBtn: { paddingHorizontal: 24, paddingVertical: 12 },
  goBackText: { color: '#fff', fontWeight: '700', fontSize: 14 },

  navbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 10, borderBottomWidth: 1 },
  navBtn: { padding: 8, width: 44, alignItems: 'center', justifyContent: 'center' },
  navBtnRight: { alignItems: 'flex-end' },
  navTitle: { fontSize: 16, fontWeight: '700', flex: 1, textAlign: 'center' },

  heroCover: { height: 80, backgroundColor: '#1a2744', position: 'absolute', top: 0, left: 0, right: 0 },
  hero: { paddingBottom: 20, borderBottomWidth: 1 },
  heroContent: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 44 },
  avatarWrapper: { position: 'relative', marginBottom: 12 },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3 },
  avatarPlaceholder: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontSize: 30, fontWeight: '800' },
  onlineDot: { position: 'absolute', bottom: 2, right: 2, width: 14, height: 14, borderRadius: 7, borderWidth: 2 },
  name: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  profession: { fontSize: 14, fontWeight: '500', textAlign: 'center', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  ratingNum: { fontSize: 15, fontWeight: '700' },
  ratingCount: { fontSize: 12 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'center', marginTop: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  chipText: { fontSize: 12, fontWeight: '600' },
  availDot: { width: 6, height: 6, borderRadius: 3 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  locationText: { fontSize: 12 },
  reviewBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 11, marginTop: 14 },
  reviewBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 14, borderBottomWidth: 1 },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: 17, fontWeight: '800' },
  statLbl: { fontSize: 10 },

  tabBar: { borderBottomWidth: 1 },
  tabBtn: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 5 },
  tabText: { fontSize: 13 },
  tabBadge: { paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10, minWidth: 20, alignItems: 'center' },
  tabBadgeText: { fontSize: 10, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  bodyText: { fontSize: 14 },
  tagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  skillTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  skillTagText: { fontSize: 12, fontWeight: '600' },
  techTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1 },
  techTagText: { fontSize: 11, fontWeight: '500' },

  timelineCard: { padding: 12, borderWidth: 1 },
  timelineTitle: { fontSize: 13, fontWeight: '700' },
  timelineSub: { fontSize: 12, marginTop: 2 },
  timelineDate: { fontSize: 11, marginTop: 2 },
  timelineDesc: { fontSize: 12, lineHeight: 17, marginTop: 6 },

  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  infoLabel: { fontSize: 13 },
  infoVal: { fontSize: 13, fontWeight: '600' },
  webRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  webText: { flex: 1, fontSize: 13 },

  portfolioCard: { borderWidth: 1, overflow: 'hidden' },
  portfolioImg: { width: '100%', height: 160 },
  portfolioTitleRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  portfolioTitle: { fontSize: 14, fontWeight: '700' },
  portfolioDesc: { fontSize: 13, lineHeight: 18 },
  portfolioMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  portfolioMetaText: { fontSize: 11 },
  featuredBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 10 },
  featuredText: { fontSize: 9, fontWeight: '800', color: '#fff' },

  serviceCard: { padding: 14, borderWidth: 1.5 },
  serviceHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  serviceIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  serviceTitle: { fontSize: 14, fontWeight: '700' },
  serviceCat: { fontSize: 11, marginTop: 2 },
  servicePrice: { fontSize: 15, fontWeight: '800' },
  serviceDesc: { fontSize: 13, lineHeight: 18, marginBottom: 6 },
  serviceDeliveryRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  serviceDelivery: { fontSize: 11 },

  certCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1 },
  certIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  certName: { fontSize: 13, fontWeight: '700' },
  certIssuer: { fontSize: 11, marginTop: 2 },

  summaryCard: { padding: 16, borderWidth: 1 },
  summaryTop: { flexDirection: 'row', gap: 16 },
  avgBlock: { alignItems: 'center', minWidth: 80, gap: 4 },
  avgNum: { fontSize: 40, fontWeight: '800', lineHeight: 44 },
  reviewTotal: { fontSize: 11, marginTop: 2 },
  breakdownBlock: { flex: 1, gap: 5 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  breakdownLabel: { fontSize: 10, width: 80, textTransform: 'capitalize' },
  breakdownTrack: { flex: 1, height: 5, borderRadius: 3, overflow: 'hidden' },
  breakdownFill: { height: '100%', borderRadius: 3 },
  breakdownVal: { fontSize: 10, width: 24, textAlign: 'right', fontWeight: '600' },

  pagination: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: 8 },
  pageBtn: { padding: 8, borderWidth: 1 },
  pageText: { fontSize: 13, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalSheet: { maxHeight: '92%', padding: 20 },
  modalHandle: { width: 40, height: 4, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: '800' },
  modalLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8 },
  commentInput: { borderWidth: 1.5, padding: 12, fontSize: 14, minHeight: 100, marginBottom: 4 },
  subRatingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  subRatingLabel: { fontSize: 13, width: 110 },
  submitBtn: { paddingVertical: 15, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: '800' },

  empty: { alignItems: 'center', gap: 8, paddingVertical: 48 },
  emptyText: { fontSize: 15, fontWeight: '600' },
  emptySub: { fontSize: 12, textAlign: 'center' },
});