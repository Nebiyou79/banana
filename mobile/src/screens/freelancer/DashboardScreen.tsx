/**
 * screens/freelancer/DashboardScreen.tsx
 * Uses updated hooks and service from the corrected freelancerService.ts.
 */
import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  Image, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProfile, useVerificationStatus } from '../../hooks/useProfile';
import {
  useFreelancerDashboard,
  useFreelancerStats,
  useFreelancerPortfolio,
  useFreelancerServices,
} from '../../hooks/useFreelancer';
import { getOptimizedUrl } from '../../services/freelancerService';
import type { FreelancerStackParamList } from '../../navigation/FreelancerNavigator';

type Nav = NativeStackNavigationProp<FreelancerStackParamList>;

const ACCENT = '#10B981';

// ─── Sub-components ───────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title, actionLabel, onAction }) => {
  const { theme } = useThemeStore();
  return (
    <View style={s.sectionHeader}>
      <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: theme.typography.base }}>
        {title}
      </Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={{ color: ACCENT, fontSize: theme.typography.sm, fontWeight: '600' }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const MetricCard: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  value: string | number;
  label: string;
  color?: string;
}> = ({ icon, value, label, color = ACCENT }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={[s.metricCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.metricIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ color: colors.text, fontWeight: '800', fontSize: theme.typography.xl, marginTop: 6 }}>
        {value}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 10, textAlign: 'center' }}>{label}</Text>
    </View>
  );
};

