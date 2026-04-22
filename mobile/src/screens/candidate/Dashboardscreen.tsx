/**
 * screens/candidate/DashboardScreen.tsx
 * "Command Center" for Candidate role.
 *
 * Sections:
 *  1. Profile hero card (avatar · name · email · role pill)
 *  2. Profile stats grid (Education · Experience · Skills · CVs · Certs)
 *  3. Profile-strength progress bar
 *  4. Application stat tiles
 *  5. Quick-action buttons
 *  6. Recent experience (FlashList)
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
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
  useCandidateRoleProfile,
} from '../../hooks/useProfile';
import { candidateService } from '../../services/candidateService';
import { SkeletonCard }     from '../../components/shared/ProfileAtoms';
import { StatCard }         from '../../components/shared/StatCard';
import type { CandidateStackParamList } from '../../navigation/CandidateNavigator';

type Nav = NativeStackNavigationProp<CandidateStackParamList>;

const ACCENT = '#F59E0B';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const getInitials = (name?: string) =>
  (name ?? 'C')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

// ─── Profile Hero Card ───────────────────────────────────────────────────────

interface HeroCardProps {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  onEdit: () => void;
  colors: any;
}

const ProfileHeroCard = React.memo<HeroCardProps>(
  ({ name, email, avatarUrl, onEdit, colors: c }) => (
    <View style={[hero.card, { backgroundColor: c.card, borderColor: c.border }]}>
      {/* Avatar */}
      <View style={hero.avatarWrap}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={hero.avatar} />
        ) : (
          <View style={[hero.avatarFallback, { backgroundColor: ACCENT }]}>
            <Text style={hero.initials}>{getInitials(name)}</Text>
          </View>
        )}
        {/* Online dot */}
        <View style={[hero.onlineDot, { borderColor: c.card }]} />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text style={[hero.name, { color: c.text }]} numberOfLines={1}>
          {name ?? 'Candidate'}
        </Text>
        <Text style={[hero.email, { color: c.textMuted }]} numberOfLines={1}>
          {email ?? ''}
        </Text>
        <View style={[hero.rolePill, { backgroundColor: ACCENT + '18' }]}>
          <View style={[hero.roleDot, { backgroundColor: ACCENT }]} />
          <Text style={[hero.roleText, { color: ACCENT }]}>Candidate</Text>
        </View>
      </View>

      {/* Edit button */}
      <TouchableOpacity
        onPress={onEdit}
        style={[hero.editBtn, { backgroundColor: c.background }]}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons name="pencil-outline" size={16} color={c.textMuted} />
      </TouchableOpacity>
    </View>
  ),
);

const hero = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
    marginBottom: 20,
  },
  avatarWrap: { position: 'relative' },
  avatar: { width: 62, height: 62, borderRadius: 31 },
  avatarFallback: {
    width: 62,
    height: 62,
    borderRadius: 31,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: { color: '#fff', fontWeight: '800', fontSize: 22 },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10B981',
    borderWidth: 2,
  },
  name: { fontSize: 17, fontWeight: '800', marginBottom: 2 },
  email: { fontSize: 12, marginBottom: 6 },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    gap: 4,
  },
  roleDot: { width: 6, height: 6, borderRadius: 3 },
  roleText: { fontSize: 11, fontWeight: '700' },
  editBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─── Profile Stat Chip ───────────────────────────────────────────────────────

const ProfileStatChip: React.FC<{
  icon: string;
  label: string;
  value: number | string;
  color: string;
  colors: any;
}> = React.memo(({ icon, label, value, color, colors: c }) => (
  <View style={[psc.chip, { backgroundColor: c.card, borderColor: c.border }]}>
    <View style={[psc.iconBox, { backgroundColor: color + '18' }]}>
      <Ionicons name={icon as any} size={16} color={color} />
    </View>
    <Text style={[psc.value, { color: c.text }]}>{value}</Text>
    <Text style={[psc.label, { color: c.textMuted }]}>{label}</Text>
  </View>
));

const psc = StyleSheet.create({
  chip: {
    flex: 1,
    minWidth: 90,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    gap: 4,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  value: { fontSize: 18, fontWeight: '800' },
  label: { fontSize: 10, textAlign: 'center' },
});

// ─── Quick Action Button ─────────────────────────────────────────────────────

const QuickAction: React.FC<{
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  colors: any;
}> = React.memo(({ icon, label, color, onPress, colors: c }) => (
  <TouchableOpacity
    style={[qa.btn, { backgroundColor: color + '12', borderColor: color + '30' }]}
    onPress={onPress}
    activeOpacity={0.75}
  >
    <View style={[qa.icon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon as any} size={18} color={color} />
    </View>
    <Text style={[qa.label, { color: c.text }]}>{label}</Text>
    <Ionicons name="chevron-forward" size={14} color={c.textMuted} />
  </TouchableOpacity>
));

const qa = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, fontWeight: '600', fontSize: 14 },
});

