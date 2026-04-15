/**
 * screens/organization/
 * ─ DashboardScreen.tsx
 * ─ ProfileScreen.tsx
 * ─ EditProfileScreen.tsx
 * ─ MoreScreen.tsx
 *
 * All four Organization role screens, strictly isolated from Company / Candidate styles.
 * Accent colour: #8B5CF6 (violet).
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
 
import { useThemeStore }  from '../../store/themeStore';
import { useAuthStore }   from '../../store/authStore';
import {
  useProfile,

} from '../../hooks/useProfile';
import { organizationService } from '../../services/organizationService';
import {
 SkeletonCard,
  StatTile,
} from '../../components/shared/ProfileAtoms';
import type { OrganizationStackParamList } from '../../navigation/OrganizationNavigator';
 
type Nav  = NativeStackNavigationProp<OrganizationStackParamList>;
const ACC = '#8B5CF6';

interface OrgJobRow {
  _id: string; title: string; status: string; applicantCount?: number; deadline?: string;
}

const OrgJobListItem: React.FC<{ item: OrgJobRow; onPress: () => void }> = React.memo(
  ({ item, onPress }) => {
    const { theme } = useThemeStore();
    const isActive  = item.status === 'active';
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
              <Text style={{ color: isActive ? '#10B981' : theme.colors.textMuted, fontSize: 10, fontWeight: '700' }}>{item.status}</Text>
            </View>
            {item.applicantCount !== undefined && (
              <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>
                {item.applicantCount} applicant{item.applicantCount !== 1 ? 's' : ''}
              </Text>
            )}
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

export const OrganizationDashboardScreen: React.FC = () => {
  const { theme }   = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user }    = useAuthStore();
  const navigation  = useNavigation<Nav>();
  const qc          = useQueryClient();

  const { data: profile }                = useProfile();
  const { data: stats, isLoading: sLoad, refetch: rs } = useQuery({
    queryKey: ['org', 'stats'],
    queryFn:  organizationService.getDashboardStats,
    staleTime: 5 * 60 * 1000,
  });
  const { data: jobs, isLoading: jLoad, refetch: rj } = useQuery({
    queryKey: ['org', 'jobs'],
    queryFn:  organizationService.getMyJobs,
    staleTime: 5 * 60 * 1000,
  });

  const completion = profile?.profileCompletion?.percentage ?? 0;
  const recentJobs = (jobs ?? []).slice(0, 5);
  const isLoading  = sLoad || jLoad;

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    rs(); rj();
  }, [qc, rs, rj]);

  const renderJob = useCallback(({ item }: { item: OrgJobRow }) => (
    <OrgJobListItem
      item={item}
      onPress={() => navigation.navigate('ApplicationList', { jobId: item._id, jobTitle: item.title })}
    />
  ), [navigation]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={ACC} />}
    >
      {/* Greeting */}
      <View style={[dsh.greeting, { paddingHorizontal: spacing[5] }]}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, fontWeight: '500' }}>Welcome back 👋</Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] ?? 'Organization'}
          </Text>
        </View>
        <TouchableOpacity
          style={[dsh.iconBtn, { backgroundColor: ACC + '18' }]}
          onPress={() => navigation.navigate('EditProfile')}
        >
          <Ionicons name="people" size={20} color={ACC} />
        </TouchableOpacity>
      </View>

      {/* Strength */}
      <View style={[dsh.card, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: spacing[5] }]}>
        <View style={dsh.row}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>Organization profile</Text>
          <Text style={{ color: ACC, fontWeight: '800', fontSize: typography.sm }}>{completion}%</Text>
        </View>
        <View style={[dsh.barBg, { backgroundColor: colors.border }]}>
          <View style={[dsh.barFill, { width: `${completion}%` as any, backgroundColor: ACC }]} />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }}>
          {completion < 100 ? 'Complete your profile to unlock all features' : '✓ Profile complete'}
        </Text>
      </View>

      {/* Stats */}
      <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Overview</Text>
      </View>

      {isLoading ? (
        <View style={[dsh.skeleRow, { paddingHorizontal: spacing[5] }]}>
          {[0, 1, 2, 3].map((k) => <SkeletonCard key={k} height={88} style={{ flex: 1 }} />)}
        </View>
      ) : (
        <View style={[dsh.grid, { paddingHorizontal: spacing[5] }]}>
          <StatTile label="Jobs"         value={stats?.totalJobs ?? 0}         icon="briefcase-outline"     color={ACC}      />
          <StatTile label="Active"       value={stats?.activeJobs ?? 0}        icon="radio-button-on"       color="#10B981"  />
          <StatTile label="Applications" value={stats?.totalApplications ?? 0} icon="document-text-outline" color="#F59E0B"  />
          <StatTile label="New Today"    value={stats?.newApplications ?? 0}   icon="notifications-outline" color="#EF4444"  />
        </View>
      )}

      {/* Quick actions */}
      <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Quick Actions</Text>
      </View>
      <View style={{ paddingHorizontal: spacing[5], gap: 10 }}>
        <QuickAction icon="add-circle-outline"        label="Post Opportunity"   sub="Jobs, volunteering, internships" color={ACC}      onPress={() => navigation.navigate('OrgJobCreate')} />
        <QuickAction icon="people-outline"             label="View Applicants"   sub="Review and manage candidates"   color="#6366F1"  onPress={() => navigation.navigate('OrgJobList')} />
        <QuickAction icon="shield-checkmark-outline"   label="Get Verified"     sub="Boost trust with applicants"    color="#10B981"  onPress={() => navigation.navigate('VerificationStatus')} />
      </View>

      {/* Recent postings */}
      {recentJobs.length > 0 && (
        <>
          <View style={[dsh.sectionRow, { paddingHorizontal: spacing[5] }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Recent Postings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('OrgJobList')}>
              <Text style={{ color: ACC, fontSize: typography.xs, fontWeight: '600' }}>See all →</Text>
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

const dsh = StyleSheet.create({
  greeting:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  iconBtn:    { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  card:       { borderRadius: 18, borderWidth: 1, padding: 16, marginBottom: 28 },
  row:        { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barBg:      { height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill:    { height: 8, borderRadius: 99 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 28, marginBottom: 12 },
  grid:       { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeleRow:   { flexDirection: 'row', gap: 10 },
  jobRow:     { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 8 },
  pill:       { borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  qa:         { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 14 },
  qaIcon:     { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});