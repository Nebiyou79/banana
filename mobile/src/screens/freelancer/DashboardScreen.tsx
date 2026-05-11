/**
 * screens/freelancer/DashboardScreen.tsx
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import {
  useFreelancerDashboard,
  useFreelancerStats,
  useFreelancerPortfolio,
  useFreelancerServices,
} from '../../hooks/useFreelancer';
import { getOptimizedUrl } from '../../services/freelancerService';
import { useTheme } from '../../hooks/useTheme';
import { withAlpha } from '../../theme/utils';
import { FONT_SIZE } from '../../theme/tokens';
import { initials as getInitials } from '../../theme/text';
import { formatShortDate } from '../../theme/utils';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';
import type { ThemeColors } from '../../hooks/useTheme';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const shadow = (color: string) =>
  Platform.OS === 'ios'
    ? { shadowColor: color, shadowOpacity: 0.12, shadowOffset: { width: 0, height: 3 }, shadowRadius: 8 }
    : { elevation: 4 };

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  actionLabel?: string;
  onAction?: () => void;
  colors: ThemeColors;
}> = ({ title, actionLabel, onAction, colors }) => (
  <View style={s.sectionHeader}>
    <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>{title}</Text>
    {actionLabel && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ color: colors.freelancer, fontSize: FONT_SIZE.sm, fontWeight: '600' }}>
          {actionLabel}
        </Text>
      </TouchableOpacity>
    )}
  </View>
);

const MetricCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color: string;
  colors: ThemeColors;
}> = ({ icon, value, label, color, colors }) => (
  <View style={[s.metricCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
    <View style={[s.metricIcon, { backgroundColor: withAlpha(color, 0.10) }]}>
      <Ionicons name={icon} size={18} color={color} />
    </View>
    <Text style={{ color: colors.text, fontWeight: '800', fontSize: FONT_SIZE.xl, marginTop: 6 }}>
      {value}
    </Text>
    <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>{label}</Text>
  </View>
);

const PerformanceBar: React.FC<{
  label: string; value: number; color: string; colors: ThemeColors;
}> = ({ label, value, color, colors }) => (
  <View style={{ marginBottom: 12 }}>
    <View style={s.perfRow}>
      <Text style={{ color: colors.text, fontSize: FONT_SIZE.sm, fontWeight: '500' }}>{label}</Text>
      <Text style={{ color, fontWeight: '700', fontSize: FONT_SIZE.sm }}>{value}%</Text>
    </View>
    <View style={[s.barBg, { backgroundColor: colors.border }]}>
      <View style={[s.barFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
    </View>
  </View>
);

const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  onPress: () => void;
  colors: ThemeColors;
}> = ({ icon, label, desc, color, onPress, colors }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={[s.quickAction, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
  >
    <View style={[s.qaIcon, { backgroundColor: withAlpha(color, 0.10) }]}>
      <Ionicons name={icon} size={20} color={color} />
    </View>
    <View style={{ flex: 1, marginLeft: 12 }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.sm }}>{label}</Text>
      <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 1 }} numberOfLines={1}>
        {desc}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
  </TouchableOpacity>
);

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FreelancerDashboardScreen: React.FC = () => {
  const { colors, spacing, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, refetch: refetchProfile } = useProfile();
  const { data: verification } = useVerificationStatus();
  const { data: dashboard, isLoading, refetch: refetchDB } = useFreelancerDashboard();
  const { data: stats } = useFreelancerStats();
  const { data: portfolioData } = useFreelancerPortfolio({ limit: 5 });
  const { data: services = [] } = useFreelancerServices();

  const avatarUrl = (profile as any)?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? '';
  const userInitials = getInitials(user?.name ?? 'F');

  const completion = dashboard?.stats?.profile?.completion ?? 0;
  const isVerified = verification?.verificationStatus === 'full';
  const isPartial = verification?.verificationStatus === 'partial';
  const portfolioItems = portfolioData?.items ?? [];

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchDB()]);
  }, [refetchProfile, refetchDB]);

  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return colors.freelancer;
    if (pct >= 60) return colors.warning;
    return colors.danger;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.freelancer }} edges={['top']}>
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.bg }}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Hero */}
        <View style={[s.hero, {
          backgroundColor: colors.freelancer,
          paddingTop: spacing.lg,
          paddingBottom: spacing.xl,
          paddingHorizontal: spacing.xl,
        }]}>
          <View style={s.heroTop}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: withAlpha('#fff', 0.56), fontSize: FONT_SIZE.sm, fontWeight: '500' }}>
                Welcome back
              </Text>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: FONT_SIZE.xxl, marginTop: 2 }} numberOfLines={1}>
                {user?.name ?? 'Freelancer'}
              </Text>
              {(profile as any)?.headline && (
                <Text style={{ color: withAlpha('#fff', 0.56), fontSize: FONT_SIZE.sm, marginTop: 2 }} numberOfLines={1}>
                  {(profile as any).headline}
                </Text>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <View style={s.heroAvatar}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} />
                ) : (
                  <Text style={{ color: colors.freelancer, fontWeight: '800', fontSize: FONT_SIZE.lg }}>
                    {userInitials}
                  </Text>
                )}
                {isVerified && (
                  <View style={[s.verifiedDot, { backgroundColor: colors.success }]}>
                    <Ionicons name="checkmark" size={8} color="#fff" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          </View>

          {!isVerified && (
            <TouchableOpacity
              onPress={() => navigation.navigate('VerificationStatus')}
              style={[s.verifyBanner, { backgroundColor: withAlpha('#fff', 0.20) }]}
            >
              <Ionicons name="shield-outline" size={14} color="#fff" />
              <Text style={{ color: '#fff', fontSize: FONT_SIZE.xs, fontWeight: '600', marginLeft: 6, flex: 1 }}>
                {isPartial
                  ? 'Continue verification to unlock more features'
                  : 'Verify your profile to build client trust'}
              </Text>
              <Ionicons name="chevron-forward" size={12} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={{ padding: spacing.lg }}>
          {/* Profile Strength */}
          <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={s.row}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.sm }}>
                Profile Strength
              </Text>
              <Text style={{ color: getCompletionColor(completion), fontWeight: '800', fontSize: FONT_SIZE.base }}>
                {completion}%
              </Text>
            </View>
            <View style={[s.barBg, { backgroundColor: colors.border, marginBottom: 10 }]}>
              <View style={[s.barFill, {
                width: `${Math.min(completion, 100)}%`,
                backgroundColor: getCompletionColor(completion),
              }]} />
            </View>
            <View style={s.completionMeta}>
              <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs }}>
                {completion >= 80
                  ? 'Great! Your profile is highly visible'
                  : `${80 - completion}% more to unlock better visibility`}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
                <Text style={{ color: colors.freelancer, fontSize: FONT_SIZE.xs, fontWeight: '700' }}>
                  Improve
                </Text>
              </TouchableOpacity>
            </View>
            {(dashboard?.profileStrength?.suggestions?.length ?? 0) > 0 && (
              <View style={[s.suggestionsList, { borderTopColor: colors.border }]}>
                {dashboard!.profileStrength.suggestions.slice(0, 3).map((sg: string, i: number) => (
                  <View key={i} style={s.suggestionItem}>
                    <View style={[s.suggestionDot, { backgroundColor: colors.warning }]} />
                    <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, flex: 1 }}>{sg}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Overview Metrics */}
          <SectionHeader title="Overview" colors={colors} />
          <View style={s.metricsRow}>
            <MetricCard icon="eye-outline"    value={dashboard?.stats?.profile?.views ?? 0}                        label="Profile Views" color={colors.organization} colors={colors} />
            <MetricCard icon="images-outline" value={dashboard?.stats?.portfolio?.total ?? 0}                      label="Portfolio"     color={colors.freelancer}   colors={colors} />
            <MetricCard icon="star-outline"   value={dashboard?.stats?.ratings?.average?.toFixed(1) ?? '—'}       label="Avg Rating"   color={colors.warning}      colors={colors} />
            <MetricCard icon="send-outline"   value={dashboard?.stats?.proposals?.sent ?? 0}                      label="Proposals"    color={colors.candidate}    colors={colors} />
          </View>

          {/* Performance */}
          {stats && (
            <>
              <SectionHeader title="Performance" colors={colors} />
              <View style={[s.card, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                <PerformanceBar label="Job Success Rate" value={stats.jobSuccessScore} color={colors.freelancer}   colors={colors} />
                <PerformanceBar label="On-Time Delivery"  value={stats.onTimeDelivery}  color={colors.candidate}   colors={colors} />
                <PerformanceBar label="Response Rate"     value={stats.responseRate}    color={colors.organization} colors={colors} />
                <PerformanceBar label="Profile Strength"  value={stats.profileStrength} color={colors.warning}      colors={colors} />
              </View>
            </>
          )}

          {/* Earnings */}
          <View style={s.earningsRow}>
            <View style={[s.earningsCard, {
              backgroundColor: withAlpha(colors.freelancer, 0.10),
              borderColor: withAlpha(colors.freelancer, 0.25),
            }]}>
              <Ionicons name="wallet-outline" size={20} color={colors.freelancer} />
              <Text style={{ color: colors.freelancer, fontWeight: '800', fontSize: FONT_SIZE.xl, marginTop: 4 }}>
                ${(dashboard?.stats?.earnings?.total ?? 0).toLocaleString()}
              </Text>
              <Text style={{ color: withAlpha(colors.freelancer, 0.67), fontSize: FONT_SIZE.xs }}>Total Earnings</Text>
            </View>
            <View style={[s.earningsCard, {
              backgroundColor: withAlpha(colors.organization, 0.10),
              borderColor: withAlpha(colors.organization, 0.25),
            }]}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.organization} />
              <Text style={{ color: colors.organization, fontWeight: '800', fontSize: FONT_SIZE.xl, marginTop: 4 }}>
                {dashboard?.stats?.ratings?.count ?? 0}
              </Text>
              <Text style={{ color: withAlpha(colors.organization, 0.67), fontSize: FONT_SIZE.xs }}>Client Reviews</Text>
            </View>
            <View style={[s.earningsCard, {
              backgroundColor: withAlpha(colors.warning, 0.10),
              borderColor: withAlpha(colors.warning, 0.25),
            }]}>
              <Ionicons name="checkmark-done-outline" size={20} color={colors.warning} />
              <Text style={{ color: colors.warning, fontWeight: '800', fontSize: FONT_SIZE.xl, marginTop: 4 }}>
                {dashboard?.stats?.proposals?.accepted ?? 0}
              </Text>
              <Text style={{ color: withAlpha(colors.warning, 0.67), fontSize: FONT_SIZE.xs }}>Accepted</Text>
            </View>
          </View>

          {/* Active Services */}
          {services.length > 0 && (
            <>
              <SectionHeader
                title={`Services (${services.length})`}
                actionLabel="Manage"
                onAction={() => navigation.navigate('ServicesList')}
                colors={colors}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 10 }}>
                  {services.slice(0, 6).map((svc: any) => (
                    <View key={svc._id} style={[s.serviceChip, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                      <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.xs }} numberOfLines={1}>
                        {svc.title}
                      </Text>
                      {svc.price != null && (
                        <Text style={{ color: colors.freelancer, fontWeight: '700', fontSize: 10, marginTop: 2 }}>
                          ${svc.price}{svc.priceType === 'hourly' ? '/hr' : ''}
                        </Text>
                      )}
                      <View style={[s.activeDot, {
                        backgroundColor: svc.isActive !== false ? colors.freelancer : colors.textMuted,
                      }]} />
                    </View>
                  ))}
                </View>
              </ScrollView>
            </>
          )}

          {/* Recent Portfolio */}
          {portfolioItems.length > 0 && (
            <>
              <SectionHeader
                title="Portfolio"
                actionLabel={`See all (${portfolioData?.pagination?.total ?? 0})`}
                onAction={() => navigation.navigate('PortfolioList')}
                colors={colors}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing.lg }}>
                <View style={{ flexDirection: 'row', paddingHorizontal: spacing.lg, gap: 12 }}>
                  {portfolioItems.map((item: any) => {
                    const cover = (item.mediaUrls ?? [])[0] ?? item.mediaUrl ?? '';
                    return (
                      <TouchableOpacity
                        key={item._id}
                        onPress={() => navigation.navigate('PortfolioDetails', { itemId: item._id })}
                        style={[s.portfolioCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                        activeOpacity={0.85}
                      >
                        {cover ? (
                          <Image
                            source={{ uri: getOptimizedUrl(cover, 280, 180) }}
                            style={s.portfolioImg}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={[s.portfolioImg, {
                            backgroundColor: withAlpha(colors.freelancer, 0.10),
                            alignItems: 'center', justifyContent: 'center',
                          }]}>
                            <Ionicons name="image-outline" size={24} color={colors.freelancer} />
                          </View>
                        )}
                        {item.featured && (
                          <View style={[s.featuredBadge, { backgroundColor: colors.warning }]}>
                            <Ionicons name="star" size={8} color="#fff" />
                          </View>
                        )}
                        <View style={{ padding: 8 }}>
                          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.xs }} numberOfLines={1}>
                            {item.title}
                          </Text>
                          {item.client && (
                            <Text style={{ color: colors.textMuted, fontSize: 10 }} numberOfLines={1}>
                              {item.client}
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </>
          )}

          {/* Quick Actions */}
          <SectionHeader title="Quick Actions" colors={colors} />
          <QuickAction icon="images-outline"           label="Add Portfolio Project"  desc="Upload your latest work"             color={colors.freelancer}   onPress={() => navigation.navigate('AddPortfolio')}        colors={colors} />
          <QuickAction icon="person-outline"           label="Update Profile"         desc="Improve visibility & completion"     color={colors.organization} onPress={() => navigation.navigate('EditProfile')}         colors={colors} />
          <QuickAction icon="briefcase-outline"        label="Add a Service"          desc="Tell clients what you offer"         color={colors.candidate}    onPress={() => navigation.navigate('ServicesList')}        colors={colors} />
          <QuickAction icon="ribbon-outline"           label="Add Certification"      desc="Boost credibility with credentials"  color={colors.warning}      onPress={() => navigation.navigate('CertificationsList')}  colors={colors} />
          <QuickAction icon="star-outline"             label="View My Reviews"        desc="See what clients say about you"      color={colors.primary}      onPress={() => navigation.navigate('MyReviews')}           colors={colors} />
          {!isVerified && (
            <QuickAction
              icon="shield-checkmark-outline"
              label={isPartial ? 'Complete Verification' : 'Get Verified'}
              desc="Build trust with clients"
              color={isPartial ? colors.warning : colors.danger}
              onPress={() => navigation.navigate('VerificationStatus')}
              colors={colors}
            />
          )}

          {/* Pro Tips */}
          <View style={[s.tipsCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <View style={s.row}>
              <Ionicons name="star" size={16} color={colors.warning} />
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.sm, marginLeft: 8 }}>
                Pro Tips
              </Text>
            </View>
            {[
              'Customize proposals for each project',
              'Reply to clients within 24 hours',
              'Add at least 5 portfolio items',
              'Ask for reviews after project completion',
            ].map((tip, i) => (
              <View key={i} style={s.tipItem}>
                <View style={[s.tipDot, { backgroundColor: colors.warning }]} />
                <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, flex: 1 }}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* Recent Activity */}
          {(dashboard?.recentActivities?.length ?? 0) > 0 && (
            <>
              <SectionHeader title="Recent Activity" colors={colors} />
              {dashboard!.recentActivities.slice(0, 4).map((activity: any) => (
                <View
                  key={activity.id}
                  style={[s.activityItem, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                >
                  <View style={[s.activityDot, {
                    backgroundColor: activity.status === 'success' ? colors.freelancer : colors.warning,
                  }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: FONT_SIZE.sm }}>
                      {activity.title}
                    </Text>
                    <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs }}>
                      {activity.description}
                    </Text>
                  </View>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    {formatShortDate(activity.timestamp)}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  hero:           { },
  heroTop:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  verifiedDot:    { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  verifyBanner:   { flexDirection: 'row', alignItems: 'center', padding: 10, borderRadius: 10, gap: 6 },
  card:           { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20 },
  row:            { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  barBg:          { height: 6, borderRadius: 99, overflow: 'hidden' },
  barFill:        { height: 6, borderRadius: 99 },
  completionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  suggestionsList:{ borderTopWidth: 1, paddingTop: 12, marginTop: 12, gap: 8 },
  suggestionItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  suggestionDot:  { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  sectionHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  metricsRow:     { flexDirection: 'row', gap: 8, marginBottom: 20 },
  metricCard:     { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  metricIcon:     { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  perfRow:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  earningsRow:    { flexDirection: 'row', gap: 8, marginBottom: 20 },
  earningsCard:   { flex: 1, borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center' },
  serviceChip:    { width: 130, borderRadius: 12, borderWidth: 1, padding: 12, position: 'relative' },
  activeDot:      { position: 'absolute', top: 8, right: 8, width: 7, height: 7, borderRadius: 3.5 },
  portfolioCard:  { width: 150, borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
  portfolioImg:   { width: '100%', height: 100 },
  featuredBadge:  { position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  quickAction:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  qaIcon:         { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipsCard:       { padding: 16, marginBottom: 20, borderRadius: 16, borderWidth: 1 },
  tipItem:        { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 8 },
  tipDot:         { width: 5, height: 5, borderRadius: 2.5, marginTop: 6 },
  activityItem:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  activityDot:    { width: 8, height: 8, borderRadius: 4 },
});