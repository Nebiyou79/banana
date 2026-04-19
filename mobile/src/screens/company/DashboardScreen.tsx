/**
 * screens/company/DashboardScreen.tsx
 *
 * Command Center for the Company role.
 * ─ Animated skeleton loading for stats
 * ─ FlashList job rows with applicant counts
 * ─ Quick-action buttons: Post Job, View Applicants, Verification
 * ─ Profile strength card
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile }    from '../../hooks/useProfile';
import { companyService } from '../../services/companyService';
import {  SkeletonCard } from '../../components/shared/ProfileAtoms';
import { formatLocation } from '../../utils/jobHelpers';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';
import { StatCard } from '../../components/shared/StatCard';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;
const C_ACCENT = '#3B82F6';

// ─── Job Row (FlashList item) ─────────────────────────────────────────────────

interface JobRowProps {
  title:     string;
  location:  string;
  jobType:   string;
  status:    string;
  applicants: number;
  onPress:   () => void;
}

const JobRow: React.FC<JobRowProps> = React.memo(
  ({ title, location, jobType, status, applicants, onPress }) => {
    const { theme } = useThemeStore();
    const isActive = status === 'active';
    return (
      <TouchableOpacity
        style={[jr.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{title}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11, marginTop: 2 }}>
            {location}{jobType ? ` · ${jobType}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={[jr.pill, { backgroundColor: isActive ? '#10B98118' : theme.colors.border }]}>
              <Text style={{ color: isActive ? '#10B981' : theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                {status}
              </Text>
            </View>
            <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
              {applicants} applicant{applicants !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
      </TouchableOpacity>
    );
  },
);

// ─── Quick Action Button ──────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: string; label: string; sublabel?: string;
  color: string; onPress: () => void;
}> = React.memo(({ icon, label, sublabel, color, onPress }) => {
  const { theme } = useThemeStore();
  return (
    <TouchableOpacity
      style={[qa.btn, { backgroundColor: color + '10', borderColor: color + '28' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[qa.icon, { backgroundColor: color + '1A' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        {sublabel ? <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{sublabel}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CompanyDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }  = useAuthStore();
  const navigation = useNavigation<Nav>();
  const qc         = useQueryClient();

  const { data: profile }                   = useProfile();
  const { data: stats, isLoading: sLoad, refetch: refetchStats } = useQuery({
    queryKey: ['company', 'stats'],
    queryFn:  companyService.getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });
  const { data: jobs, isLoading: jLoad, refetch: refetchJobs } = useQuery({
    queryKey: ['company', 'jobs'],
    queryFn:  companyService.getMyJobs,
    staleTime: 5 * 60 * 1000,
  });

  const completion = profile?.profileCompletion?.percentage ?? 0;
  const recentJobs = (jobs ?? []).slice(0, 6);

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    refetchStats();
    refetchJobs();
  }, [qc, refetchStats, refetchJobs]);

  const renderJob = useCallback(({ item }: { item: typeof recentJobs[0] }) => (
    <JobRow
      title={item.title}
      location={formatLocation(item.location)}
      jobType={item.jobType ?? ''}
      status={item.status}
      applicants={item.applicationCount ?? 0}
      onPress={() => navigation.navigate('ApplicationList', { jobId: item._id, jobTitle: item.title })}
    />
  ), [navigation]);

  const isLoading = sLoad || jLoad;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={C_ACCENT} />
      }
    >
      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={[s.headerRow, { paddingHorizontal: spacing[5] }]}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, fontWeight: '500' }}>Welcome back 👋</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] ?? 'Company'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.avatarBtn, { backgroundColor: C_ACCENT + '18' }]}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="business" size={20} color={C_ACCENT} />
        </TouchableOpacity>
      </View>

      {/* ── Profile completeness ─────────────────────────────────────── */}
      <View style={[s.strengthCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: spacing[5] }]}>
        <View style={s.row}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>Company profile</Text>
          <Text style={{ color: C_ACCENT, fontWeight: '800', fontSize: typography.sm }}>{completion}%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}>
          <View style={[s.barFill, { width: `${completion}%` as any, backgroundColor: C_ACCENT }]} />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }}>
          {completion < 100 ? 'Complete your profile to attract better talent' : '✓ Profile complete'}
        </Text>
      </View>

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Overview</Text>
      </View>

      {isLoading ? (
        <View style={[s.skeletonRow, { paddingHorizontal: spacing[5] }]}>
          {[0, 1, 2, 3].map((k) => <SkeletonCard key={k} height={88} style={{ flex: 1 }} />)}
        </View>
      ) : (
        <View style={[s.statsGrid, { paddingHorizontal: spacing[5] }]}>
          <StatCard label="Jobs"         value={stats?.totalJobs ?? 0}         icon="briefcase-outline"     color={C_ACCENT}  />
          <StatCard label="Active"       value={stats?.activeJobs ?? 0}        icon="radio-button-on"       color="#10B981"   />
          <StatCard label="Applications" value={stats?.totalApplications ?? 0} icon="document-text-outline" color="#F59E0B"   />
          <StatCard label="New Today"    value={stats?.newApplications ?? 0}   icon="notifications-outline" color="#EF4444"   />
        </View>
      )}

      {/* ── Quick Actions ────────────────────────────────────────────── */}
      <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Quick Actions</Text>
      </View>
      <View style={{ paddingHorizontal: spacing[5], gap: 10 }}>
        <QuickAction icon="add-circle-outline"   label="Post a New Job"      sublabel="Reach thousands of candidates" color={C_ACCENT}  onPress={() => navigation.navigate('CreateJob')}          />
        <QuickAction icon="people-outline"        label="View All Applicants" sublabel="Review pending applications"   color="#6366F1"   onPress={() => navigation.navigate('CompanyJobList')}      />
        <QuickAction icon="shield-checkmark-outline" label="Verification"    sublabel="Build trust with candidates"   color="#10B981"   onPress={() => navigation.navigate('VerificationStatus')}  />
      </View>

      {/* ── Recent Jobs (FlashList) ──────────────────────────────────── */}
      {recentJobs.length > 0 && (
        <>
          <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Recent Jobs</Text>
            <TouchableOpacity onPress={() => navigation.navigate('CompanyJobList')}>
              <Text style={{ color: C_ACCENT, fontSize: typography.xs, fontWeight: '600' }}>See all →</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: recentJobs.length * 90, paddingHorizontal: spacing[5] }}>
            <FlashList
              data={recentJobs}
              renderItem={renderJob}
              keyExtractor={(item) => item._id}
              scrollEnabled={false}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  headerRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  avatarBtn:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  strengthCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 28 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barBg:        { height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill:      { height: 8, borderRadius: 99 },
  sectionHeader:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  statsGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow:  { flexDirection: 'row', gap: 10 },
});

const jr = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  pill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
});

const qa = StyleSheet.create({
  btn:  { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});