// ─── Experience Row ──────────────────────────────────────────────────────────

interface ExpRowProps {
  position: string;
  company: string;
  range: string;
  current: boolean;
  colors: any;
}

const ExperienceRow: React.FC<ExpRowProps> = React.memo(
  ({ position, company, range, current, colors: c }) => (
    <View style={[er.row, { backgroundColor: c.card, borderColor: c.border }]}>
      <View style={[er.dot, { backgroundColor: current ? '#10B981' : ACCENT }]} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '700', fontSize: 13 }}>{position}</Text>
        <Text style={{ color: ACCENT, fontWeight: '600', fontSize: 12 }}>{company}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{range}</Text>
      </View>
      {current && (
        <View style={er.currentPill}>
          <Text style={er.currentText}>Current</Text>
        </View>
      )}
    </View>
  ),
);

const er = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4, flexShrink: 0 },
  currentPill: {
    backgroundColor: '#10B98118',
    borderRadius: 99,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  currentText: { color: '#10B981', fontSize: 10, fontWeight: '700' },
});

// ─── Section Header ──────────────────────────────────────────────────────────

const SectionHeader: React.FC<{
  title: string;
  subtitle?: string;
  colors: any;
}> = ({ title, subtitle, colors: c }) => (
  <View style={s.sectionHeader}>
    <Text style={{ color: c.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
    {subtitle ? (
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{subtitle}</Text>
    ) : null}
  </View>
);

// ─── Main Screen ─────────────────────────────────────────────────────────────

export const CandidateDashboardScreen: React.FC = () => {
  const { theme }   = useThemeStore();
  const { colors }  = theme;
  const { user }    = useAuthStore();
  const navigation  = useNavigation<Nav>();
  const qc          = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: roleProfile }                         = useCandidateRoleProfile();
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useQuery({
    queryKey: ['candidate', 'stats'],
    queryFn:  candidateService.getApplicationStats,
    staleTime: 5 * 60 * 1000,
  });

  const completion   = profile?.profileCompletion?.percentage ?? 0;
  const skills       = roleProfile?.skills ?? [];
  const experience   = roleProfile?.experience ?? [];
  const education    = roleProfile?.education ?? [];
  const certs        = roleProfile?.certifications ?? [];

  const avatarUrl = profile?.avatar?.secure_url ?? null;

  const onRefresh = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['profile'] });
    qc.invalidateQueries({ queryKey: ['candidate', 'stats'] });
    refetchStats();
  }, [qc, refetchStats]);

  const renderExperience = useCallback(
    ({ item }: { item: (typeof experience)[0] }) => {
      const start = item.startDate ? new Date(item.startDate).getFullYear() : '';
      const end   = item.current
        ? 'Present'
        : item.endDate
        ? new Date(item.endDate).getFullYear()
        : '';
      return (
        <ExperienceRow
          position={item.position ?? ''}
          company={item.company ?? ''}
          range={`${start} – ${end}`}
          current={item.current ?? false}
          colors={colors}
        />
      );
    },
    [colors],
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background ?? colors.background }}
      contentContainerStyle={{ paddingTop: 56, paddingBottom: 48, paddingHorizontal: 16 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={profileLoading}
          onRefresh={onRefresh}
          tintColor={ACCENT}
        />
      }
    >
      {/* ── 1. Welcome greeting ─────────────────────────────── */}
      <View style={s.greeting}>
        <View>
          <Text style={{ color: colors.textMuted, fontSize: 13, fontWeight: '500' }}>
            Welcome back 👋
          </Text>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 24, letterSpacing: -0.5 }}>
            {user?.name?.split(' ')[0] ?? 'Candidate'}
          </Text>
        </View>
      </View>

      {/* ── 2. Profile hero card ─────────────────────────────── */}
      <ProfileHeroCard
        name={user?.name}
        email={user?.email}
        avatarUrl={avatarUrl}
        onEdit={() => navigation.navigate('EditProfile')}
        colors={colors}
      />

      {/* ── 3. Profile stats grid ────────────────────────────── */}
      <SectionHeader title="Profile Stats" colors={colors} />
      <View style={s.profileStatsGrid}>
        <ProfileStatChip icon="school-outline"         label="Education"   value={education.length}  color="#6366F1" colors={colors} />
        <ProfileStatChip icon="briefcase-outline"      label="Experience"  value={experience.length} color={ACCENT}  colors={colors} />
        <ProfileStatChip icon="sparkles-outline"       label="Skills"      value={skills.length}     color="#10B981" colors={colors} />
      </View>
      <View style={[s.profileStatsGrid, { marginTop: 10 }]}>
        <ProfileStatChip icon="ribbon-outline"         label="Certs"       value={certs.length}      color="#8B5CF6" colors={colors} />
        <ProfileStatChip icon="person-circle-outline"  label="Strength"    value={`${completion}%`}  color="#EF4444" colors={colors} />
      </View>

      {/* ── 4. Profile strength bar ─────────────────────────── */}
      <View style={[s.strengthCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={s.row}>
          <Text style={{ color: colors.text, fontWeight: '600', fontSize: 14 }}>
            Profile strength
          </Text>
          <Text style={{ color: ACCENT, fontWeight: '800', fontSize: 14 }}>{completion}%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}>
          <View
            style={[
              s.barFill,
              { width: `${completion}%` as any, backgroundColor: ACCENT },
            ]}
          />
        </View>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
          {completion < 100
            ? `Add ${100 - completion}% more to unlock better matches`
            : '🎉 Profile complete — fully visible to recruiters'}
        </Text>
      </View>

      {/* ── 5. Application stats ────────────────────────────── */}
      <SectionHeader title="Applications" colors={colors} />
      {statsLoading ? (
        <View style={s.skeletonRow}>
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
          <SkeletonCard height={88} style={{ flex: 1 }} />
        </View>
      ) : (
        <View style={s.statsGrid}>
          <StatCard label="Total"       value={stats?.total ?? 0}       icon="document-text-outline" color={ACCENT}    />
          <StatCard label="Pending"     value={stats?.pending ?? 0}     icon="time-outline"          color="#6366F1"   />
          <StatCard label="Shortlisted" value={stats?.shortlisted ?? 0} icon="star-outline"          color="#10B981"   />
          <StatCard label="Rejected"    value={stats?.rejected ?? 0}    icon="close-circle-outline"  color="#EF4444"   />
        </View>
      )}

      {/* ── 6. Quick actions ────────────────────────────────── */}
      <SectionHeader title="Quick Actions" colors={colors} />
      <View style={{ gap: 10 }}>
        <QuickAction
          icon="briefcase-outline"
          label="Browse Jobs"
          color={ACCENT}
          onPress={() => navigation.navigate('JobList' as any)}
          colors={colors}
        />
        <QuickAction
          icon="document-text-outline"
          label="Generate CV"
          color="#6366F1"
          onPress={() => navigation.navigate('CvTemplates')}
          colors={colors}
        />
        <QuickAction
          icon="shield-outline"
          label="Get Verified"
          color="#10B981"
          onPress={() => navigation.navigate('VerificationStatus')}
          colors={colors}
        />
        <QuickAction
          icon="gift-outline"
          label="Referrals & Rewards"
          color="#8B5CF6"
          onPress={() => navigation.navigate('Referral')}
          colors={colors}
        />
      </View>

      {/* ── 7. Skills chips ─────────────────────────────────── */}
      {skills.length > 0 && (
        <>
          <SectionHeader
            title="Skills"
            subtitle={`${skills.length} total`}
            colors={colors}
          />
          <View style={s.skillsWrap}>
            {skills.slice(0, 12).map((sk: string) => (
              <View
                key={sk}
                style={[s.skillChip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40' }]}
              >
                <Text style={{ color: ACCENT, fontSize: 12, fontWeight: '600' }}>{sk}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* ── 8. Recent experience ────────────────────────────── */}
      {experience.length > 0 && (
        <>
          <SectionHeader title="Experience" colors={colors} />
          <View style={{ height: Math.min(experience.length, 4) * 92 }}>
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

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  greeting:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  profileStatsGrid: { flexDirection: 'row', gap: 10 },
  strengthCard:  { borderRadius: 16, borderWidth: 1, padding: 16, marginTop: 20, marginBottom: 4 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  barBg:         { height: 8, borderRadius: 99, overflow: 'hidden', marginBottom: 4 },
  barFill:       { height: 8, borderRadius: 99 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 28,
    marginBottom: 12,
  },
  statsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  skeletonRow:   { flexDirection: 'row', gap: 10, marginBottom: 4 },
  skillsWrap:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
  },
});