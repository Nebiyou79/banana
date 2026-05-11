/**
 * src/screens/company/DashboardScreen.tsx
 * Fixed to show actual company name
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useProfile } from '../../hooks/useProfile';
import { companyService } from '../../services/companyService';
import { SkeletonCard } from '../../components/shared/ProfileAtoms';
import { formatLocation } from '../../utils/jobHelpers';
import type { CompanyStackParamList } from '../../navigation/CompanyNavigator';
import { StatCard } from '../../components/shared/StatCard';
import { FONT_SIZE } from '../../theme/tokens';
import { useMyVerificationStatus } from '../../hooks/useVerification';
import { verificationService } from '../../services/verificationService';
import { getUserDisplayName, getUserFirstName, getUserInitials } from '../../utils/userHelpers';

type Nav = NativeStackNavigationProp<CompanyStackParamList>;

// ─── Job Row ──────────────────────────────────────────────────────────────────

interface JobRowProps {
  title: string;
  location: string;
  jobType: string;
  status: string;
  applicants: number;
  onPress: () => void;
  colors: any;
}

const JobRow: React.FC<JobRowProps> = React.memo(
  ({ title, location, jobType, status, applicants, onPress, colors }) => {
    const isActive = status === 'active';
    return (
      <TouchableOpacity
        style={[jr.row, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.sm }}>
            {title}
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 2 }}>
            {location}{jobType ? ` · ${jobType}` : ''}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <View style={[jr.pill, { backgroundColor: isActive ? `${colors.success}18` : colors.border }]}>
              <Text style={{ color: isActive ? colors.success : colors.textMuted, fontSize: 10, fontWeight: '700' }}>
                {status}
              </Text>
            </View>
            <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs }}>
              {applicants} applicant{applicants !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    );
  },
);

// ─── Quick Action ─────────────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: string; label: string; sublabel?: string;
  color: string; onPress: () => void; colors: any;
}> = React.memo(({ icon, label, sublabel, color, onPress, colors }) => (
  <TouchableOpacity
    style={[qa.btn, { backgroundColor: `${color}10`, borderColor: `${color}28` }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[qa.icon, { backgroundColor: `${color}1A` }]}>
      <Ionicons name={icon as any} size={20} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.sm }}>{label}</Text>
      {sublabel ? (
        <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs }}>{sublabel}</Text>
      ) : null}
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
  </TouchableOpacity>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CompanyDashboardScreen: React.FC = () => {
  const { colors, spacing } = useTheme();
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();
  const insets = useSafeAreaInsets();

  const { data: profile } = useProfile();
  const { data: verificationData } = useMyVerificationStatus();
  const { data: stats, isLoading: sLoad, refetch: refetchStats } = useQuery({
    queryKey: ['company', 'stats'],
    queryFn: companyService.getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });
  const { data: jobs, isLoading: jLoad, refetch: refetchJobs } = useQuery({
    queryKey: ['company', 'jobs'],
    queryFn: companyService.getMyJobs,
    staleTime: 5 * 60 * 1000,
  });

  const completion = profile?.profileCompletion?.percentage ?? 0;
  const recentJobs = (jobs ?? []).slice(0, 6);
  const isLoading = sLoad || jLoad;
  
  // Get proper user display name
  const userDisplayName = getUserDisplayName(user);
  const userFirstName = getUserFirstName(user);
  const userInitials = getUserInitials(user);
  
  // Verification status
  const vStatus = verificationData?.verificationStatus ?? 'none';
  const isVerified = vStatus === 'full';
  const isPartial = vStatus === 'partial';
  const badgeConfig = verificationService.getBadgeConfig(vStatus);
  
  // Avatar and initials
  const avatarUrl = profile?.avatar?.secure_url ?? null;

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    refetchStats();
    refetchJobs();
  }, [qc, refetchStats, refetchJobs]);

  const renderJob = useCallback(
    ({ item }: { item: typeof recentJobs[0] }) => (
      <JobRow
        title={item.title}
        location={formatLocation(item.location)}
        jobType={item.jobType ?? ''}
        status={item.status}
        applicants={item.applicationCount ?? 0}
        colors={colors}
        onPress={() =>
          navigation.navigate('ApplicationList', { jobId: item._id, jobTitle: item.title })
        }
      />
    ),
    [navigation, colors],
  );

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: colors.bg }]} edges={['top']}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {/* Header with Avatar and Verification Badge */}
        <View style={[s.headerContainer, { paddingHorizontal: spacing.lg, paddingTop: spacing.lg }]}>
          <View style={s.headerLeft}>
            <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.sm, fontWeight: '500' }}>
              Welcome back
            </Text>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: FONT_SIZE.xxl, letterSpacing: -0.5 }} numberOfLines={1}>
              {userDisplayName || 'Company'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            activeOpacity={0.85}
          >
            <View style={[s.avatarContainer, { backgroundColor: `${colors.primary}18` }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={s.avatar} />
              ) : (
                <Text style={[s.avatarText, { color: colors.primary }]}>{userInitials}</Text>
              )}
              {/* Verification indicator */}
              {isVerified && (
                <View style={[s.verifiedBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={10} color="#fff" />
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        {/* Verification Status Banner */}
        {!isVerified && (
          <TouchableOpacity
            onPress={() => navigation.navigate('RoleVerification')}
            style={[s.verifyBanner, { 
              backgroundColor: badgeConfig.bgColor, 
              borderColor: badgeConfig.color,
              marginHorizontal: spacing.lg,
              marginTop: spacing.md,
            }]}
          >
            <Ionicons name={badgeConfig.icon} size={20} color={badgeConfig.color} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={{ fontWeight: '700', color: badgeConfig.color }}>
                {badgeConfig.label}
              </Text>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>
                {isPartial 
                  ? 'Complete remaining steps to get fully verified'
                  : 'Get verified to attract more candidates'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={badgeConfig.color} />
          </TouchableOpacity>
        )}

        {/* Profile completeness */}
        <View style={[s.strengthCard, { backgroundColor: colors.bgCard, borderColor: colors.border, marginHorizontal: spacing.lg, marginTop: spacing.lg }]}>
          <View style={s.row}>
            <Text style={{ color: colors.text, fontWeight: '600', fontSize: FONT_SIZE.sm }}>
              Company profile
            </Text>
            <Text style={{ color: colors.primary, fontWeight: '800', fontSize: FONT_SIZE.sm }}>
              {completion}%
            </Text>
          </View>
          <View style={[s.barBg, { backgroundColor: colors.border }]}>
            <View style={[s.barFill, { width: `${completion}%` as any, backgroundColor: colors.primary }]} />
          </View>
          <Text style={{ color: colors.textMuted, fontSize: FONT_SIZE.xs, marginTop: 4 }}>
            {completion < 100
              ? 'Complete your profile to attract better talent'
              : 'Profile complete'}
          </Text>
        </View>

        {/* Stats */}
        <View style={[s.sectionHeader, { paddingHorizontal: spacing.lg }]}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>Overview</Text>
        </View>

        {isLoading ? (
          <View style={[s.skeletonRow, { paddingHorizontal: spacing.lg }]}>
            {[0, 1, 2, 3].map((k) => <SkeletonCard key={k} height={88} style={{ flex: 1 }} />)}
          </View>
        ) : (
          <View style={[s.statsGrid, { paddingHorizontal: spacing.lg }]}>
            <StatCard label="Jobs" value={stats?.totalJobs ?? 0} icon="briefcase-outline" color={colors.info} />
            <StatCard label="Active" value={stats?.activeJobs ?? 0} icon="radio-button-on" color={colors.success} />
            <StatCard label="Applications" value={stats?.totalApplications ?? 0} icon="document-text-outline" color={colors.warning} />
            <StatCard label="New Today" value={stats?.newApplications ?? 0} icon="notifications-outline" color={colors.danger} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={[s.sectionHeader, { paddingHorizontal: spacing.lg }]}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>Quick Actions</Text>
        </View>
        <View style={{ paddingHorizontal: spacing.lg, gap: 10 }}>
          <QuickAction
            icon="add-circle-outline"
            label="Post a New Job"
            sublabel="Reach thousands of candidates"
            color={colors.primary}
            colors={colors}
            onPress={() => navigation.navigate('CreateJob')}
          />
          <QuickAction
            icon="people-outline"
            label="View All Applicants"
            sublabel="Review pending applications"
            color={colors.organization}
            colors={colors}
            onPress={() => navigation.navigate('CompanyJobList')}
          />
          {!isVerified && (
            <QuickAction
              icon="shield-checkmark-outline"
              label={isPartial ? "Complete Verification" : "Get Verified"}
              sublabel="Build trust with candidates"
              color={isPartial ? colors.warning : colors.success}
              colors={colors}
              onPress={() => navigation.navigate('RoleVerification')}
            />
          )}
        </View>

        {/* Recent Jobs */}
        {recentJobs.length > 0 && (
          <>
            <View style={[s.sectionHeader, { paddingHorizontal: spacing.lg }]}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: FONT_SIZE.base }}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => navigation.navigate('CompanyJobList')}>
                <Text style={{ color: colors.primary, fontSize: FONT_SIZE.xs, fontWeight: '600' }}>See all</Text>
              </TouchableOpacity>
            </View>
            <View style={{ height: recentJobs.length * 90, paddingHorizontal: spacing.lg }}>
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
    </SafeAreaView>
  );
};

const s = StyleSheet.create({
  headerContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerLeft: { flex: 1 },
  avatarContainer: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarText: { fontSize: 20, fontWeight: '800' },
  verifiedBadge: { position: 'absolute', bottom: 0, right: 0, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  verifyBanner: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 16 },
  strengthCard: { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 28 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barBg: { height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill: { height: 8, borderRadius: 99 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow: { flexDirection: 'row', gap: 10 },
});

const jr = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  pill: { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
});

const qa = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  icon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});