const PerformanceBar: React.FC<{ label: string; value: number; color?: string }> = ({
  label, value, color = ACCENT,
}) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={{ marginBottom: 12 }}>
      <View style={s.perfRow}>
        <Text style={{ color: colors.text, fontSize: theme.typography.sm, fontWeight: '500' }}>{label}</Text>
        <Text style={{ color, fontWeight: '700', fontSize: theme.typography.sm }}>{value}%</Text>
      </View>
      <View style={[s.barBg, { backgroundColor: colors.border }]}>
        <View style={[s.barFill, { width: `${Math.min(value, 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const QuickAction: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  desc: string;
  color: string;
  onPress: () => void;
}> = ({ icon, label, desc, color, onPress }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[s.quickAction, { backgroundColor: colors.surface, borderColor: colors.border }]}
    >
      <View style={[s.qaIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: theme.typography.sm }}>{label}</Text>
        <Text style={{ color: colors.textMuted, fontSize: theme.typography.xs, marginTop: 1 }} numberOfLines={1}>
          {desc}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
    </TouchableOpacity>
  );
};

// ─── Screen ───────────────────────────────────────────────────────────────────

export const FreelancerDashboardScreen: React.FC = () => {
  const { theme }  = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }   = useAuthStore();
  const navigation = useNavigation<Nav>();

  const { data: profile, refetch: refetchProfile }        = useProfile();
  const { data: verification }                            = useVerificationStatus();
  const { data: dashboard, isLoading, refetch: refetchDB } = useFreelancerDashboard();
  const { data: stats }                                   = useFreelancerStats();
  const { data: portfolioData }                           = useFreelancerPortfolio({ limit: 5 });
  const { data: services = [] }                           = useFreelancerServices();

  const avatarUrl = (profile as any)?.avatar?.secure_url ?? (profile as any)?.user?.avatar ?? '';
  const initials  = (user?.name ?? 'F').split(' ').map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);

  const completion = dashboard?.stats?.profile?.completion ?? 0;
  const isVerified = verification?.verificationStatus === 'full';
  const isPartial  = verification?.verificationStatus === 'partial';
  const portfolioItems = portfolioData?.items ?? [];

  const onRefresh = useCallback(async () => {
    await Promise.all([refetchProfile(), refetchDB()]);
  }, [refetchProfile, refetchDB]);

  const getCompletionColor = (pct: number) => {
    if (pct >= 80) return ACCENT;
    if (pct >= 60) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={ACCENT} />}
    >
      {/* Hero */}
      <View style={[s.hero, { backgroundColor: ACCENT }]}>
        <View style={s.heroTop}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: '#ffffff90', fontSize: typography.sm, fontWeight: '500' }}>Welcome back 👋</Text>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: typography['2xl'], marginTop: 2 }} numberOfLines={1}>
              {user?.name ?? 'Freelancer'}
            </Text>
            {(profile as any)?.headline && (
              <Text style={{ color: '#ffffff90', fontSize: typography.sm, marginTop: 2 }} numberOfLines={1}>
                {(profile as any).headline}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
            <View style={s.heroAvatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFillObject} />
              ) : (
                <Text style={{ color: ACCENT, fontWeight: '800', fontSize: typography.lg }}>{initials}</Text>
              )}
              {isVerified && (
                <View style={s.verifiedDot}>
                  <Ionicons name="checkmark" size={8} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {!isVerified && (
          <TouchableOpacity
            onPress={() => navigation.navigate('VerificationStatus')}
            style={[s.verifyBanner, { backgroundColor: 'rgba(255,255,255,0.2)' }]}
          >
            <Ionicons name="shield-outline" size={14} color="#fff" />
            <Text style={{ color: '#fff', fontSize: typography.xs, fontWeight: '600', marginLeft: 6, flex: 1 }}>
              {isPartial ? 'Continue verification to unlock more features' : 'Verify your profile to build client trust'}
            </Text>
            <Ionicons name="chevron-forward" size={12} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <View style={{ padding: spacing[4] }}>
        {/* Profile Strength */}
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.row}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.sm }}>Profile Strength</Text>
            <Text style={{ color: getCompletionColor(completion), fontWeight: '800', fontSize: typography.base }}>
              {completion}%{completion >= 90 ? ' 🎉' : completion >= 80 ? ' 👍' : completion >= 60 ? ' 📈' : ' 🚀'}
            </Text>
          </View>
          <View style={[s.barBg, { backgroundColor: colors.border, marginBottom: 10 }]}>
            <View style={[s.barFill, { width: `${completion}%`, backgroundColor: getCompletionColor(completion) }]} />
          </View>
          <View style={s.completionMeta}>
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>
              {completion >= 80 ? 'Great! Your profile is highly visible' : `${80 - completion}% more to unlock better visibility`}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('EditProfile')}>
              <Text style={{ color: ACCENT, fontSize: typography.xs, fontWeight: '700' }}>Improve →</Text>
            </TouchableOpacity>
          </View>
          {(dashboard?.profileStrength?.suggestions?.length ?? 0) > 0 && (
            <View style={[s.suggestionsList, { borderTopColor: colors.border }]}>
              {dashboard!.profileStrength.suggestions.slice(0, 3).map((sg, i) => (
                <View key={i} style={s.suggestionItem}>
                  <View style={[s.suggestionDot, { backgroundColor: '#F59E0B' }]} />
                  <Text style={{ color: colors.textMuted, fontSize: typography.xs, flex: 1 }}>{sg}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Overview Metrics */}
        <SectionHeader title="Overview" />
        <View style={s.metricsRow}>
          <MetricCard icon="eye-outline"    value={dashboard?.stats?.profile?.views ?? 0} label="Profile Views" color="#6366F1" />
          <MetricCard icon="images-outline" value={dashboard?.stats?.portfolio?.total ?? 0} label="Portfolio" color={ACCENT} />
          <MetricCard icon="star-outline"   value={dashboard?.stats?.ratings?.average?.toFixed(1) ?? '—'} label="Avg Rating" color="#F59E0B" />
          <MetricCard icon="send-outline"   value={dashboard?.stats?.proposals?.sent ?? 0} label="Proposals" color="#3B82F6" />
        </View>

        {/* Performance */}
        {stats && (
          <>
            <SectionHeader title="Performance" />
            <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <PerformanceBar label="Job Success Rate" value={stats.jobSuccessScore} color={ACCENT} />
              <PerformanceBar label="On-Time Delivery" value={stats.onTimeDelivery}  color="#3B82F6" />
              <PerformanceBar label="Response Rate"    value={stats.responseRate}    color="#6366F1" />
              <PerformanceBar label="Profile Strength" value={stats.profileStrength} color="#F59E0B" />
            </View>
          </>
        )}

        {/* Earnings */}
        <View style={s.earningsRow}>
          <View style={[s.earningsCard, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40' }]}>
            <Ionicons name="wallet-outline" size={20} color={ACCENT} />
            <Text style={{ color: ACCENT, fontWeight: '800', fontSize: typography.xl, marginTop: 4 }}>
              ${(dashboard?.stats?.earnings?.total ?? 0).toLocaleString()}
            </Text>
            <Text style={{ color: ACCENT + 'aa', fontSize: typography.xs }}>Total Earnings</Text>
          </View>
          <View style={[s.earningsCard, { backgroundColor: '#6366F118', borderColor: '#6366F140' }]}>
            <Ionicons name="chatbubble-ellipses-outline" size={20} color="#6366F1" />
            <Text style={{ color: '#6366F1', fontWeight: '800', fontSize: typography.xl, marginTop: 4 }}>
              {dashboard?.stats?.ratings?.count ?? 0}
            </Text>
            <Text style={{ color: '#6366F1aa', fontSize: typography.xs }}>Client Reviews</Text>
          </View>
          <View style={[s.earningsCard, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B40' }]}>
            <Ionicons name="checkmark-done-outline" size={20} color="#F59E0B" />
            <Text style={{ color: '#F59E0B', fontWeight: '800', fontSize: typography.xl, marginTop: 4 }}>
              {dashboard?.stats?.proposals?.accepted ?? 0}
            </Text>
            <Text style={{ color: '#F59E0Baa', fontSize: typography.xs }}>Accepted</Text>
          </View>
        </View>

        {/* Active Services */}
        {services.length > 0 && (
          <>
            <SectionHeader title={`Services (${services.length})`} actionLabel="Manage" onAction={() => navigation.navigate('ServicesList')} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing[4] }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: spacing[4], gap: 10 }}>
                {services.slice(0, 6).map(svc => (
                  <View key={svc._id} style={[s.serviceChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.xs }} numberOfLines={1}>
                      {svc.title}
                    </Text>
                    {svc.price != null && (
                      <Text style={{ color: ACCENT, fontWeight: '700', fontSize: 10, marginTop: 2 }}>
                        ${svc.price}{svc.priceType === 'hourly' ? '/hr' : ''}
                      </Text>
                    )}
                    <View style={[s.activeDot, {
                      backgroundColor: svc.isActive !== false ? ACCENT : colors.textMuted,
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
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -spacing[4] }}>
              <View style={{ flexDirection: 'row', paddingHorizontal: spacing[4], gap: 12 }}>
                {portfolioItems.map(item => {
                  const cover = (item.mediaUrls ?? [])[0] ?? item.mediaUrl ?? '';
                  return (
                    <TouchableOpacity
                      key={item._id}
                      onPress={() => navigation.navigate('PortfolioDetails', { itemId: item._id })}
                      style={[s.portfolioCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      activeOpacity={0.85}
                    >
                      {cover ? (
                        <Image
                          source={{ uri: getOptimizedUrl(cover, 280, 180) }}
                          style={s.portfolioImg}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={[s.portfolioImg, { backgroundColor: ACCENT + '18', alignItems: 'center', justifyContent: 'center' }]}>
                          <Ionicons name="image-outline" size={24} color={ACCENT} />
                        </View>
                      )}
                      {item.featured && (
                        <View style={s.featuredBadge}>
                          <Ionicons name="star" size={8} color="#fff" />
                        </View>
                      )}
                      <View style={{ padding: 8 }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.xs }} numberOfLines={1}>
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
        <SectionHeader title="Quick Actions" />
        <QuickAction icon="images-outline"         label="Add Portfolio Project"   desc="Upload your latest work"              color={ACCENT}     onPress={() => navigation.navigate('AddPortfolio')} />
        <QuickAction icon="person-outline"          label="Update Profile"          desc="Improve visibility & completion"      color="#6366F1"    onPress={() => navigation.navigate('EditProfile')} />
        <QuickAction icon="briefcase-outline"       label="Add a Service"           desc="Tell clients what you offer"          color="#3B82F6"    onPress={() => navigation.navigate('ServicesList')} />
        <QuickAction icon="ribbon-outline"          label="Add Certification"       desc="Boost credibility with credentials"   color="#F59E0B"    onPress={() => navigation.navigate('CertificationsList')} />
        <QuickAction icon="star-outline"            label="View My Reviews"         desc="See what clients say about you"       color="#EC4899"    onPress={() => navigation.navigate('MyReviews')} />
        {!isVerified && (
          <QuickAction
            icon="shield-checkmark-outline"
            label={isPartial ? 'Complete Verification' : 'Get Verified'}
            desc="Build trust with clients"
            color={isPartial ? '#F59E0B' : '#EF4444'}
            onPress={() => navigation.navigate('VerificationStatus')}
          />
        )}

        {/* Pro Tips */}
        <View style={[s.tipsCard, { backgroundColor: '#0F172A', borderRadius: 16 }]}>
          <View style={s.row}>
            <Ionicons name="star" size={16} color="#F59E0B" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: typography.sm, marginLeft: 8 }}>Pro Tips</Text>
          </View>
          {[
            'Customize proposals for each project',
            'Reply to clients within 24 hours',
            'Add at least 5 portfolio items',
            'Ask for reviews after project completion',
          ].map((tip, i) => (
            <View key={i} style={s.tipItem}>
              <View style={s.tipDot} />
              <Text style={{ color: '#94A3B8', fontSize: typography.xs, flex: 1 }}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        {(dashboard?.recentActivities?.length ?? 0) > 0 && (
          <>
            <SectionHeader title="Recent Activity" />
            {dashboard!.recentActivities.slice(0, 4).map(activity => (
              <View
                key={activity.id}
                style={[s.activityItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              >
                <View style={[s.activityDot, {
                  backgroundColor: activity.status === 'success' ? ACCENT : '#F59E0B',
                }]} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>{activity.title}</Text>
                  <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{activity.description}</Text>
                </View>
                <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                  {new Date(activity.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  hero:           { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  heroTop:        { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  heroAvatar:     { width: 52, height: 52, borderRadius: 26, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', position: 'relative' },
  verifiedDot:    { position: 'absolute', bottom: 0, right: 0, width: 16, height: 16, borderRadius: 8, backgroundColor: '#10B981', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
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
  featuredBadge:  { position: 'absolute', top: 6, left: 6, width: 18, height: 18, borderRadius: 9, backgroundColor: '#F59E0B', alignItems: 'center', justifyContent: 'center' },
  quickAction:    { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10 },
  qaIcon:         { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  tipsCard:       { padding: 16, marginBottom: 20 },
  tipItem:        { flexDirection: 'row', alignItems: 'flex-start', marginTop: 10, gap: 8 },
  tipDot:         { width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#F59E0B', marginTop: 6 },
  activityItem:   { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8, gap: 10 },
  activityDot:    { width: 8, height: 8, borderRadius: 4 },
});