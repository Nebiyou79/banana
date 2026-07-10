/**
 * screens/company/CompanyDashboardScreen.tsx
 *
 * Wired to real data from:
 *   • companyService.getDashboardStats()  → totalJobs, activeJobs, totalApplications,
 *                                            newApplications, shortlisted, hired
 *   • companyService.getMyJobs()          → recent job rows (title, status, applicationCount, deadline)
 *   • useProfile / useMyVerificationStatus → avatar, name, verification badge
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl, Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { companyService, type CompanyJob, type CompanyStats } from '../../services/companyService';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService } from '../../services/verificationService';
import { initials as getInitials } from '../../theme/text';
import StatCard from '../../components/shared/StatCard';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;
const ACC = '#6366F1'; // indigo accent for company role

// ─── Job row ──────────────────────────────────────────────────────────────────

const CompanyJobRow: React.FC<{ item: CompanyJob; onPress: () => void }> = React.memo(
  ({ item, onPress }) => {
    const { theme } = useThemeStore();
    const isActive = item.status === 'active';
    const count = item.applicationCount ?? 0;
    return (
      <TouchableOpacity
        style={[dsh.jobRow, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{item.title}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={[dsh.pill, { backgroundColor: isActive ? '#10B98118' : theme.colors.border }]}>
              <Text style={{ color: isActive ? '#10B981' : theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                {item.status}
              </Text>
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
              {count} applicant{count !== 1 ? 's' : ''}
            </Text>
            {item.deadline && (
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                Due {new Date(item.deadline).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={15} color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  },
);

// ─── Quick action ─────────────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: string; label: string; sub?: string; color: string; onPress: () => void;
}> = React.memo(({ icon, label, sub, color, onPress }) => {
  const { theme } = useThemeStore();
  return (
    <TouchableOpacity
      style={[dsh.qa, { backgroundColor: color + '10', borderColor: color + '28' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[dsh.qaIcon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        {sub ? <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{sub}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export const CompanyDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data: profile } = useProfile();
  const { data: verificationData } = useMyVerificationStatus();

  // ── Real data queries ──────────────────────────────────────────────────────
  const {
    data: stats,
    isLoading: sLoad,
    refetch: rs,
  } = useQuery<CompanyStats>({
    queryKey: ['company', 'stats'],
    queryFn: companyService.getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: jobs,
    isLoading: jLoad,
    refetch: rj,
  } = useQuery<CompanyJob[]>({
    queryKey: ['company', 'jobs'],
    queryFn: companyService.getMyJobs,
    staleTime: 5 * 60 * 1000,
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const completion = profile?.profileCompletion?.percentage ?? 0;
  const recentJobs = (jobs ?? []).slice(0, 5);
  const isLoading = sLoad || jLoad;

  const vStatus = verificationData?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial = vStatus === 'partial';
  const badgeConfig = verificationService.getBadgeConfig(vStatus);

  const avatarUrl = profile?.avatar?.secure_url ?? null;
  const userInitials = getInitials(user?.name ?? 'C');

  // Highlight cards: shortlisted and hired come from real stats
  const shortlisted = stats?.shortlisted ?? 0;
  const hired = stats?.hired ?? 0;

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    rs(); rj();
  }, [qc, rs, rj]);

  const renderJob = useCallback(({ item }: { item: CompanyJob }) => (
    <CompanyJobRow
      item={item}
      onPress={() =>
        navigation.navigate('ApplicationList', { jobId: item._id, jobTitle: item.title })
      }
    />
  ), [navigation]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={ACC} />}
    >
      {/* ── Header ── */}
      <View style={[dsh.headerContainer, { paddingHorizontal: spacing[5] }]}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, fontWeight: '500' }}>Welcome back</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] ?? 'Company'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('EditProfile')} activeOpacity={0.85}>
          <View style={[dsh.avatarContainer, { backgroundColor: ACC + '18' }]}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={dsh.avatar} />
            ) : (
              <Text style={[dsh.avatarText, { color: ACC }]}>{userInitials}</Text>
            )}
            {isVerified && (
              <View style={[dsh.verifiedBadge, { backgroundColor: '#10B981' }]}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>

      {/* ── Verification banner ── */}
      {!isVerified && (
        <TouchableOpacity
          onPress={() => navigation.navigate('RoleVerification')}
          style={[dsh.verifyBanner, {
            backgroundColor: badgeConfig.bgColor,
            borderColor: badgeConfig.color,
            marginHorizontal: spacing[5],
            marginBottom: spacing[4],
          }]}
        >
          <Ionicons name={badgeConfig.icon} size={20} color={badgeConfig.color} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={{ fontWeight: '700', color: badgeConfig.color }}>{badgeConfig.label}</Text>
            <Text style={{ fontSize: 12, color: colors.textMuted }}>
              {isPartial
                ? 'Complete remaining steps to get fully verified'
                : 'Get verified to build trust with candidates'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={badgeConfig.color} />
        </TouchableOpacity>
      )}

      {/* ── Profile completeness ── */}
      <View style={[dsh.card, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: spacing[5] }]}>
        <View style={dsh.row}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>Company profile</Text>
          <Text style={{ color: ACC, fontWeight: '800', fontSize: typography.sm }}>{completion}%</Text>
        </View>
        <View style={[dsh.barBg, { backgroundColor: colors.border }]}>
          <View style={[dsh.barFill, { width: `${completion}%` as any, backgroundColor: ACC }]} />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }}>
          {completion < 100 ? 'Complete your profile to attract top candidates' : '✓ Profile complete'}
        </Text>
      </View>

      {/* ── Overview stats — 6 real values ── */}
      <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Overview</Text>
      </View>

      {isLoading ? (
        <View style={[dsh.skeleRow, { paddingHorizontal: spacing[5] }]}>
          {[0, 1, 2, 3].map(k => <SkeletonCard key={k} height={88} style={{ flex: 1 }} />)}
        </View>
      ) : (
        <>
          <View style={[dsh.grid, { paddingHorizontal: spacing[5] }]}>
            <StatCard label="Jobs" value={stats?.totalJobs ?? 0} icon="briefcase-outline" color={ACC} />
            <StatCard label="Active" value={stats?.activeJobs ?? 0} icon="radio-button-on" color="#10B981" />
            <StatCard label="Applications" value={stats?.totalApplications ?? 0} icon="document-text-outline" color="#F59E0B" />
            <StatCard label="New Today" value={stats?.newApplications ?? 0} icon="notifications-outline" color="#EF4444" />
          </View>
          {/* Secondary row: shortlisted + hired */}
          <View style={[dsh.grid, { paddingHorizontal: spacing[5], marginTop: 10 }]}>
            <StatCard label="Shortlisted" value={shortlisted} icon="star-outline" color="#8B5CF6" />
            <StatCard label="Hired" value={hired} icon="checkmark-circle-outline" color="#10B981" />
          </View>
        </>
      )}

      {/* ── Quick actions ── */}
      <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Quick Actions</Text>
      </View>
      <View style={{ paddingHorizontal: spacing[5], gap: 10, marginBottom: 20 }}>
        <QuickAction
          icon="add-circle-outline"
          label="Post a Job"
          sub="Full-time, part-time, contract"
          color={ACC}
          onPress={() => navigation.navigate('CreateJob')}
        />
        <QuickAction
          icon="people-outline"
          label="View Applications"
          sub="Review and manage candidates"
          color="#6366F1"
          onPress={() => navigation.navigate('CompanyJobList')}
        />
        <QuickAction
          icon="analytics-outline"
          label="Hiring Pipeline"
          sub="Track shortlisted & hired"
          color="#F59E0B"
          onPress={() => navigation.navigate('CompanyJobList')}
        />
        {!isVerified && (
          <QuickAction
            icon="shield-checkmark-outline"
            label={isPartial ? 'Complete Verification' : 'Get Verified'}
            sub="Boost trust with candidates"
            color={isPartial ? '#F59E0B' : '#10B981'}
            onPress={() => navigation.navigate('RoleVerification')}
          />
        )}
      </View>

      {/* ── Recent postings ── */}
      {recentJobs.length > 0 && (
        <>
          <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Recent Postings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CompanyJobList')}>
              <Text style={{ color: ACC, fontSize: typography.xs, fontWeight: '600' }}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: recentJobs.length * 90, paddingHorizontal: spacing[5] }}>
            <FlashList
              data={recentJobs}
              renderItem={renderJob}
              keyExtractor={item => item._id}
              scrollEnabled={false}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const dsh = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatarContainer: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontSize: 20, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1 },
  card: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barBg: { height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 8, borderRadius: 99 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeleRow: { flexDirection: 'row', gap: 10 },
  jobRow: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  pill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  qa: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  qaIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});