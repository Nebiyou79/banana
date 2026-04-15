/**
 * screens/candidate/DashboardScreen.tsx
 *
 * "Command Center" for Candidate role.
 * ─ Profile-strength progress card
 * ─ Application stat tiles (skeleton on load)
 * ─ FlashList of recent experience entries
 * ─ Skills chip row
 * ─ Quick-action buttons → Jobs, Profile
 */

import React, { useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useCandidateRoleProfile } from '../../hooks/useProfile';
import { candidateService } from '../../services/candidateService';
import { StatTile, SkeletonCard } from '../../components/shared/ProfileAtoms';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;

const ACCENT = '#F59E0B';

// ─── Quick Action Button ──────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: string; label: string; color: string; onPress: () => void;
}> = React.memo(({ icon, label, color, onPress }) => {
  const { theme } = useThemeStore();
  return (
    <TouchableOpacity
      style={[qa.btn, { backgroundColor: color + '12', borderColor: color + '30' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[qa.icon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <Text style={[qa.label, { color: theme.colors.text }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={14} color={theme.colors.textMuted} />
    </TouchableOpacity>
  );
});

// ─── Experience Row (FlashList item) ─────────────────────────────────────────

interface ExpRowProps {
  position: string;
  company:  string;
  range:    string;
  current:  boolean;
}

const ExperienceRow: React.FC<ExpRowProps> = React.memo(
  ({  company, range, current }) => {
    const { theme } = useThemeStore();
    return (
      <View style={[er.row, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
        <View style={[er.dot, { backgroundColor: current ? '#10B981' : ACCENT }]} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 12 }}>{company}</Text>
          <Text style={{ color: theme.colors.textMuted, fontSize: 11 }}>{range}</Text>
        </View>
        {current && (
          <View style={er.currentPill}>
            <Text style={er.currentText}>Current</Text>
          </View>
        )}
      </View>
    );
  },
);

// ─── Skill Chip ───────────────────────────────────────────────────────────────

const SkillChip: React.FC<{ skill: string }> = React.memo(({ skill }) => (
  <View style={chip.wrap}>
    <Text style={chip.text}>{skill}</Text>
  </View>
));

// ─── Main Screen ──────────────────────────────────────────────────────────────

export const CandidateDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const navigation = useNavigation<Nav>();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: roleProfile } = useCandidateRoleProfile();
  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['candidate', 'stats'],
    queryFn:  candidateService.getApplicationStats,
    staleTime: 5 * 60 * 1000,
  });

  const completion = profile?.profileCompletion?.percentage ?? 0;
  const skills = (roleProfile?.skills ?? []).slice(0, 10);
  const experience = roleProfile?.experience ?? [];

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    qc.invalidateQueries({ queryKey: ['candidate', 'stats'] });
    refetchStats();
  }, [qc, refetchStats]);

  const renderExperience = useCallback(
    ({ item }: { item: (typeof experience)[0] }) => (
      <ExperienceRow
        company={item.company ?? ''}
        range={`${item.startDate ? new Date(item.startDate).getFullYear() : ''}  – ${item.current ? 'Present' : item.endDate ? new Date(item.endDate).getFullYear() : ''}`}
        current={item.current ?? false} position={''}      />
    ),
    [],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={profileLoading} onRefresh={onRefresh} tintColor={ACCENT} />
      }
    >
      {/* ── Header greeting ─────────────────────────────────────────────── */}
      <View style={[s.headerRow, { paddingHorizontal: spacing[5] }]}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: typography.sm, fontWeight: '500' }}>
            Welcome back 👋
          </Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: typography['2xl'], letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] ?? 'Candidate'}
          </Text>
        </View>
        <TouchableOpacity
          style={[s.avatarBtn, { backgroundColor: ACCENT + '18' }]}
          onPress={() => navigation.navigate('EditProfile')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="person" size={20} color={ACCENT} />
        </TouchableOpacity>
      </View>

      {/* ── Profile strength card ───────────────────────────────────────── */}
      <View style={[s.strengthCard, { backgroundColor: colors.surface, borderColor: colors.border, marginHorizontal: spacing[5] }]}>
        <View style={s.row}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: typography.sm }}>
            Profile strength
          </Text>
          <Text style={{ color: ACCENT, fontWeight: '800', fontSize: typography.sm }}>{completion}%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}>
          <View style={[s.barFill, { width: `${completion}%` as any, backgroundColor: ACCENT }]} />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: typography.xs, marginTop: 4 }}>
          {completion < 100
            ? `Add ${100 - completion}% more to unlock better matches`
            : '🎉 Profile complete — you\'re fully visible to recruiters'}
        </Text>
      </View>

      {/* ── Application stats ───────────────────────────────────────────── */}
      <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Applications</Text>
      </View>

      {statsLoading ? (
        <View style={[s.skeletonRow, { paddingHorizontal: spacing[5] }]}>
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
        </View>
      ) : (
        <View style={[s.statsGrid, { paddingHorizontal: spacing[5] }]}>
          <StatTile label="Total"       value={stats?.total ?? 0}       icon="document-text-outline"  color={ACCENT}     />
          <StatTile label="Pending"     value={stats?.pending ?? 0}     icon="time-outline"            color="#6366F1"    />
          <StatTile label="Shortlisted" value={stats?.shortlisted ?? 0} icon="star-outline"            color="#10B981"    />
          <StatTile label="Rejected"    value={stats?.rejected ?? 0}    icon="close-circle-outline"    color="#EF4444"    />
        </View>
      )}

      {/* ── Quick actions ───────────────────────────────────────────────── */}
      <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Quick Actions</Text>
      </View>
      <View style={{ paddingHorizontal: spacing[5], gap: 10 }}>
        <QuickAction icon="briefcase-outline" label="Browse Jobs"     color={ACCENT}   onPress={() => navigation.navigate('JobList')}    />
        <QuickAction icon="person-outline"    label="Update Profile"  color="#6366F1"  onPress={() => navigation.navigate('EditProfile')} />
        <QuickAction icon="shield-outline"    label="Get Verified"    color="#10B981"  onPress={() => navigation.navigate('VerificationStatus')} />
      </View>

      {/* ── Skills ──────────────────────────────────────────────────────── */}
      {skills.length > 0 && (
        <>
          <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Skills</Text>
            <Text style={{ color: colors.textMuted, fontSize: typography.xs }}>{roleProfile?.skills?.length ?? 0} total</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: spacing[5], gap: 8 }}>
            {skills.map((sk) => (
              <SkillChip key={sk} skill={sk} />
            ))}
          </ScrollView>
        </>
      )}

      {/* ── Experience (FlashList) ───────────────────────────────────────── */}
      {experience.length > 0 && (
        <>
          <View style={[s.sectionHeader, { paddingHorizontal: spacing[5] }]}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: typography.base }}>Experience</Text>
          </View>
          <View style={{ height: experience.slice(0, 4).length * 92, paddingHorizontal: spacing[5] }}>
            <FlashList
              data={experience.slice(0, 4)}
              renderItem={renderExperience}
              keyExtractor={(_, i) => String(i)}
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
  skeletonRow:  { flexDirection: 'row', gap: 10, marginBottom: 4 },
});

const qa = StyleSheet.create({
  btn:   { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  icon:  { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  label: { flex: 1, fontWeight: '600', fontSize: 14 },
});

const er = StyleSheet.create({
  row:         { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  dot:         { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  currentPill: { backgroundColor: '#10B98118', borderRadius: 99, paddingHorizontal: 8, paddingVertical: 3 },
  currentText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
});

const chip = StyleSheet.create({
  wrap: { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40', borderWidth: 1, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 5 },
  text: { color: ACCENT, fontSize: 12, fontWeight: '600' },
});