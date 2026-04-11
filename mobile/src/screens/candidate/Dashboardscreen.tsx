import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore }  from '../../store/authStore';
import { useProfile, useCandidateRoleProfile } from '../../hooks/useProfile';
import { candidateService } from '../../services/candidateService';

const ACCENT = '#F59E0B';

const StatCard: React.FC<{ label: string; value: number | string; icon: string; color: string }> = ({ label, value, icon, color }) => {
  const { theme } = useThemeStore();
  const { colors } = theme;
  return (
    <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.statIcon, { backgroundColor: color + '18' }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[s.statVal, { color: colors.text }]}>{value}</Text>
      <Text style={[s.statLbl, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
};

export const CandidateDashboardScreen: React.FC = () => {
  const { theme } = useThemeStore();
  const { colors, typography, spacing } = theme;
  const { user } = useAuthStore();
  const { data: profile, isLoading } = useProfile();
  const { data: roleProfile } = useCandidateRoleProfile();
  const { data: stats } = useQuery({ queryKey: ['candidate','stats'], queryFn: candidateService.getApplicationStats, staleTime: 5 * 60 * 1000 });

  const completion = profile?.profileCompletion?.percentage ?? 0;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing[5], paddingTop: 56 }} showsVerticalScrollIndicator={false}>
      <Text style={[s.greeting, { color: colors.textMuted, fontSize: typography.sm }]}>Welcome back 👋</Text>
      <Text style={[s.name, { color: colors.text, fontSize: typography['2xl'] }]}>{user?.name ?? 'Candidate'}</Text>

      {/* Profile completion */}
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={s.row}>
          <Text style={[s.cardLabel, { color: colors.text }]}>Profile strength</Text>
          <Text style={[s.cardPct, { color: ACCENT }]}>{completion}%</Text>
        </View>
        <View style={[s.barBg, { backgroundColor: colors.border }]}>
          <View style={[s.barFill, { width: `${completion}%` as any, backgroundColor: ACCENT }]} />
        </View>
        {completion < 100 && (
          <Text style={[s.hint, { color: colors.textMuted, fontSize: typography.xs }]}>
            Complete your profile to get more job matches
          </Text>
        )}
      </View>

      {/* Stats */}
      <Text style={[s.section, { color: colors.text, fontSize: typography.base }]}>Applications</Text>
      {isLoading ? <ActivityIndicator color={ACCENT} style={{ marginVertical: 20 }} /> : (
        <View style={s.statsRow}>
          <StatCard label="Total"       value={stats?.total ?? 0}       icon="document-text"  color={ACCENT} />
          <StatCard label="Pending"     value={stats?.pending ?? 0}     icon="time"            color="#6366F1" />
          <StatCard label="Shortlisted" value={stats?.shortlisted ?? 0} icon="star"            color="#10B981" />
          <StatCard label="Rejected"    value={stats?.rejected ?? 0}    icon="close-circle"   color="#EF4444" />
        </View>
      )}

      {/* Skills snapshot */}
      {(roleProfile?.skills?.length ?? 0) > 0 && (
        <>
          <Text style={[s.section, { color: colors.text, fontSize: typography.base, marginTop: 20 }]}>Your Skills</Text>
          <View style={s.chips}>
            {roleProfile!.skills.slice(0, 8).map((skill) => (
              <View key={skill} style={[s.chip, { backgroundColor: ACCENT + '18', borderColor: ACCENT + '40' }]}>
                <Text style={[s.chipText, { color: ACCENT, fontSize: typography.xs }]}>{skill}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  greeting: { fontWeight: '500', marginBottom: 2 },
  name:     { fontWeight: '800', marginBottom: 20, letterSpacing: -0.5 },
  card:     { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 24 },
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  cardLabel:{ fontWeight: '600' },
  cardPct:  { fontWeight: '700' },
  barBg:    { height: 6, borderRadius: 99, overflow: 'hidden', marginBottom: 6 },
  barFill:  { height: 6, borderRadius: 99 },
  hint:     { marginTop: 2 },
  section:  { fontWeight: '700', marginBottom: 12 },
  statsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  statCard: { flex: 1, minWidth: '44%', borderRadius: 14, borderWidth: 1, padding: 14, alignItems: 'center', gap: 6 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statVal:  { fontWeight: '800', fontSize: 22 },
  statLbl:  { fontSize: 11, fontWeight: '500' },
  chips:    { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip:     { borderRadius: 99, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 4 },
  chipText: { fontWeight: '600' },
});